const express = require('express')
const path = require('path')
const VueServerRenderer = require('vue-server-renderer')
const Webpack = require('webpack')
const WebpackDevMiddleware = require('webpack-dev-middleware')
const WebpackHotMiddleware = require('webpack-hot-middleware')
const [webpackConfigServer, webpackConfigWeb] = require('./webpack.config')
const app = express()
const isProduction = process.env.NODE_ENV === 'production'
let renderer = null
/**
 *
 * @param fs
 * @returns {BundleRenderer}
 */
const generateRenderer = (fs) => {
  if (!fs) fs = require('fs')
  const serverBundlePath = path.resolve(__dirname, './public/vue-ssr-server-bundle.json')
  const clientBundlePath = path.resolve(__dirname, './public/vue-ssr-client-manifest.json')
  const templatePath = path.resolve(__dirname, './index.html')
  return VueServerRenderer.createBundleRenderer(
    JSON.parse(fs.readFileSync(serverBundlePath, 'utf-8')),
    {
      clientManifest: JSON.parse(fs.readFileSync(clientBundlePath, 'utf-8')),
      runInNewContext: false,
      template: require('fs').readFileSync(templatePath, 'utf-8')
    }
  )
}
if (isProduction) {
  renderer = generateRenderer()
} else {
  const webCompiler = Webpack(webpackConfigWeb)
  const serverCompiler = Webpack(webpackConfigServer)
  const devMiddleware = WebpackDevMiddleware(webCompiler, {
    logLevel: 'warn',
    publicPath: webpackConfigWeb.output.publicPath
  })
  const hotMiddleware = WebpackHotMiddleware(webCompiler, { log: false })
  app.use(devMiddleware)
  app.use(hotMiddleware)
  serverCompiler.outputFileSystem = devMiddleware.fileSystem
  webCompiler.hooks.beforeCompile.tap('Console Rest', () => {
    process.stdout.write('\033c ')
    console.info('Recompiling assets...')
  })
  webCompiler.hooks.afterEmit.tap('Web Compilation', (stats) => {
    process.stdout.write('\033c ')
    console.time('\nCompilation Time')
    console.info(`*** WEB COMPILATION COMPLETE ***\n`)
    console.group('Generated Assets')
    Object.keys(stats.assets).forEach(a => console.info(a))
    console.groupEnd()
    serverCompiler.run((err, stats) => {
      console.info(`\n*** SERVER COMPILATION COMPLETE *** \n`)
      console.group('Generated Assets')
      Object.keys(stats.compilation.assets).forEach(a => console.info(a))
      console.groupEnd()
      renderer = generateRenderer(devMiddleware.fileSystem)
      console.timeEnd('\nCompilation Time')
    })
  })
}
app.use('/public/', express.static('public'))
app.get('*', (req, res) => {
  if (!renderer) {
    res.status(500).send('Rendering.....please wait...')
    return
  }
  renderer.renderToStream({
    url: req.url,
    title: req.url
  })
    .on('error', (err) => {
      if (err.message === '404') {
        res.send(require('fs').readFileSync(
          path.resolve(__dirname, './error.html'),
          'utf-8'))
      } else {
        res.send(require('fs').readFileSync(
          path.resolve(__dirname, './error.html'),
        'utf-8'))
      }
    }).pipe(res)
})

app.listen(process.env.PORT || 8070, function () {
  console.log(`Server was started at ${process.env.PORT || 8070}`)
})
