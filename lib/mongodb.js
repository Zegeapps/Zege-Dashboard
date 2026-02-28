import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = globalThis.mongoose;

if (!cached) {
    cached = globalThis.mongoose = { conn: null, promise: null };
}

async function connectDB() {
    if (!MONGO_URI) {
        console.error('--- ERROR: MONGO_URI is missing from process.env ---');
        throw new Error('Database Connection Error: MONGO_URI is not defined. Please check your .env file.');
    }

    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000,
        };

        cached.promise = mongoose.connect(MONGO_URI, opts).then((mongoose) => {
            return mongoose;
        }).catch(err => {
            console.error('--- MongoDB Connection Error: ---', err.message);
            throw err;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

export default connectDB;
