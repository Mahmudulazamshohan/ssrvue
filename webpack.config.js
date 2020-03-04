
const Path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { VueLoaderPlugin } = require('vue-loader')
const Webpack = require('webpack')
const WebpackMerge = require('webpack-merge')
const WebpackNodeExternals = require('webpack-node-externals')
const VueSSRClientPlugin = require('vue-server-renderer/client-plugin')
const VueSSRServerPlugin = require('vue-server-renderer/server-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const env = process.env.NODE_ENV
const isProduction = env === 'production'

const base = {
  mode: isProduction ? 'production' : 'development',
  module: {
    rules: [{
      test: /\.vue$/,
      loader: 'vue-loader',
      options: {
        loaders: {
          scss: [
            'vue-style-loader',
            'css-loader',
            'sass-loader'
          ],
          sass: [
            'vue-style-loader',
            'css-loader',
            'sass-loader?indentedSyntax'
          ]
        }
        // other vue-loader options go here
      }
    }, {
      test: /\.css$/,
      use: isProduction ? [
        MiniCssExtractPlugin.loader,
        'css-loader'
      ] : [
        'vue-style-loader',
        'css-loader'
      ]
    }, {
      test: /\.sass$/,
      use: [
        'vue-style-loader',
        'css-loader',
        'sass-loader?indentedSyntax'
      ]
    }, {
      test: /\.scss$/,
      use: [
        'vue-style-loader',
        'css-loader',
        'sass-loader'
      ]
    }, {
      test: /\.js$/,
      loader: 'babel-loader',
      exclude: /node_modules/
    }, {
      test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
      loader: 'file-loader',
      options: {
        name: 'images/[name].[hash:8].[ext]'
      }
    }, {
      test: /\.(woff2?)(\?.*)?$/,
      loader: 'url-loader',
      query: {
        limit: 10000,
        mimetype: 'application/font-woff'
      }
    },
    {
      test: /\.(ttf|otf)(\?.*)?$/,
      loader: 'url-loader',
      query: {
        limit: 10000,
        mimetype: 'application/octet-stream'
      }
    },
    {
      test: /\.eot(\?.*)?$/,
      loader: 'file-loader'
    }]
  },
  output: {
    path: Path.resolve(__dirname, './public'),
    publicPath: '/public/',
    filename: '[name].[hash:8].js'
  },
  plugins: [
    new VueLoaderPlugin()
  ],
  resolve: {
    alias: {
      vue$: 'vue/dist/vue.esm.js',
      '@': Path.resolve(__dirname, './src')
    },
    extensions: ['.js', '.vue']
  }
}

if (isProduction) {
  base.plugins.unshift(new MiniCssExtractPlugin({
    filename: '[name].[hash:8].css',
    chunkFilename: '[name].[hash:8].css'
  }))
}
const web = WebpackMerge(base, {
  target: 'web',
  devtool: isProduction ? false : 'source-map',
  entry: ['./src/entry-web.js'],
  plugins: [
    new VueSSRClientPlugin()
  ]
})

if (!isProduction) {
  web.entry.unshift('webpack-hot-middleware/client?quiet=true&reload=true')
  web.plugins.push(new Webpack.HotModuleReplacementPlugin())
  web.plugins.push(new Webpack.NoEmitOnErrorsPlugin())
}

const server = WebpackMerge(base, {
  target: 'node',
  entry: ['./src/entry-server.js'],
  externals: WebpackNodeExternals({
    whitelist: ['isomorphic-fetch', 'vue', 'vue-router', 'vuex']
  }),
  output: {
    libraryTarget: 'commonjs2'
  },
  plugins: [
    new VueSSRServerPlugin()
  ],
  optimization: {
    minimize: true,

    minimizer: [
      new OptimizeCSSAssetsPlugin()]
  }
})

module.exports = [server, web]
