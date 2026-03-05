'use strict';

const webpack = require('webpack');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

const project = require('../../package.json');

const version = process.env.EXTENSION_VERSION || project.version;

const extensionConfig = project['auth0-extension'] || {};
const settings = Object.assign({}, extensionConfig.settings || {}, {
  NODE_ENV: 'production',
  CLIENT_VERSION: version
});

Object.keys(settings).forEach((k) => {
  settings[k] = JSON.stringify(settings[k]);
});

module.exports = {
  mode: 'production',
  target: 'node',
  entry: path.resolve(__dirname, '../../webtask.js'),
  // Optional/conditional requires from transitive deps that are not available at build time
  externals: {
    edge: 'commonjs edge',
    'superagent-proxy': 'commonjs superagent-proxy'
  },
  output: {
    path: path.resolve(__dirname, '../../dist'),
    filename: `auth0-authz.extension.${version}.js`,
    library: {
      type: 'commonjs2'
    }
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: [ { loader: 'babel-loader' } ],
        exclude: path.resolve(__dirname, '../../node_modules/')
      },
      { test: /\.m?js/, resolve: { fullySpecified: false } }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({ 'process.env': settings }),
    new webpack.BannerPlugin({
      banner: '"use strict";',
      raw: true
    }),
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1
    }),
    // Strip all moment.js locales (not used by server code)
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/
    })
  ],
  optimization: {
    minimize: true,
    splitChunks: false,
    usedExports: true,
    sideEffects: true,
    concatenateModules: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          mangle: true,
          output: {
            comments: false
          },
          compress: {
            sequences: true,
            dead_code: true,
            conditionals: true,
            booleans: true,
            unused: true,
            if_return: true,
            join_vars: true,
            drop_console: true
          }
        }
      })
    ]
  },
  resolve: {
    // Use CJS-first resolution to avoid ESM default export interop issues
    // (e.g. hexoid's ESM build uses 'export default' which breaks CJS consumers)
    mainFields: [ 'main', 'module' ],
    extensions: [ '.js', '.jsx', '.json' ],
    modules: [ 'node_modules' ]
  }
};
