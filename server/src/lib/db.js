import mongoose from "mongoose";

const { MONGO_URI } = process.env;
if (!MONGO_URI) throw new Error("Missing MONGO_URI");

let cached = global._mongoose;
if (!cached) cached = global._mongoose = { conn: null, promise: null };

export async function dbConnect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI, { bufferCommands: false });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
