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

  staticDirs: ['../static'],

  webpackFinal: async (config) => {
    console.log('config.plugins', config.plugins);
    return {
      ...config,
      module: { ...config.module, rules: [
        ...custom.module.rules,
        ...config.module.rules.filter(rule => {
          return rule.test
            ? rule.test.toString().indexOf('css') === -1 && rule.test.toString().indexOf('svg') === -1
            : true;
        })
      ] },
      resolve: { ...config.resolve, alias: {
        ...custom.resolve.alias,
        ...config.resolve.alias,
       } },
      plugins: [...config.plugins, ...custom.plugins],
    };
  },
};

export default config;
