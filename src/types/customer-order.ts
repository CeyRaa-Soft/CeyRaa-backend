export type CustomerOrderItem = {
  categoryId: string
  categoryName: string
  designId: string
  designCode: string
  designName: string
  color: string
  size: string
  quantity: number
  price: number // unitPrice from design sizes
}

export type CustomerOrder = {
  id: string // e.g. CORD001
  customerName: string
  address: string
  phone1: string
  phone2?: string
  items: CustomerOrderItem[]
  totalAmount: number // sum of (item.quantity * item.price)
  status: 'Pending' | 'Sent' | 'Returned' | 'Failed'
  createdAt: string
}
