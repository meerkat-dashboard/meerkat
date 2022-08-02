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
  resolve: {
    extensions: [ '.jsx', '.ts', '.js' ],
    alias: {
      "react": "preact/compat",
      "react-dom/test-utils": "preact/test-utils",
      "react-dom": "preact/compat",
    }
  },
  devtool: 'source-map'
};
