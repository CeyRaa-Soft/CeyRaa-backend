import { getCollection } from '../lib/database'
import type { Order } from '../types/order'

const COLLECTION = 'supplier_orders'

export const DEFAULT_ORDER_CATEGORIES = [
  { id: 'production', name: 'Sewing & Tailoring (Garments)', items: [] },
  { id: 'supplies', name: 'Fabrics & Accessories (Materials)', items: [] },
  { id: 'other', name: 'Other Expenses (Courier, Packaging, etc.)', items: [] }
]

function cleanOrder(doc: any): Order | null {
  if (!doc) return null
  const { _id, ...rest } = doc
  if (!rest.categories || rest.categories.length === 0) {
    rest.categories = DEFAULT_ORDER_CATEGORIES
  }
  return rest as Order
}

export async function getOrders(): Promise<Order[]> {
  const docs = await (await getCollection(COLLECTION)).find({}).sort({ createdAt: -1 }).toArray()
  return docs.map(cleanOrder) as Order[]
}

export async function getOrderById(id: string): Promise<Order | null> {
  const doc = await (await getCollection(COLLECTION)).findOne({ id })
  return cleanOrder(doc)
}

export async function getNextOrderId(): Promise<string> {
  const collection = await getCollection(COLLECTION)
  // Sort by id descending to get the highest ID
  const lastOrder = await collection
    .find({ id: /^ORD\d+$/i })
    .sort({ id: -1 })
    .limit(1)
    .toArray()

  if (lastOrder.length === 0) {
    return 'ORD001'
  }

  const lastId = lastOrder[0].id
  const numStr = lastId.replace(/^ORD/i, '')
  const lastNum = parseInt(numStr, 10)
  const nextNum = lastNum + 1
  const paddedNum = String(nextNum).padStart(3, '0')
  return `ORD${paddedNum}`
}

export async function createOrder(data: Omit<Order, 'id'> & { id?: string }) {
  const nextId = data.id || (await getNextOrderId())
  const newOrder = {
    ...data,
    id: nextId,
    createdAt: new Date().toISOString()
  }

  await (await getCollection(COLLECTION)).insertOne(newOrder)
  return newOrder
}

export async function updateOrder(id: string, data: Partial<Order>) {
  const { id: _, createdAt: __, ...updateData } = data as any

  await (await getCollection(COLLECTION)).updateOne({ id }, { $set: updateData })

  return getOrderById(id)
}

export async function deleteOrder(id: string) {
  return (await getCollection(COLLECTION)).deleteOne({ id })
}
