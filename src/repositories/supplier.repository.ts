import { getCollection } from "@/lib/database";
import type { Supplier } from "@/types/order";

const COLLECTION = "suppliers";

function cleanSupplier(doc: any): Supplier | null {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return rest as Supplier;
}

export async function getSuppliers(): Promise<Supplier[]> {
  const docs = await (await getCollection(COLLECTION))
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map(cleanSupplier) as Supplier[];
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
  const doc = await (await getCollection(COLLECTION)).findOne({ id });
  return cleanSupplier(doc);
}

export async function createSupplier(data: Omit<Supplier, "id">) {
  const newSupplier = {
    id: crypto.randomUUID(),
    ...data,
    notes: data.notes || [],
    createdAt: new Date().toISOString(),
  };

  await (await getCollection(COLLECTION)).insertOne(newSupplier);
  return newSupplier;
}

export async function updateSupplier(id: string, data: Partial<Supplier>) {
  const { id: _, createdAt: __, ...updateData } = data as any;
  
  await (await getCollection(COLLECTION)).updateOne(
    { id },
    { $set: updateData }
  );

  return getSupplierById(id);
}

export async function deleteSupplier(id: string) {
  return (await getCollection(COLLECTION)).deleteOne({ id });
}
