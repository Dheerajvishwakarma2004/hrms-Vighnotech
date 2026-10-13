import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../../src/config/db.js';
import * as models from '../../src/models/index.js';

let mongod;

/** Starts an isolated in-memory MongoDB for the current test file and builds all indexes. */
export const startTestDb = async () => {
  mongod = await MongoMemoryServer.create();
  await connectDB(mongod.getUri('hrms-test'));
  await Promise.all(Object.values(models).map((model) => model.syncIndexes()));
};

/** Empties every collection (indexes are kept). */
export const clearTestDb = async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
};

export const stopTestDb = async () => {
  await disconnectDB();
  await mongod.stop();
};

/** Hooks every test file uses: fresh database per file, clean collections per test. */
export const useTestDb = () => {
  beforeAll(startTestDb);
  afterEach(clearTestDb);
  afterAll(stopTestDb);
};

export const gridFsFileExists = async (fileId) =>
  (await mongoose.connection.db
    .collection('uploads.files')
    .countDocuments({ _id: new mongoose.Types.ObjectId(String(fileId)) })) > 0;

export const countGridFsFiles = () => mongoose.connection.db.collection('uploads.files').countDocuments();
