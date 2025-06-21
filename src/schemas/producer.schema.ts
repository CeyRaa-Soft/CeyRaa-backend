import mongoose from "mongoose";

const ProducerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    contactNumber: { type: String, required: true },
    secondaryNumber: String,
    address: String,
    description: String,
    categories: [String], // e.g. ['skirt', 'croptop']
  },
  { timestamps: true }
);

export const ProducerModel = mongoose.model("Producer", ProducerSchema);
