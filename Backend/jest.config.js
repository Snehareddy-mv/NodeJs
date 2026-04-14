module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setEnv.js'],  // Runs FIRST
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],  // Runs AFTER
  testTimeout: 10000,
  verbose: true,
   maxWorkers: 1
};