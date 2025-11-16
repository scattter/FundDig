export default {
  root: './src',
  build: {
    outDir: '../dist',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        pathRewrite: { '^/api': '' },
      },
    },
  },
  preview: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        pathRewrite: { '^/api': '' },
      },
    },
  },
};
