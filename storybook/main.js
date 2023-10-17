const config = {
  framework: '@storybook/react-webpack5',
  stories: ['../stories/**/*.@(js|jsx|mjs|ts|tsx)'],
  // addons: ['@storybook/addon-essentials'],
  // docs: {
  //   autodocs: 'tag',
  // },
  staticDirs: ['../static'],
};

export default config;
