import mongoose from "mongoose";

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected || mongoose.connection.readyState >= 1) {
    isConnected = true;
    return;
  }

  const uri = process.env.MONGODB_URI ||
    (process.env.DATABASE_URL?.startsWith("mongodb") ? process.env.DATABASE_URL : undefined);

  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Please add a MongoDB connection string to your environment variables.\n" +
      "  Replit Secrets: add MONGODB_URI = mongodb+srv://user:pass@cluster.mongodb.net/plutonium\n" +
      "  Local dev:      add MONGODB_URI=mongodb://localhost:27017/plutonium to artifacts/api-server/.env\n" +
      "  Get a free cluster at: https://www.mongodb.com/cloud/atlas"
    );
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  isConnected = true;
  console.log("[MongoDB] Connected");
}

export { mongoose };
