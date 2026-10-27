import { Router } from 'express'
import { v2 as cloudinary } from 'cloudinary'
import multer from 'multer'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    const designCode = (req.query.designCode as string) || 'item'
    const color = (req.query.color as string) || 'color'
    const folderParam = (req.query.folder as string) || 'ceyraa'
    const orderId = (req.query.orderId as string) || 'order'

    const file = req.file
    if (!file) {
      return res.status(400).json({ error: 'No file provided' })
    }

    const buffer = file.buffer

    let folder = 'ceyraa'
    let publicId = ''
    let transformation: any[] = []
    let resourceType: 'image' | 'video' | 'raw' | 'auto' = 'image'
    let outputFormat: string | undefined = 'webp'

    if (folderParam === 'stages') {
      folder = 'ceyraa_stages'
      const cleanOrderId = orderId.replace(/[^a-zA-Z0-9_-]/g, '')
      publicId = `stage_${cleanOrderId}_${Date.now()}`
      transformation = [
        {
          width: 2000,
          height: 2000,
          crop: 'limit', // Preserve aspect ratio, only shrink if exceeds 2000px
          quality: 'auto'
        }
      ]
    } else if (folderParam === 'swatches') {
      // Swatch color icon: 200x200 square, auto crop/fill, high quality webp
      folder = 'ceyraa_swatches'
      const cleanCode = designCode.replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase()
      const cleanColor = color.replace(/[^a-zA-Z0-9_-]/g, '')
      publicId = `swatch_${cleanCode}_${cleanColor}_${Date.now()}`
      transformation = [
        {
          width: 200,
          height: 200,
          crop: 'fill',
          gravity: 'auto',
          quality: 'auto'
        }
      ]
    } else if (folderParam === 'videos') {
      // Showcase Video or GIF (e.g. for color variant animations)
      folder = 'ceyraa_videos'
      const cleanCode = designCode.replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase()
      publicId = `media_${cleanCode}_${Date.now()}`
      resourceType = 'auto'
      outputFormat = undefined // Retain native mp4 or gif format
      transformation = [
        {
          width: 1080,
          height: 1920,
          crop: 'limit',
          quality: 'auto'
        }
      ]
    } else if (folderParam === 'size-charts') {
      // Size Chart diagram or photo: preserve original dimensions and resolution without cropping
      folder = 'ceyraa_size_charts'
      const cleanCode = designCode.replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase()
      publicId = `sizechart_${cleanCode}_${Date.now()}`
      resourceType = 'image'
      outputFormat = undefined // Keep original format (e.g. PNG / JPG) for maximum sharpness of tables and numbers
      transformation = [
        {
          width: 3840,
          height: 3840,
          crop: 'limit', // Only cap at 4K if massive, zero cropping
          quality: 'auto:best'
        }
      ]
    } else {
      // Default Garment Inventory upload
      folder = 'ceyraa'
      const cleanCode = designCode.replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase()
      const cleanColor = color.replace(/[^a-zA-Z0-9_-]/g, '')
      publicId = `design_${cleanCode}_${cleanColor}_${Date.now()}`
      transformation = [
        {
          width: 2200,
          height: 2800,
          crop: 'limit',
          quality: 'auto:good'
        }
      ]
    }

    // Upload file to Cloudinary using stream with auto transformations
    const uploadOptions: any = {
      folder: folder,
      public_id: publicId,
      resource_type: resourceType,
      transformation: transformation
    }
    if (outputFormat) {
      uploadOptions.format = outputFormat
    }

    const uploadResult: any = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(uploadOptions, (error, result) => {
          if (error) {
            reject(error)
          } else {
            resolve(result)
          }
        })
        .end(buffer)
    })

    res.json({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id
    })
  } catch (error: any) {
    next(error)
  }
})

export default router
