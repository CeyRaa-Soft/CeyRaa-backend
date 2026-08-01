import { getCollection } from '../lib/database'
import type { CustomerOrder } from '../types/customer-order'

const COLLECTION = 'customer_orders'

function cleanDoc(doc: any): CustomerOrder | null {
  if (!doc) return null
  const { _id, ...rest } = doc
  return rest as CustomerOrder
}

export type CustomerOrdersFilter = {
  categoryId?: string
  designId?: string
  color?: string
  size?: string
}

export async function getCustomerOrders(
  filter: CustomerOrdersFilter,
  page: number = 1,
  limit: number = 20
): Promise<{ orders: CustomerOrder[]; total: number }> {
  const collection = await getCollection(COLLECTION)

  // Build query
  const query: any = {}
  if (filter.categoryId) {
    query['items.categoryId'] = filter.categoryId
  }
  if (filter.designId) {
    query['items.designId'] = filter.designId
  }
  if (filter.color) {
    query['items.color'] = { $regex: new RegExp(`^${filter.color}$`, 'i') }
  }
  if (filter.size) {
    query['items.size'] = { $regex: new RegExp(`^${filter.size}$`, 'i') }
  }

  const skip = (page - 1) * limit

  const total = await collection.countDocuments(query)
  const docs = await collection
    .find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray()

  return {
    orders: docs.map(cleanDoc) as CustomerOrder[],
    total
  }
}

export async function getCustomerOrderById(id: string): Promise<CustomerOrder | null> {
  const collection = await getCollection(COLLECTION)
  const doc = await collection.findOne({ id })
  return cleanDoc(doc)
}

export async function getNextCustomerOrderId(): Promise<string> {
  const collection = await getCollection(COLLECTION)
  // Sort by id descending to get the highest ID
  const lastOrder = await collection
    .find({ id: /^CORD\d+$/i })
    .sort({ id: -1 })
    .limit(1)
    .toArray()

  if (lastOrder.length === 0) {
    return 'CORD001'
  }

  const lastId = lastOrder[0].id
  const numStr = lastId.replace(/^CORD/i, '')
  const lastNum = parseInt(numStr, 10) || 0
  const nextNum = lastNum + 1
  const paddedNum = String(nextNum).padStart(3, '0')
  return `CORD${paddedNum}`
}

export async function createCustomerOrder(
  data: Omit<CustomerOrder, 'id' | 'createdAt' | 'totalAmount'> & {
    id?: string
    createdAt?: string
  }
): Promise<CustomerOrder> {
  const collection = await getCollection(COLLECTION)
  const nextId = data.id || (await getNextCustomerOrderId())
  const totalAmount = (data.items || []).reduce((acc, item) => acc + item.quantity * item.price, 0)

  const newOrder: CustomerOrder = {
    ...data,
    id: nextId,
    totalAmount,
    createdAt: data.createdAt || new Date().toISOString()
  }

  await collection.insertOne(newOrder)
  return newOrder
}

export async function updateCustomerOrder(
  id: string,
  data: Partial<CustomerOrder>
): Promise<CustomerOrder | null> {
  const { id: _, createdAt: __, ...updateData } = data as any
  const collection = await getCollection(COLLECTION)

  if (updateData.items) {
    updateData.totalAmount = (updateData.items || []).reduce(
      (acc: number, item: any) => acc + item.quantity * item.price,
      0
    )
  }

  await collection.updateOne({ id }, { $set: updateData })
  return getCustomerOrderById(id)
}

export async function deleteCustomerOrder(id: string): Promise<boolean> {
  const collection = await getCollection(COLLECTION)
  const res = await collection.deleteOne({ id })
  return res.deletedCount > 0
}
