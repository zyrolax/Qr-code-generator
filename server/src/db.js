import mongoose from "mongoose";

export async function connectDB(uri) {
  const mongoUri = uri || process.env.MONGODB_URI || "mongodb://localhost:27017/requesto";
  await mongoose.connect(mongoUri);
  console.log(`MongoDB connected: ${mongoUri}`);
  return mongoose.connection;
}
