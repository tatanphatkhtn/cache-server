const path = require('path');
// eslint-disable-next-line import/no-extraneous-dependencies
const slsw = require('serverless-webpack');
// eslint-disable-next-line import/no-extraneous-dependencies
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: slsw.lib.entries,
  target: 'node',
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [['@babel/preset-env', { targets: { node: true } }]]
            }
          }
        ]
      }
    ]
  },
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, 'build'),
    filename: '[name].js'
  }
};
