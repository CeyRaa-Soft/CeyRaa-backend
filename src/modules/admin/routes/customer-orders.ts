import { Router } from 'express'
import { z } from 'zod'
import {
  getCustomerOrders,
  createCustomerOrder,
  getCustomerOrderById,
  updateCustomerOrder,
  deleteCustomerOrder
} from '../../../repositories/customer-order.repository'
import { getDesignById, adjustDesignStock } from '../../../repositories/inventory.repository'

const router = Router()

const orderItemSchema = z.object({
  categoryId: z.string().min(1, 'Category ID is required'),
  categoryName: z.string().min(1, 'Category name is required'),
  designId: z.string().min(1, 'Design ID is required'),
  designCode: z.string().min(1, 'Design code is required'),
  designName: z.string().min(1, 'Design name is required'),
  color: z.string().min(1, 'Color is required'),
  size: z.string().min(1, 'Size is required'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  price: z.number().positive('Price must be greater than 0')
})

const orderSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  address: z.string().min(1, 'Address is required'),
  phone1: z.string().min(1, 'Primary phone number is required'),
  phone2: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'At least one item is required in the order')
})

router.get('/', async (req, res, next) => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10)
    const limit = parseInt((req.query.limit as string) || '20', 10)

    const categoryId = (req.query.categoryId as string) || undefined
    const designId = (req.query.designId as string) || undefined
    const color = (req.query.color as string) || undefined
    const size = (req.query.size as string) || undefined

    const { orders, total } = await getCustomerOrders(
      { categoryId, designId, color, size },
      page,
      limit
    )

    const pages = Math.ceil(total / limit)

    res.json({
      orders,
      pagination: {
        total,
        page,
        limit,
        pages
      }
    })
  } catch (error: any) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const validation = orderSchema.safeParse(req.body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Validation failed'
      return res.status(400).json({
        error: firstError,
        details: validation.error.format()
      })
    }

    const { items } = validation.data

    // 1. Fetch Designs and validate inventory for ALL items first
    for (const item of items) {
      const design = await getDesignById(item.designId)
      if (!design) {
        return res.status(400).json({
          error: `Garment item "${item.designName}" (${item.designCode}) not found in inventory`
        })
      }

      const variant = (design.variants || []).find(
        (v) => v.color.toLowerCase() === item.color.toLowerCase()
      )
      if (!variant) {
        return res.status(400).json({
          error: `Color variant "${item.color}" not found in inventory for design ${item.designCode}`
        })
      }

      const sizeInfo = (variant.sizes || []).find(
        (s) => s.size.toLowerCase() === item.size.toLowerCase()
      )
      if (!sizeInfo) {
        return res.status(400).json({
          error: `Size "${item.size}" not found in inventory for color "${item.color}" of design ${item.designCode}`
        })
      }

      if (sizeInfo.quantity < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock in inventory. Only ${sizeInfo.quantity} available for ${item.designCode} (${item.color} - Size ${item.size}). Requested: ${item.quantity}.`
        })
      }
    }

    // 2. Reduce stock in inventory for ALL items
    for (const item of items) {
      const stockAdjusted = await adjustDesignStock(
        item.designId,
        item.color,
        item.size,
        -item.quantity
      )
      if (!stockAdjusted) {
        return res.status(500).json({
          error: `Failed to deduct quantity from inventory for design ${item.designCode}`
        })
      }
    }

    // 3. Create the customer order
    const newOrder = await createCustomerOrder({
      ...validation.data,
      status: 'Pending'
    })

    res.status(201).json(newOrder)
  } catch (error: any) {
    next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const order = await getCustomerOrderById(req.params.id)
    if (!order) {
      return res.status(404).json({ error: 'Customer order not found' })
    }
    res.json(order)
  } catch (error: any) {
    next(error)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const order = await getCustomerOrderById(id)
    if (!order) {
      return res.status(404).json({ error: 'Customer order not found' })
    }

    const { status, ...otherUpdates } = req.body

    // Check if status is updated and adjust inventory accordingly
    if (status && status !== order.status) {
      const oldStatus = order.status
      const newStatus = status

      // 1. Transitioning to "Returned" -> Increase inventory for all items
      if (newStatus === 'Returned' && oldStatus !== 'Returned') {
        for (const item of order.items || []) {
          await adjustDesignStock(item.designId, item.color, item.size, item.quantity)
        }
      }

      // 2. Transitioning from "Returned" to something else -> Decrease inventory for all items
      if (oldStatus === 'Returned' && newStatus !== 'Returned') {
        for (const item of order.items || []) {
          await adjustDesignStock(item.designId, item.color, item.size, -item.quantity)
        }
      }
    }

    const updated = await updateCustomerOrder(id, {
      ...otherUpdates,
      ...(status ? { status } : {})
    })

    res.json(updated)
  } catch (error: any) {
    next(error)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const order = await getCustomerOrderById(id)
    if (!order) {
      return res.status(404).json({ error: 'Customer order not found' })
    }

    // Restore inventory if deleting a non-Returned order
    if (order.status !== 'Returned') {
      for (const item of order.items || []) {
        await adjustDesignStock(item.designId, item.color, item.size, item.quantity)
      }
    }

    await deleteCustomerOrder(id)
    res.json({ success: true })
  } catch (error: any) {
    next(error)
  }
})

export default router
