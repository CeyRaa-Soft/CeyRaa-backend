import { Router } from "express";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.post("/", upload.single("file"), async (req, res, next) => {
  try {
    const designCode = (req.query.designCode as string) || "item";
    const color = (req.query.color as string) || "color";
    const folderParam = (req.query.folder as string) || "ceyraa";
    const orderId = (req.query.orderId as string) || "order";

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const buffer = file.buffer;

    let folder = "ceyraa";
    let publicId = "";
    let transformation: any[] = [];

    if (folderParam === "stages") {
      folder = "ceyraa_stages";
      const cleanOrderId = orderId.replace(/[^a-zA-Z0-9_-]/g, "");
      publicId = `stage_${cleanOrderId}_${Date.now()}`;
      transformation = [
        {
          width: 2000,
          height: 2000,
          crop: "limit", // Preserve aspect ratio, only shrink if exceeds 2000px
          quality: "auto",
        },
      ];
    } else {
      // Default Garment Inventory upload
      folder = "ceyraa";
      const cleanCode = designCode.replace(/[^a-zA-Z0-9_-]/g, "").toUpperCase();
      const cleanColor = color.replace(/[^a-zA-Z0-9_-]/g, "");
      publicId = `design_${cleanCode}_${cleanColor}_${Date.now()}`;
      transformation = [
        {
          width: 1200,
          height: 1500,
          crop: "fill",
          gravity: "auto",
          quality: "auto",
        },
      ];
    }

    // Upload image to Cloudinary using stream with auto transformations
    const uploadResult: any = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: publicId,
          resource_type: "image",
          format: "webp", // Force WebP storage
          transformation: transformation,
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload stream error:", error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(buffer);
    });

    res.json({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (error: any) {
    next(error);
  }
});

export default router;
