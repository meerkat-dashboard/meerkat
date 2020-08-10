const path = require('path');

module.exports = {
  entry: './src/index.tsx',
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
    ]
  },
  resolve: {
    extensions: [ '.jsx', '.ts', '.js' ],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devtool: 'source-map'
};