import logging

import requests
from urllib.parse import urlsplit
from flask import Blueprint, Response

import ckan.plugins.toolkit as tk

from ckanext.graphic_walker import config


log = logging.getLogger(__name__)


graphic_walker = Blueprint("graphic_walker", __name__)


def proxy_resource(url: str) -> Response:
    if tk.current_user.is_anonymous:
        return tk.abort(401, tk._("Unauthorized access to proxy."))

    log.debug("Proxying resource: %s", url)

    parts = urlsplit(url)

    if not parts.scheme or not parts.netloc:
        return tk.abort(409, tk._("Invalid URL."))

    timeout = config.get_proxy_timeout()
    max_file_size = config.get_url_file_max_size()
    chunk_size = config.get_proxy_chunk_size()

    proxy = tk.config.get("ckan.download_proxy")
    proxies = {"http": proxy, "https": proxy} if proxy else None

    headers = {}
    range_header = tk.request.headers.get("Range")

    if range_header:
        headers["Range"] = range_header

    headers["User-Agent"] = (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        " (KHTML, like Gecko) Chrome/94.0.4606.72 Safari/537.36"
    )

    try:
        did_get = False
        r = requests.head(url, timeout=timeout, proxies=proxies, headers=headers)

        # If HEAD fails with specific errors, try GET immediately
        if r.status_code in (400, 403, 405):
            r = requests.get(
                url, timeout=timeout, stream=True, headers=headers, proxies=proxies
            )
            did_get = True

        r.raise_for_status()

        if not did_get:
            r = requests.get(
                url, timeout=timeout, stream=True, headers=headers, proxies=proxies
            )

        content_type = r.headers.get("content-type")
        content_length = r.headers.get("content-length")

        if max_file_size and content_length and int(content_length) > max_file_size:
            return tk.abort(409, detail="Content is too large to be proxied.")

        def generate():
            total = 0

            for chunk in r.iter_content(chunk_size=chunk_size):
                total += len(chunk)

                if max_file_size and total > max_file_size:
                    log.warning(
                        "Proxying stopped: content exceeded max size (%s bytes)",
                        max_file_size,
                    )
                    break
                yield chunk

        result = Response(generate(), status=r.status_code, content_type=content_type)

        if content_length:
            result.headers["Content-Length"] = content_length

        if "Content-Range" in r.headers:
            result.headers["Content-Range"] = r.headers["Content-Range"]

        result.headers["Access-Control-Allow-Origin"] = "*"

        return result

    except requests.exceptions.HTTPError as error:
        details = "Could not proxy resource."
        if error.response is not None:
            details += f" Server responded with {error.response.status_code} {error.response.reason}"
        return tk.abort(409, detail=details)

    except requests.exceptions.ConnectionError as error:
        return tk.abort(
            502,
            detail=f"Could not proxy resource because a connection error occurred. {error}",
        )

    except requests.exceptions.Timeout:
        return tk.abort(
            504, detail="Could not proxy resource because the connection timed out."
        )


def proxy_view():
    url = tk.request.args.get("url")

    if not url:
        return tk.abort(404, tk._("No URL specified"))

    return proxy_resource(url)


graphic_walker.add_url_rule("/gw/proxy_view", view_func=proxy_view)
