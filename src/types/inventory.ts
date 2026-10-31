import type { ColorVariant } from './order'

export type DressCategory = {
  id: string // e.g., "Short001", "CropTop03", "Dress002"
  name: string // e.g., "Shorts", "Crop Tops", "Dresses"
  prefix: string // e.g., "SHRT", "CROP", "DRS"
  wardrobeType?: "Queen's Wardrobe" | "King's Wardrobe"
  createdAt?: string
}

export type DesignImage = {
  color: string
  url: string
  publicId?: string
}

export type DesignOffer = {
  active: boolean
  discountPercentage: number // e.g. 10 for 10%
  originalPrice: number
  offerPrice: number
  startDate?: string
}

export type Collection = {
  id: string
  name: string
  description?: string
  imageUrl?: string
  createdAt?: string
  updatedAt?: string
}

export type Design = {
  id: string // unique database ID
  code: string // readable unique short code, e.g., "SHRT001"
  categoryId: string // references DressCategory.id
  name: string // e.g., "Floral crop top"
  variants: ColorVariant[] // colors and sizes with quantities
  images: DesignImage[] // images uploaded for each color variant
  mediaVideoUrl?: string | null // Video or GIF showcase
  mediaVideoPublicId?: string | null
  sizeChartText?: string | null
  sizeChartImageUrl?: string | null
  sizeChartPublicId?: string | null
  availableSizes?: string[] | null
  defaultCollection?: "Queen's Wardrobe" | "King's Wardrobe" | null
  customCollection?: string | null // name of custom collection
  offer?: DesignOffer | null
  createdAt?: string
  updatedAt?: string
}
