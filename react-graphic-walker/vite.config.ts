import { defineConfig } from 'vite'
import path from 'path';
import react from '@vitejs/plugin-react'
import { copyFileSync, mkdirSync, rmSync } from "fs";
import { resolve } from "path";
import { peerDependencies } from './package.json'


// @see https://styled-components.com/docs/faqs#marking-styledcomponents-as-external-in-your-package-dependencies
const modulesNotToBundle = Object.keys(peerDependencies);

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        port: 2002,
    },
    plugins: [
        react(),
        {
            name: "move-files",
            closeBundle() {
                const base = "../ckanext/graphic_walker";

                // Ensure destination directories exist
                mkdirSync(resolve(base, "assets/js"), { recursive: true });

                // Move JS files
                copyFileSync(
                    resolve(base, "public/graphic-walker/assets/js/graphic-walker.min.js"),
                    resolve(base, "assets/js/graphic-walker.min.js")
                );

                // Remove public/assets directory
                rmSync(resolve(base, "public/graphic-walker/assets"), { recursive: true, force: true });
            },
        },
    ],
    resolve: {
        dedupe: modulesNotToBundle,
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    build: {
        outDir: "../ckanext/graphic_walker/public/graphic-walker",
        rollupOptions: {
            input: "src/main.tsx",
            external: [/index\.css$/],
            output: {
                format: "iife",
                entryFileNames: "assets/js/graphic-walker.min.js",
                chunkFileNames: "assets/js/graphic-walker.min.js",
                assetFileNames: "[name].[ext]",
                globals: {
                    react: "React",
                    "react-dom": "ReactDOM",
                    'styled-components': 'styled',
                    'react-dom/client': 'ReactDOMClient',
                },
            },
        }
    }
})
