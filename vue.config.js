module.exports={
  devServer: {
    port: 8888,
    proxy: {
      '/': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
}