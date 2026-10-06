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
    .default([])
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
    .optional()
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
