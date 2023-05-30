/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  setupFiles: ["<rootDir>/.jest/setEnvVars.js"]
  // globals: {
  //   'ts-jest': {
  //     isolatedModules: true
  //   }
  // }
};