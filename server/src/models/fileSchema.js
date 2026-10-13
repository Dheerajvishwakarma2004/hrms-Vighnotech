import mongoose from 'mongoose';

/** Reference to a file stored in the GridFS `uploads` bucket. */
export const fileSchema = new mongoose.Schema(
  {
    fileId: { type: mongoose.Schema.Types.ObjectId, required: true },
    filename: { type: String, required: true, trim: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);
