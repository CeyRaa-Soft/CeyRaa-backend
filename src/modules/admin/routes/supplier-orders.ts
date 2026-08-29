import { Router } from 'express'
import { z } from 'zod'
import {
  getOrders,
  createOrder,
  getOrderById,
  updateOrder,
  deleteOrder
} from '../../../repositories/order.repository'
import {
  createDesign,
  getDesignById,
  updateDesign
} from '../../../repositories/inventory.repository'

const router = Router()

const orderSchema = z.object({
  id: z.string().optional(),
  supplier: z.string().min(1, 'Supplier is required'),
  date: z.string(),
  status: z.enum(['Pending', 'Approved', 'Delivered']).default('Pending'),
  categories: z.array(z.any()).optional().default([]),
  stageImages: z
    .array(
      z.object({
        url: z.string(),
        publicId: z.string().optional()
      })
    )
    .optional()
    .default([])
})

router.get('/', async (_req, res, next) => {
  try {
    const orders = await getOrders()
    res.json(orders)
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

    const orderData = validation.data

    // Initialize standard categories if they are empty
    if (!orderData.categories || orderData.categories.length === 0) {
      orderData.categories = [
        { id: 'production', name: 'Sewing & Tailoring (Garments)', items: [] },
        { id: 'supplies', name: 'Fabrics & Accessories (Materials)', items: [] },
        { id: 'other', name: 'Other Expenses (Courier, Packaging, etc.)', items: [] }
      ]
    }

    const newOrder = await createOrder(orderData as any)
    res.status(201).json(newOrder)
  } catch (error: any) {
    next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const order = await getOrderById(req.params.id)
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }
    res.json(order)
  } catch (error: any) {
    next(error)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const existing = await getOrderById(req.params.id)
    if (!existing) {
      return res.status(404).json({ error: 'Order not found' })
    }

    const validation = orderSchema.partial().safeParse(req.body)
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Validation failed'
      return res.status(400).json({
        error: firstError,
        details: validation.error.format()
      })
    }

    const updated = await updateOrder(req.params.id, validation.data as any)
    res.json(updated)
  } catch (error: any) {
    next(error)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await getOrderById(req.params.id)
    if (!existing) {
      return res.status(404).json({ error: 'Order not found' })
    }

    await deleteOrder(req.params.id)
    res.json({ success: true })
  } catch (error: any) {
    next(error)
  }
})

router.post('/:id/add-to-inventory', async (req, res, next) => {
  try {
    const { id } = req.params
    const order = await getOrderById(id)
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    const { mappings } = req.body

    if (!mappings || !Array.isArray(mappings)) {
      return res.status(400).json({ error: 'Invalid mappings data' })
    }

    // Process each mapping
    for (const mapping of mappings) {
      const { orderItemId, action, categoryId, designId, name, code, images, variants } = mapping

      // Find the item in the order's production category
      const productionCategory = order.categories?.find((c) => c.id === 'production')
      const item = productionCategory?.items.find((i) => i.id === orderItemId)

      if (!item) {
        return res.status(400).json({
          error: `Order item ${orderItemId} not found in order garments`
        })
      }

      // Use custom variants from mapping if provided, otherwise default to item.variants
      const variantsToUse = variants && Array.isArray(variants) ? variants : item.variants

      if (action === 'create') {
        // Create new design with the quantities and custom selling prices
        await createDesign({
          name: name || item.name,
          categoryId,
          code: code || undefined,
          variants: variantsToUse, // Quantities, sizes, and custom selling prices
          images: images || []
        })
      } else if (action === 'merge') {
        // Merge quantities with an existing design
        if (!designId) {
          return res.status(400).json({
            error: `Missing design ID for merge action on item ${item.name}`
          })
        }

        const design = await getDesignById(designId)
        if (!design) {
          return res.status(404).json({
            error: `Design ${designId} to merge not found`
          })
        }

        // Merge logic for variants
        const mergedVariants = [...(design.variants || [])]

        for (const orderVar of variantsToUse) {
          const existingVarIdx = mergedVariants.findIndex(
            (v) => v.color.toLowerCase() === orderVar.color.toLowerCase()
          )

          if (existingVarIdx > -1) {
            // Color variant exists in design, merge sizes
            const existingVar = mergedVariants[existingVarIdx]
            const mergedSizes = [...existingVar.sizes]

            for (const orderSize of orderVar.sizes) {
              const existingSizeIdx = mergedSizes.findIndex(
                (s) => s.size.toLowerCase() === orderSize.size.toLowerCase()
              )

              if (existingSizeIdx > -1) {
                // Size exists, increment quantity
                mergedSizes[existingSizeIdx] = {
                  ...mergedSizes[existingSizeIdx],
                  quantity: mergedSizes[existingSizeIdx].quantity + orderSize.quantity,
                  // Optionally keep the higher price or update it
                  unitPrice: orderSize.unitPrice || mergedSizes[existingSizeIdx].unitPrice
                }
              } else {
                // Size doesn't exist, append new size info
                mergedSizes.push(orderSize)
              }
            }

            mergedVariants[existingVarIdx] = {
              ...existingVar,
              sizes: mergedSizes
            }
          } else {
            // Color variant doesn't exist in design, append whole color variant
            mergedVariants.push(orderVar)
          }
        }

        // Merge images if new ones are uploaded
        const mergedImages = [...(design.images || [])]
        if (images && Array.isArray(images)) {
          for (const newImg of images) {
            // Avoid adding exact duplicate URLs
            if (!mergedImages.some((img) => img.url === newImg.url)) {
              mergedImages.push(newImg)
            }
          }
        }

        // Update existing design
        await updateDesign(designId, {
          variants: mergedVariants,
          images: mergedImages
        })
      }
    }

    // Update supplier order status
    await updateOrder(id, {
      status: 'Delivered',
      addedToInventory: true // Custom flag to prevent double addition
    } as any)

    res.json({ success: true })
  } catch (error: any) {
    next(error)
  }
})

export default router
