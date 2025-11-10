import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSass } from '@rsbuild/plugin-sass';

export default defineConfig({
  plugins: [pluginReact(), pluginSass()],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  html: {
    template: './src/index.html',
  },
  source: {
    include: ['./src/**/*.scss'],
    entry: {
      index: './src/index.tsx'
    }
  },
  output: {
    polyfill: 'entry',
    cleanDistPath: true,
  },
});