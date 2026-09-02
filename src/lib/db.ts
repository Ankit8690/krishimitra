import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  // Do not throw at import time in dev — some routes may not need DB.
  // Individual callers will fail loudly if URI is missing.
  console.warn("[db] MONGODB_URI is not set. Set it in .env.local");
}

type Cached = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = global as unknown as { _mongoose?: Cached };
const cached: Cached =
  globalWithMongoose._mongoose ?? { conn: null, promise: null };
globalWithMongoose._mongoose = cached;

export async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;
  if (!MONGODB_URI) throw new Error("MONGODB_URI is missing");

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 8000,
      })
      .then((m) => m);
  }
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    // Reset the cache so the next call gets a fresh connection attempt
    // (fixes stuck state after Atlas IP whitelist / network change).
    cached.promise = null;
    cached.conn = null;
    throw err;
  }
}
