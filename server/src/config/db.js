import mongoose from 'mongoose';

const GRIDFS_BUCKET_NAME = 'uploads';

let bucket = null;
let bucketDb = null;

mongoose.set('strictQuery', true);

export const connectDB = async (uri) => {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  return mongoose.connection;
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  bucket = null;
  bucketDb = null;
};

/**
 * Returns the GridFS bucket bound to the current connection.
 * Re-created whenever the underlying database handle changes (reconnects, tests).
 */
export const getBucket = () => {
  const { db } = mongoose.connection;
  if (!db) {
    throw new Error('Database is not connected');
  }
  if (!bucket || bucketDb !== db) {
    bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: GRIDFS_BUCKET_NAME });
    bucketDb = db;
  }
  return bucket;
};
