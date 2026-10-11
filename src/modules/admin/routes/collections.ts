import { Router } from 'express'
import { z } from 'zod'
import {
  getCollections,
  createCollection,
  getCollectionById,
  updateCollection,
  deleteCollection
} from '../../../repositories/inventory.repository'

const router = Router()

const collectionSchema = z.object({
  name: z.string().min(1, 'Collection name is required'),
  description: z.string().optional(),
  imageUrl: z.string().optional()
})

const collectionUpdateSchema = z.object({
  name: z.string().min(1, 'Collection name is required').optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional()
})

router.get('/', async (_req, res, next) => {
  try {
    const collections = await getCollections()
    res.json(collections)
  } catch (error: any) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const validation = collectionSchema.safeParse(req.body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Validation failed'
      return res.status(400).json({
        error: firstError,
        details: validation.error.format()
      })
    }

    const newCollection = await createCollection(validation.data)
    res.status(201).json(newCollection)
  } catch (error: any) {
    next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const col = await getCollectionById(req.params.id)
    if (!col) {
      return res.status(404).json({ error: 'Collection not found' })
    }
    res.json(col)
  } catch (error: any) {
    next(error)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const existing = await getCollectionById(req.params.id)
    if (!existing) {
      return res.status(404).json({ error: 'Collection not found' })
    }

    const validation = collectionUpdateSchema.safeParse(req.body)
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Validation failed'
      return res.status(400).json({
        error: firstError,
        details: validation.error.format()
      })
    }

    const updated = await updateCollection(req.params.id, validation.data)
    res.json(updated)
  } catch (error: any) {
    next(error)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await getCollectionById(req.params.id)
    if (!existing) {
      return res.status(404).json({ error: 'Collection not found' })
    }

    await deleteCollection(req.params.id)
    res.json({ success: true })
  } catch (error: any) {
    next(error)
  }
})

export default router
