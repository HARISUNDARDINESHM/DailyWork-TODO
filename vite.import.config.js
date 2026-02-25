// vite.import.config.js
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        ssr: 'import_script.js',
        outDir: 'dist_import',
        target: 'node16'
    }
});
