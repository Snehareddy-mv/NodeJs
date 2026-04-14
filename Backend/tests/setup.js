
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Connect to test database before all tests
beforeAll(async () => {
  const testDbUrl = process.env.MONGO_URL.replace('/test', '/test-db');
  await mongoose.connect(testDbUrl);
});

// Clear all collections after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Disconnect after all tests
afterAll(async () => {
  await mongoose.connection.close();
});