import ckan.plugins.toolkit as tk

CONF_REMOTE_MAX_SIZE = "ckanext.graphic_walker.url_file_max_size"
CONF_PROXY_TIMEOUT = "ckanext.graphic_walker.proxy.timeout"
CONF_PROXY_CHUNK_SIZE = "ckanext.graphic_walker.proxy.chunk_size"


def get_url_file_max_size() -> int:
    return tk.config[CONF_REMOTE_MAX_SIZE]


def get_proxy_timeout() -> int:
    return tk.config[CONF_PROXY_TIMEOUT]


def get_proxy_chunk_size() -> int:
    return tk.config[CONF_PROXY_CHUNK_SIZE]
