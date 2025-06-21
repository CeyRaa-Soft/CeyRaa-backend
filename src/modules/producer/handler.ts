import { Request, Response, NextFunction } from 'express'

import { ProducerModel } from '@/schemas/producer.schema'

export const createProducer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const producer = await ProducerModel.create(req.body)
    res.status(201).json(producer)
  } catch (err) {
    next(err)
  }
}

export const getAllProducers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const producers = await ProducerModel.find()
    res.json(producers)
  } catch (err) {
    next(err)
  }
}
