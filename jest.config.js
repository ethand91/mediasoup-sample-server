module.exports = {
  testMatch: [ '**/test/**/*.test.js' ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/test/',
  ]
}
