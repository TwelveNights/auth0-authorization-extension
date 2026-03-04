'use strict';

const webpack = require('webpack');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

const project = require('../../package.json');

const version = process.env.EXTENSION_VERSION || project.version;

const extensionConfig = project['auth0-extension'] || {};
const settings = extensionConfig.settings || {};
// Define each setting as an individual process.env.KEY replacement so that
// the runtime process.env object is preserved for environment variables
// injected by the webtask context (AUTH0_DOMAIN, credentials, etc.)
const defines = {
  'process.env.NODE_ENV': JSON.stringify('production'),
  'process.env.CLIENT_VERSION': JSON.stringify(version)
};
Object.keys(settings).forEach((key) => {
  defines[`process.env.${key}`] = JSON.stringify(settings[key]);
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
    new webpack.DefinePlugin(defines),
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
    // Prefer ESM builds ('module') over CJS ('main') to enable tree shaking
    mainFields: [ 'module', 'main' ],
    extensions: [ '.js', '.jsx', '.json' ],
    modules: [ 'node_modules' ]
  }
};
