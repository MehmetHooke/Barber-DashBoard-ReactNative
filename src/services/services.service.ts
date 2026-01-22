import { db } from "@/src/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

export type ServiceDoc = {
  id: string;
  shopId: string;
  createdByBarberId: string;

  name: string;
  description: string;
  imageUrl: string;

  durationMin: number;
  price: number;

  active: boolean;

  createdAt?: Date;
  updatedAt?: Date;
};

export async function createService(input: {
  shopId: string; // "main"
  createdByBarberId: string;

  name: string;
  description: string;
  imageUrl: string;

  durationMin: number;
  price: number;
}) {
  const ref = await addDoc(collection(db, "services"), {
    shopId: input.shopId,
    createdByBarberId: input.createdByBarberId,

    name: input.name.trim(),
    description: input.description.trim(),
    imageUrl: input.imageUrl,

    durationMin: input.durationMin,
    price: input.price,

    active: true,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { id: ref.id };
}

export async function getServiceById(serviceId: string) {
  const ref = doc(db, "services", serviceId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const x = snap.data() as any;
  return {
    id: snap.id,
    shopId: x.shopId,
    createdByBarberId: x.createdByBarberId,
    name: x.name,
    description: x.description,
    imageUrl: x.imageUrl,
    durationMin: x.durationMin,
    price: x.price,
    active: x.active,
    createdAt: x.createdAt?.toDate?.(),
    updatedAt: x.updatedAt?.toDate?.(),
  } as ServiceDoc;
}

export async function getActiveServices(shopId: string) {
  const q = query(
    collection(db, "services"),
    where("shopId", "==", shopId),
    where("active", "==", true),
    orderBy("createdAt", "desc"),
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const x = d.data() as any;
    return {
      id: d.id,
      shopId: x.shopId,
      createdByBarberId: x.createdByBarberId,
      name: x.name,
      description: x.description,
      imageUrl: x.imageUrl,
      durationMin: x.durationMin,
      price: x.price,
      active: x.active,
      createdAt: x.createdAt?.toDate?.(),
      updatedAt: x.updatedAt?.toDate?.(),
    } as ServiceDoc;
  });
}

//update service
export async function updateService(
  serviceId: string,
  input: {
    name: string;
    description: string;
    imageUrl: string;
    durationMin: number;
    price: number;
    active?: boolean;
  },
) {
  const ref = doc(db, "services", serviceId);

  await updateDoc(ref, {
    name: input.name.trim(),
    description: input.description.trim(),
    imageUrl: input.imageUrl,
    durationMin: input.durationMin,
    price: input.price,
    ...(typeof input.active === "boolean" ? { active: input.active } : {}),
    updatedAt: serverTimestamp(),
  });

  return { id: serviceId };
}
