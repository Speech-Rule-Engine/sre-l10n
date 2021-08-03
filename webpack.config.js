const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: './ts/index.ts',
  mode: 'development',
  target: 'node',
  output: {
    path: path.resolve(__dirname, 'dist'),
    library: 'srel10n',
    libraryTarget: 'umd',
    globalObject: 'this',
    filename: 'srel10n.js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      }
    ],
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
  },
  devtool: 'inline-source-map',
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({
      terserOptions: { 
        output: {
          ascii_only: true
        }
      }
    })]
  }
};
