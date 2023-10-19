import custom from './webpack.config.js';

const config = {
  framework: '@storybook/react-webpack5',
  stories: ['../stories/**/*.@(js|jsx|mjs|ts|tsx)'],

  addons: [
    '@storybook/addon-essentials',
  ],

  features: {
    storyStoreV7: false,
  },

  // staticDirs: ['../static'],

  webpackFinal: async (config) => {
    // console.log('config', config);
    // delete config.resolve.fallback.fs;
    const finalConfig = {
      ...config,
      module: { ...config.module, rules: [
        ...custom.module.rules,
        ...config.module.rules.filter(rule => {
          return rule.test
            ? rule.test.toString().indexOf('css') === -1 && rule.test.toString().indexOf('svg') === -1
            : true;
        }),
      ] },
      resolve: { ...config.resolve,
        alias: {
          ...config.resolve.alias,
          ...custom.resolve.alias,
        },
        // fallback: {
        //   ...config.resolve.fallback,
        //   ...custom.resolve.fallback,
        // },
        fallback: custom.resolve.fallback,
      },
      plugins: [...config.plugins, ...custom.plugins],
    };

    console.log('finalConfig', finalConfig);
    return finalConfig;
  },
};

export default config;
