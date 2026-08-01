export type SizeInfo = {
  size: string
  quantity: number
  unitPrice: number
}

export type ColorVariant = {
  id: string
  color: string
  sizes: SizeInfo[]
}

export type OrderItem = {
  id: string
  name: string
  variants: ColorVariant[]
}

export type Order = {
  id: string
  supplier: string
  date: string
  status: 'Pending' | 'Approved' | 'Delivered'
  items: OrderItem[]
  type?: 'default' | 'template'
  categories?: OrderCategory[]
  stageImages?: { url: string; publicId: string }[]
  defaultSummary?: {
    totalCost: number
    clothes: {
      fabric: string
      amount: number
      unit: 'Yards' | 'Meters' | 'Kgs'
    }[]
  }
  createdAt?: string
}

export type OrderCategory = {
  id: string
  name: string
  items: OrderItem[]
}

export type Supplier = {
  id: string
  name: string
  category?: string
  address?: string
  phone?: string
  bankDetails?: string
  description?: string
  notes?: string[]
  createdAt?: string
}
