import mongoose from 'mongoose';

// Import all models to ensure indexes are registered
import '../models/User.js';
import '../models/UserSkill.js';
import '../models/SkillCatalog.js';
import '../models/Session.js';
import '../models/BeltHistory.js';
import '../models/Follow.js';
import '../models/Activity.js';

const TEST_URI = 'mongodb://localhost:27017/code-dojo-test';

beforeAll(async () => {
  await mongoose.connect(TEST_URI);
  // Drop the test database to clear stale indexes
  await mongoose.connection.db.dropDatabase();
  // Sync all indexes from current schemas
  await mongoose.syncIndexes();
});

afterEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});
