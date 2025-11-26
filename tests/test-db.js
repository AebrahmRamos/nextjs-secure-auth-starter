import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer;

/**
 * Connect to the in-memory database
 */
export async function connectTestDB() {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri);
    console.log('Connected to in-memory test database');
}

/**
 * Drop database, close the connection and stop mongo server
 */
export async function closeTestDB() {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    }
    if (mongoServer) {
        await mongoServer.stop();
    }
    console.log('Closed in-memory test database');
}

/**
 * Remove all data from collections
 */
export async function clearTestDB() {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
}

export default {
    connectTestDB,
    closeTestDB,
    clearTestDB,
};
