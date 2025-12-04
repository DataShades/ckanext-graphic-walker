# ckanext-graphic-walker

CKAN resource preview based on [Graphic Walker](https://github.com/Kanaries/graphic-walker/).

## Requirements

Python 3.10+

| CKAN version    | Compatible?   |
| --------------- | ------------- |
| 2.9 and earlier | no            |
| 2.10            | yes           |
| 2.11            | yes           |


## Installation

To install ckanext-graphic-walker:

1. Activate your CKAN virtual environment, for example:
    ```sh
    . /usr/lib/ckan/default/bin/activate
    ```

2. Clone the source and install it on the virtualenv
    ```sh
    git clone https://github.com/DataShades/ckanext-graphic-walker.git
    cd ckanext-graphic-walker
    pip install -e .
    ```
3. Add `graphic_walker_view` to the `ckan.plugins` and `ckan.views.default_views` setting in your CKAN config file (by default the config file is located at `/etc/ckan/default/ckan.ini`).

4. Restart CKAN. For example if you've deployed CKAN with Apache on Ubuntu:
    ```sh
    sudo service apache2 reload
    ```

## Config settings

See the [config declaration](./ckanext/graphic_walker/config_declaration.yml) file.

## Tests

To run the tests, do:
```sh
pytest --ckan-ini=test.ini
```

## Releasing a new version of ckanext-graphic-walker

The Graphic Walker is a separate React application. You can run it separately:

```sh
cd react-graphic-walker
npm install
npm run dev
```
And build it after changes:
```sh
npm run build
```

## License

[AGPL](https://www.gnu.org/licenses/agpl-3.0.en.html)
