module.exports = {
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      diagnostics: true,
    },
  },
  collectCoverage : true,
  collectCoverageFrom: ['packages/**/src/**/*.{js,ts}', 'packages/**/fixtures/**/*.{js.ts}', '!**/node_modules/**'],
  //coverageReporters: ['json', 'lcov', 'text', 'clover'],
  coverageDirectory: 'coverage',
};
