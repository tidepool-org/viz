/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/test'],
  moduleNameMapper: {
    'styles/colors\\.css$': '<rootDir>/test/helpers/colorsMock.js',
    registerStaticFiles: '<rootDir>/src/modules/print/__mocks__/registerStaticFiles.js',
    '^crossfilter$': 'crossfilter2',
    '^fs$': 'pdfkit/js/virtual-fs.js',
    '\\.(css)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '<rootDir>/test/**/*.test.js',
  ],
  silent: true,
  testTimeout: 15000,
  transform: {
    '^.+[\\\\/]node_modules[\\\\/].+\\.(js|jsx|ts|tsx)$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'ecmascript',
            jsx: true,
          },
          target: 'es2020',
        },
        module: {
          type: 'commonjs',
        },
      },
    ],
    '^.+\\.(js|jsx|ts|tsx)$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'ecmascript',
            jsx: true,
          },
          transform: {
            react: {
              runtime: 'automatic',
            },
          },
          target: 'es2020',
        },
        module: {
          type: 'commonjs',
        },
      },
    ],
  },
  maxWorkers: '50%',
  workerIdleMemoryLimit: '512MB',
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|d3-array|d3-format|d3-scale|d3-shape|d3-time|d3-time-format|d3-interpolate|d3-color|d3-path|d3-ease|d3-timer|d3-voronoi|internmap|sundial|reductio|crossfilter2|react-markdown|vfile|vfile-message|unist-util-.*|unified|bail|is-plain-obj|trough|remark-parse|remark-rehype|mdast-util-.*|hast-util-.*|micromark|micromark-.*|decode-named-character-reference|character-entities|property-information|comma-separated-tokens|space-separated-tokens|web-namespaces|hastscript|trim-lines|ccount|escape-string-regexp|markdown-table|zwitch|longest-streak|rehype-raw|hast-to-hyperscript|sinon|victory|victory-core))',
  ],
};

module.exports = config;
