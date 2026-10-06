import { Router } from 'express'
import { z } from 'zod'
import {
  getSuppliers,
  createSupplier,
  getSupplierById,
  updateSupplier,
  deleteSupplier
} from '../../../repositories/supplier.repository'

const router = Router()

const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier Name is required'),
  category: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  bankDetails: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  notes: z.array(z.string()).optional().default([])
})

const supplierUpdateSchema = z.object({
  name: z.string().min(1, 'Supplier Name is required').optional(),
  category: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  bankDetails: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  notes: z.array(z.string()).optional()
})

router.get('/', async (_req, res, next) => {
  try {
    const suppliers = await getSuppliers()
    res.json(suppliers)
  } catch (error: any) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const validation = supplierSchema.safeParse(req.body)
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Validation failed'
      return res.status(400).json({
        error: firstError,
        details: validation.error.format()
      })
    }

    const newSupplier = await createSupplier(validation.data as any)
    res.status(201).json(newSupplier)
  } catch (error: any) {
    next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const supplier = await getSupplierById(req.params.id)
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' })
    }
    res.json(supplier)
  } catch (error: any) {
    next(error)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const existing = await getSupplierById(req.params.id)
    if (!existing) {
      return res.status(404).json({ error: 'Supplier not found' })
    }

    const validation = supplierUpdateSchema.safeParse(req.body)
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Validation failed'
      return res.status(400).json({
        error: firstError,
        details: validation.error.format()
      })
    }

    const updated = await updateSupplier(req.params.id, validation.data as any)
    res.json(updated)
  } catch (error: any) {
    next(error)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await getSupplierById(req.params.id)
    if (!existing) {
      return res.status(404).json({ error: 'Supplier not found' })
    }

    await deleteSupplier(req.params.id)
    res.json({ success: true })
  } catch (error: any) {
    next(error)
  }
})

export default router
