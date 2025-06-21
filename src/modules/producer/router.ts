import { Router } from "express";
import { createProducer, getAllProducers } from "./handler";

const router = Router();

router.post("/", createProducer);
router.get("/", getAllProducers);

export default router;
