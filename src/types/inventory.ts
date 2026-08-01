import type { ColorVariant } from './order'

export type DressCategory = {
  id: string // e.g., "Short001", "CropTop03", "Dress002"
  name: string // e.g., "Shorts", "Crop Tops", "Dresses"
  prefix: string // e.g., "SHRT", "CROP", "DRS"
  createdAt?: string
}

export type DesignImage = {
  color: string
  url: string
  publicId?: string
}

export type Design = {
  id: string // unique database ID
  code: string // readable unique short code, e.g., "SHRT001"
  categoryId: string // references DressCategory.id
  name: string // e.g., "Floral crop top"
  variants: ColorVariant[] // colors and sizes with quantities
  images: DesignImage[] // images uploaded for each color variant
  createdAt?: string
}
