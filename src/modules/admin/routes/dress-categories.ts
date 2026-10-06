import { Router } from 'express'
import { z } from 'zod'
import {
  getDressCategories,
  createDressCategory,
  getDressCategoryById,
  updateDressCategory,
  deleteDressCategory
} from '../../../repositories/inventory.repository'

const router = Router()

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  prefix: z.string().optional()
})

const categoryUpdateSchema = z.object({
  name: z.string().min(1, 'Category name is required').optional(),
  prefix: z.string().optional()
})

router.get('/', async (_req, res, next) => {
  try {
    const categories = await getDressCategories()
    res.json(categories)
  } catch (error: any) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const validation = categorySchema.safeParse(req.body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Validation failed'
      return res.status(400).json({
        error: firstError,
        details: validation.error.format()
      })
    }

    const newCategory = await createDressCategory(validation.data)
    res.status(201).json(newCategory)
  } catch (error: any) {
    next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const category = await getDressCategoryById(req.params.id)
    if (!category) {
      return res.status(404).json({ error: 'Category not found' })
    }
    res.json(category)
  } catch (error: any) {
    next(error)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const existing = await getDressCategoryById(req.params.id)
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' })
    }

    const validation = categoryUpdateSchema.safeParse(req.body)
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Validation failed'
      return res.status(400).json({
        error: firstError,
        details: validation.error.format()
      })
    }

    const updated = await updateDressCategory(req.params.id, validation.data)
    res.json(updated)
  } catch (error: any) {
    next(error)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await getDressCategoryById(req.params.id)
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' })
    }

    await deleteDressCategory(req.params.id)
    res.json({ success: true })
  } catch (error: any) {
    next(error)
  }
})

export default router
