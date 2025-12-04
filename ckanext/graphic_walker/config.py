import ckan.plugins.toolkit as tk

CONF_REMOTE_MAX_SIZE = "ckanext.graphic_walker.url_file_max_size"


def get_url_file_max_size() -> int:
    return tk.config[CONF_REMOTE_MAX_SIZE]
