import path from "path";
import { fileURLToPath } from "url";

// returns a rooted path name to the current working directory.
function getwd() {
	return path.resolve(".");
}

export default {
  entry: {
    viewer: "./src/viewer.jsx",
    editor: "./src/edit.jsx",
  },
  output: {
    filename: "[name].js",
    // Can't use __dirname like in webpack docs as we're in an ES
    // module.
    path: path.join(getwd(), "dist"),
  },
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
  performance: {
    // we used to be at 875K. Let's never go bigger than that again!
    maxAssetSize: 870*1024,
    maxEntrypointSize: 870*1024,
  },
};
