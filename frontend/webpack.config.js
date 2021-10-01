const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

const version = fs.readFileSync(
  path.resolve(path.join(__dirname, '../version')),
  'utf8'
);

module.exports = {
  entry: './src/index.jsx',
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: [
              ["@babel/plugin-transform-react-jsx", {
                "pragma": "h", // default pragma is React.createElement
                "pragmaFrag": "Preact.Fragment", // default is React.Fragment
              }]
            ]
          }
        }
      }
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      __MEERKAT_VERSION__: JSON.stringify(version)
    })
  ],
  resolve: {
    extensions: [ '.jsx', '.ts', '.js' ],
    alias: {
      "react": "preact/compat",
      "react-dom/test-utils": "preact/test-utils",
      "react-dom": "preact/compat",
    }
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devtool: 'source-map'
};
