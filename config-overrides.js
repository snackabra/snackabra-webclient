module.exports = function override(config, env) {
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
          ["@babel/plugin-proposal-decorators", { "version": "2018-09", "decoratorsBeforeExport": true }],
          ["@babel/plugin-proposal-class-properties", { "loose": true }]
        ],
      },
    },
  })

  return config
}
