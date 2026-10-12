import { Router } from 'express'
import { z } from 'zod'
import {
  getDesigns,
  getDesignsByCategoryId,
  createDesign,
  getDesignById,
  updateDesign,
  deleteDesign
} from '../../../repositories/inventory.repository'

const router = Router()

const offerSchema = z.object({
  active: z.boolean(),
  discountPercentage: z.number().min(0).max(100),
  originalPrice: z.number().min(0),
  offerPrice: z.number().min(0),
  startDate: z.string().optional()
})

const designSchema = z.object({
  name: z.string().min(1, 'Design name is required'),
  code: z.string().optional(),
  categoryId: z.string().min(1, 'Category ID is required'),
  variants: z.array(z.any()).default([]),
  images: z
    .array(
      z.object({
        color: z.string(),
        url: z.string(),
        publicId: z.string().optional()
      })
    )
    .default([]),
  mediaVideoUrl: z.string().optional().nullable(),
  mediaVideoPublicId: z.string().optional().nullable(),
  sizeChartText: z.string().optional().nullable(),
  sizeChartImageUrl: z.string().optional().nullable(),
  sizeChartPublicId: z.string().optional().nullable(),
  defaultCollection: z.enum(["Queen's Wardrobe", "King's Wardrobe"]).optional().nullable(),
  customCollection: z.string().optional().nullable(),
  offer: offerSchema.optional().nullable()
})

const designUpdateSchema = z.object({
  name: z.string().min(1, 'Design name is required').optional(),
  variants: z.array(z.any()).optional(),
  images: z
    .array(
      z.object({
        color: z.string(),
        url: z.string(),
        publicId: z.string().optional()
      })
    )
    .optional(),
  mediaVideoUrl: z.string().optional().nullable(),
  mediaVideoPublicId: z.string().optional().nullable(),
  sizeChartText: z.string().optional().nullable(),
  sizeChartImageUrl: z.string().optional().nullable(),
  sizeChartPublicId: z.string().optional().nullable(),
  defaultCollection: z.enum(["Queen's Wardrobe", "King's Wardrobe"]).optional().nullable(),
  customCollection: z.string().optional().nullable(),
  offer: offerSchema.optional().nullable()
})

router.get('/', async (req, res, next) => {
  try {
    const categoryId = req.query.categoryId as string
    const designs = categoryId ? await getDesignsByCategoryId(categoryId) : await getDesigns()
    res.json(designs)
  } catch (error: any) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const validation = designSchema.safeParse(req.body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Validation failed'
      return res.status(400).json({
        error: firstError,
        details: validation.error.format()
      })
    }

    const newDesign = await createDesign(validation.data)
    res.status(201).json(newDesign)
  } catch (error: any) {
    next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const design = await getDesignById(req.params.id)
    if (!design) {
      return res.status(404).json({ error: 'Design not found' })
    }
    res.json(design)
  } catch (error: any) {
    next(error)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const existing = await getDesignById(req.params.id)
    if (!existing) {
      return res.status(404).json({ error: 'Design not found' })
    }

    const validation = designUpdateSchema.safeParse(req.body)
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Validation failed'
      return res.status(400).json({
        error: firstError,
        details: validation.error.format()
      })
    }

    const updated = await updateDesign(req.params.id, validation.data)
    res.json(updated)
  } catch (error: any) {
    next(error)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await getDesignById(req.params.id)
    if (!existing) {
      return res.status(404).json({ error: 'Design not found' })
    }

    await deleteDesign(req.params.id)
    res.json({ success: true })
  } catch (error: any) {
    next(error)
  }
})

export default router
