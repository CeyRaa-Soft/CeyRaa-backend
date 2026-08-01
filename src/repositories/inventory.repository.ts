import { getCollection } from '../lib/database'
import type { DressCategory, Design } from '../types/inventory'

const CATEGORY_COLLECTION = 'dress_categories'
const DESIGN_COLLECTION = 'designs'

function cleanDoc<T>(doc: any): T | null {
  if (!doc) return null
  const { _id, ...rest } = doc
  return rest as T
}

// Helper to generate a default 3-4 character prefix from category name
export function generatePrefix(name: string): string {
  const clean = name.replace(/[^a-zA-Z]/g, '').toUpperCase()
  if (clean.length <= 4) return clean.padEnd(3, 'X')

  // Extract consonants if possible, otherwise just use first 4 chars
  const consonants = clean.replace(/[AEIOU]/g, '')
  if (consonants.length >= 3) {
    return consonants.slice(0, 4)
  }
  return clean.slice(0, 4)
}

// Helper to normalize name for ID generation (e.g., "Crop Top" -> "CropTop")
function normalizeCategoryName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, '').replace(/\s+/g, '')
}

/* ==========================================================================
   Dress Category Repository Operations
   ========================================================================== */

export async function getDressCategories(): Promise<DressCategory[]> {
  const collection = await getCollection(CATEGORY_COLLECTION)
  const docs = await collection.find({}).sort({ name: 1 }).toArray()
  return docs.map(cleanDoc) as DressCategory[]
}

export async function getDressCategoryById(id: string): Promise<DressCategory | null> {
  const collection = await getCollection(CATEGORY_COLLECTION)
  const doc = await collection.findOne({ id })
  return cleanDoc<DressCategory>(doc)
}

export async function getNextCategoryIncrementId(name: string): Promise<string> {
  const collection = await getCollection(CATEGORY_COLLECTION)
  const normalized = normalizeCategoryName(name)

  // Find all categories starting with the normalized name
  const regex = new RegExp(`^${normalized}\\d+$`, 'i')
  const existing = await collection.find({ id: regex }).sort({ id: -1 }).limit(1).toArray()

  if (existing.length === 0) {
    return `${normalized}01`
  }

  const lastId = existing[0].id
  const numStr = lastId.substring(normalized.length)
  const lastNum = parseInt(numStr, 10) || 0
  const nextNum = lastNum + 1
  const paddedNum = String(nextNum).padStart(2, '0')
  return `${normalized}${paddedNum}`
}

export async function createDressCategory(
  data: Omit<DressCategory, 'id' | 'prefix'> & { id?: string; prefix?: string }
): Promise<DressCategory> {
  const nextId = data.id || (await getNextCategoryIncrementId(data.name))
  const prefix = data.prefix ? data.prefix.toUpperCase() : generatePrefix(data.name)

  const newCategory: DressCategory = {
    ...data,
    id: nextId,
    prefix,
    createdAt: new Date().toISOString()
  }

  const collection = await getCollection(CATEGORY_COLLECTION)
  await collection.insertOne(newCategory)
  return newCategory
}

export async function updateDressCategory(
  id: string,
  data: Partial<DressCategory>
): Promise<DressCategory | null> {
  const { id: _, createdAt: __, ...updateData } = data as any
  const collection = await getCollection(CATEGORY_COLLECTION)

  if (updateData.prefix) {
    updateData.prefix = updateData.prefix.toUpperCase()
  }

  await collection.updateOne({ id }, { $set: updateData })
  return getDressCategoryById(id)
}

export async function deleteDressCategory(id: string): Promise<boolean> {
  const collection = await getCollection(CATEGORY_COLLECTION)
  const res = await collection.deleteOne({ id })

  // Also delete all designs inside this category
  const designCollection = await getCollection(DESIGN_COLLECTION)
  await designCollection.deleteMany({ categoryId: id })

  return res.deletedCount > 0
}

/* ==========================================================================
   Design Repository Operations
   ========================================================================== */

export async function getDesigns(): Promise<Design[]> {
  const collection = await getCollection(DESIGN_COLLECTION)
  const docs = await collection.find({}).sort({ createdAt: -1 }).toArray()
  return docs.map(cleanDoc) as Design[]
}

export async function getDesignsByCategoryId(categoryId: string): Promise<Design[]> {
  const collection = await getCollection(DESIGN_COLLECTION)
  const docs = await collection.find({ categoryId }).sort({ createdAt: -1 }).toArray()
  return docs.map(cleanDoc) as Design[]
}

export async function getDesignById(id: string): Promise<Design | null> {
  const collection = await getCollection(DESIGN_COLLECTION)
  const doc = await collection.findOne({ id })
  return cleanDoc<Design>(doc)
}

export async function getDesignByCode(code: string): Promise<Design | null> {
  const collection = await getCollection(DESIGN_COLLECTION)
  const doc = await collection.findOne({ code: code.toUpperCase() })
  return cleanDoc<Design>(doc)
}

export async function getNextDesignShortCode(categoryPrefix: string): Promise<string> {
  const collection = await getCollection(DESIGN_COLLECTION)
  const prefix = categoryPrefix.toUpperCase()

  // Regex to match prefix followed by 3 digits (e.g. CROP001)
  const regex = new RegExp(`^${prefix}\\d{3}$`, 'i')
  const lastDesign = await collection.find({ code: regex }).sort({ code: -1 }).limit(1).toArray()

  if (lastDesign.length === 0) {
    return `${prefix}001`
  }

  const lastCode = lastDesign[0].code
  const numStr = lastCode.substring(prefix.length)
  const lastNum = parseInt(numStr, 10) || 0
  const nextNum = lastNum + 1
  const paddedNum = String(nextNum).padStart(3, '0')
  return `${prefix}${paddedNum}`
}

export async function createDesign(
  data: Omit<Design, 'id' | 'code'> & { id?: string; code?: string }
): Promise<Design> {
  const collection = await getCollection(DESIGN_COLLECTION)

  // Get category to find its prefix
  const category = await getDressCategoryById(data.categoryId)
  if (!category) {
    throw new Error(`Category ${data.categoryId} not found.`)
  }

  const code = data.code ? data.code.toUpperCase() : await getNextDesignShortCode(category.prefix)
  const id = data.id || `des_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`

  const newDesign: Design = {
    ...data,
    id,
    code,
    variants: data.variants || [],
    images: data.images || [],
    createdAt: new Date().toISOString()
  }

  await collection.insertOne(newDesign)
  return newDesign
}

export async function updateDesign(id: string, data: Partial<Design>): Promise<Design | null> {
  const { id: _, code: __, categoryId: ___, createdAt: ____, ...updateData } = data as any
  const collection = await getCollection(DESIGN_COLLECTION)

  await collection.updateOne({ id }, { $set: updateData })
  return getDesignById(id)
}

export async function deleteDesign(id: string): Promise<boolean> {
  const collection = await getCollection(DESIGN_COLLECTION)
  const res = await collection.deleteOne({ id })
  return res.deletedCount > 0
}

export async function adjustDesignStock(
  designId: string,
  color: string,
  size: string,
  quantityDelta: number
): Promise<boolean> {
  const collection = await getCollection(DESIGN_COLLECTION)
  const design = await getDesignById(designId)
  if (!design) return false

  const updatedVariants = (design.variants || []).map((variant) => {
    if (variant.color.toLowerCase() === color.toLowerCase()) {
      const updatedSizes = (variant.sizes || []).map((s) => {
        if (s.size.toLowerCase() === size.toLowerCase()) {
          const newQty = (s.quantity || 0) + quantityDelta
          return { ...s, quantity: Math.max(0, newQty) }
        }
        return s
      })
      return { ...variant, sizes: updatedSizes }
    }
    return variant
  })

  await collection.updateOne({ id: designId }, { $set: { variants: updatedVariants } })
  return true
}
