import clientPromise from './mongodb'

export async function getCollection(collectionName: string) {
  const client = await clientPromise

  return client.db(process.env.DATABASE_NAME).collection(collectionName)
}
