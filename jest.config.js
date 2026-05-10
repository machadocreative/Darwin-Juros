module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/**/*.test.js',
    '!node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/js/$1',
  },
};
