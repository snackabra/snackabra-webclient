const { InjectManifest } = require('workbox-webpack-plugin');
const path = require("path");

module.exports = {
  webpack: function (config, env) {
    if (env !== 'development') {
      config.optimization = {
        ...config.optimization,
        minimize: false,
      }
      config.module.rules.push({
        test: /\.js$/,
        exclude: /node_modules[/\\](?!react-native-gifted-chat|react-native-lightbox|react-native-parsed-text|expo-av|react-native-typing-animation)/,
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: false,
            configFile: false,
            presets: [
              ['@babel/preset-env', { useBuiltIns: 'usage' }],
              '@babel/preset-react',
            ],
            plugins: ['macros',
              ['@babel/plugin-proposal-private-methods', { loose: true }],
              ["@babel/plugin-proposal-decorators", { "version": "2018-09", "decoratorsBeforeExport": true }],
              ["@babel/plugin-proposal-class-properties", { "loose": true }]
            ],
          },
        },
      })
    } else {

      config.module.rules.push({
        test: /\.js$/,
        exclude: /node_modules[/\\](?!react-native-gifted-chat|react-native-lightbox|react-native-parsed-text|expo-av|react-native-typing-animation)/,
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: false,
            configFile: false,
            presets: [
              ['@babel/preset-env', { useBuiltIns: 'usage' }],
              '@babel/preset-react',
            ],
            plugins: ['macros',
              ['@babel/plugin-proposal-private-methods', { loose: true }],
              ["@babel/plugin-proposal-decorators", { "version": "2018-09", "decoratorsBeforeExport": true }],
              ["@babel/plugin-proposal-class-properties", { "loose": true }],

            ],
          },
        },
      })
      // config.entry['service-worker'] = './src/service-worker.js';
      // config.plugins.push(
      //   new InjectManifest({
      //     swSrc: './src/service-worker.js',
      //     swDest: 'service-worker.js',
      //   })
      // );

    }

    return config
  },
  devServer: function (configFunction) {
    // Return the replacement function for create-react-app to use to generate the Webpack
    // Development Server config. "configFunction" is the function that would normally have
    // been used to generate the Webpack Development server config - you can use it to create
    // a starting configuration to then modify instead of having to create a config from scratch.
    return function (proxy, allowedHost) {
      // Create the default config by calling configFunction with the proxy/allowedHost parameters
      const config = configFunction(proxy, allowedHost);

      return config;
    };
  },
}