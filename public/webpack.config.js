const path = require('path');

module.exports = {
  entry: './public/src/index.js',
  mode: process.env.NODE_ENV || 'development',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'var',
    library: 'Lib'
  },
  devServer: {
    host: '127.0.0.1',
    static: {
      directory: path.resolve(__dirname, 'dist'),
    },
    hot: true,
    https: true
  }
};
