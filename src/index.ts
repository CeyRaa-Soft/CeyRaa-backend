import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./common/services/db.service";
import { loadRouters } from "./common/services/loadRouters.service";
import { errorHandler } from "./middleware/error.middleware";
import type { ErrorRequestHandler } from "express";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

// Auto-load all module routers
loadRouters(app);

// Global error handler
app.use(errorHandler as ErrorRequestHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
