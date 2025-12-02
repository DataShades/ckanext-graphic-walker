import { inject } from '@vercel/analytics';
import { embedGraphicWalker } from './vanilla';
import './main.css';

if (!import.meta.env.DEV) {
    inject();
}

const rootElement = document.getElementById('root') as HTMLElement;
const ckanResourceUrl = rootElement?.getAttribute('data-url') || undefined;

embedGraphicWalker(rootElement, {
    geoList: [
        { name: 'World Countries', type: 'GeoJSON', url: 'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json' },
        {
            name: 'World Cities',
            type: 'GeoJSON',
            url: 'https://raw.githubusercontent.com/drei01/geojson-world-cities/f2a988af4bc15463df55586afbbffbd3068b7218/cities.geojson',
        },
    ],
    ckanResourceUrl,
    style: {
        flex: 1,
        minHeight: 0
    }
});
