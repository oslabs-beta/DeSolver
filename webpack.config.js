const HtmlWebpackPlugin = require('html-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const path = require('path');
const { ESLint } = require('eslint');

module.exports = {
  entry: './client/index.js',
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'bundle.js',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, './client/index.html'),
    }),
    new ESLintPlugin(),
  ],
  mode: process.env.NODE_ENV,
  module: {
    rules: [
      {
        test: /\.jsx?/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
<<<<<<< HEAD
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
=======
            presets: [
              '@babel/preset-env',
              '@babel/preset-react',
              '@babel/preset-typescript',
            ],
          },
        },
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
>>>>>>> 1a669f1ef10bd8ecc468dc4facbe8a67510828a9
    ],
  },
  devServer: {
    static: {
      publicPath: '/build',
      directory: path.join(__dirname, 'build'),
    },
  },
  resolve: {
    // Enable importing JS / JSX files without specifying their extension
<<<<<<< HEAD
    extensions: ['.js', '.jsx'],
=======
    extensions: ['.js', '.jsx', '.tsx', '.ts'],
>>>>>>> 1a669f1ef10bd8ecc468dc4facbe8a67510828a9
  },
};
