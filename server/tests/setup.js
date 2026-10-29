import { beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// Spin up an in-memory MongoDB so tests need no local DB and leave no state.
let mongo;

beforeAll(async () => {
  // Minimal env the app/middleware expect during tests.
  process.env.JWT_SECRET = "test-secret";
  process.env.NODE_ENV = "test";
  process.env.CLIENT_ORIGIN = "http://localhost:5173";
  process.env.BASE_URL = "http://localhost:5173";

  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterEach(async () => {
  // Wipe collections between tests for isolation.
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});
