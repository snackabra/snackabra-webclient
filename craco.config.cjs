const { InjectManifest } = require('workbox-webpack-plugin');

module.exports = {
    // ...
    babel: {
        presets: [
            ['@babel/preset-env'],
            '@babel/preset-react',
        ],
        plugins: [
            ["@babel/plugin-proposal-decorators", { "version": "2018-09", "decoratorsBeforeExport": true }],
            ["@babel/plugin-transform-private-property-in-object", { "loose": true }],
            ["@babel/plugin-transform-private-methods", { "loose": true }],
            ["@babel/plugin-proposal-class-properties", { "loose": true }],
        ],
    },
    webpack: {
        configure: (config, { env, paths }) => {
            if(process.env.SWDEV === 'true'){
                // process.env.NODE_ENV = 'development';
                config.entry['service-worker'] = './src/service-worker.js';
                config.plugins.push(
                    new InjectManifest({
                        swSrc: './src/service-worker.js',
                        maximumFileSizeToCacheInBytes: 100000000,
                        swDest: 'service-worker.js',
                    })
                );
            }

            return config;
        },
    },
};