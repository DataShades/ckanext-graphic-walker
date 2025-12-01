import ckan.plugins as plugins
import ckan.plugins.toolkit as toolkit
from ckan import types

from ckanext.graphic_walker.schema import get_preview_schema
from ckanext.graphic_walker import const


class GraphicWalkerPlugin(plugins.SingletonPlugin):
    plugins.implements(plugins.IConfigurer)
    plugins.implements(plugins.IResourceView)

    # IConfigurer

    def update_config(self, config_):
        toolkit.add_template_directory(config_, "templates")
        toolkit.add_public_directory(config_, "public")
        toolkit.add_resource("assets", "graphic_walker")

    # IResourceView

    def info(self):
        return {
            "name": "graphic_walker_view",
            "title": "Graphic Walker Viewer",
            "icon": "fa fa-chart-bar",
            "iframed": True,
            "always_available": True,
            "default_title": "Graphic Walker Viewer",
            "schema": get_preview_schema(),
        }

    def can_view(self, data_dict):
        resource = data_dict.get("resource")

        if not resource:
            return False

        return resource.get("format", "").lower() in const.SUPPORTED_FORMATS

    def view_template(self, context: types.Context, data_dict: types.DataDict) -> str:
        return "graphic_walker/graphic_walker_view.html"

    def form_template(self, context: types.Context, data_dict: types.DataDict) -> str:
        return "graphic_walker/graphic_walker_form.html"

    def setup_template_variables(
        self, context: types.Context, data_dict: types.DataDict
    ) -> dict[str, str]:
        data_dict["resource_view"].setdefault("title", "Mirumiru Viewer")

        file_url = data_dict["resource_view"].get("file_url", "")
        resource_url = data_dict["resource"]["url"]

        data_dict.update(
            {
                "resource_format": (data_dict["resource"].get("format") or "").lower(),
                "resource_url": file_url or resource_url,
            }
        )

        return {}
