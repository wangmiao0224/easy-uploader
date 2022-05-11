module.exports={
  devServer: {
    port: 8888,
    proxy: {
      '/': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    },
  },
  chainWebpack(config) {
    // set worker-loader
    config.module
      .rule('worker')
      .test(/\.worker\.(js|ts)$/)
      .use('worker-loader')
      .loader('worker-loader')
      .end();

    // 解决：worker 热更新问题
    config.module.rule('js').exclude.add(/\.worker\.(js|ts)$/);
    config.output.globalObject('this')
  },
  parallel: false,
}