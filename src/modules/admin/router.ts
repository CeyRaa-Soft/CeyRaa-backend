import { Router } from 'express'
import healthRouter from './routes/health'
import categoryRouter from './routes/dress-categories'
import designRouter from './routes/designs'
import customerOrderRouter from './routes/customer-orders'
import supplierRouter from './routes/suppliers'
import supplierOrderRouter from './routes/supplier-orders'
import uploadRouter from './routes/upload'

const router = Router()

router.use('/health', healthRouter)
router.use('/dress-categories', categoryRouter)
router.use('/designs', designRouter)
router.use('/customer-orders', customerOrderRouter)
router.use('/suppliers', supplierRouter)
router.use('/supplier-orders', supplierOrderRouter)
router.use('/upload', uploadRouter)

export default router
