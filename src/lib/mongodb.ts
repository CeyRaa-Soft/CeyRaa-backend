import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!uri) {
  // Prevent build-time crashes when MONGODB_URI is not set in the build context.
  // It returns a rejected promise that will fail gracefully if called.
  clientPromise = Promise.reject(
    new Error("Please define the MONGODB_URI environment variable inside .env"),
  );
  // Catch the rejection immediately to avoid UnhandledPromiseRejectionWarning during build
  clientPromise.catch(() => {});
} else {
  if (process.env.NODE_ENV === "development") {
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri);
      globalWithMongo._mongoClientPromise = client.connect().catch((err) => {
        // Clear the cache on failure so we attempt connection again next time
        delete globalWithMongo._mongoClientPromise;
        throw err;
      });
    }

    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }
}

export default clientPromise;
