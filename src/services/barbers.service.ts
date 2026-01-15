import { db } from "@/src/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
export type WorkingBreak = { start: string; end: string };
export type DayHours =
  | { closed: true }
  | { start: string; end: string; breaks?: WorkingBreak[] };

export type WorkingHours = {
  timezone: string;
  slotStepMin: number;
  week: Record<string, DayHours>; // "0".."6"
};


export type BarberDoc = {
  id: string;
  shopId: string;
  name: string;
  imageUrl?: string;
  active: boolean;
  workingHours?: WorkingHours;
  createdAt?: Date;
  updatedAt?: Date;
};

export async function ensureBarberDoc(input: {
  uid: string;
  shopId: string; // "main"
  name: string;
  imageUrl?: string;
}) {
  const ref = doc(db, "barbers", input.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) return; //varsa şuanlık birşey yapma ! ileride working hours da değişiklik için değişicek

  await setDoc(ref, {
    shopId: input.shopId,
    name: input.name,
    imageUrl: input.imageUrl ?? "",
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateBarberWorkingHours(barberId: string, workingHours: WorkingHours) {
  const ref = doc(db, "barbers", barberId);
  await updateDoc(ref, {
    workingHours,
    updatedAt: serverTimestamp(),
  });
}

export async function getActiveBarbers(shopId: string) {
  const q = query(
    collection(db, "barbers"),
    where("shopId", "==", shopId),
    where("active", "==", true)
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const x = d.data() as any;
    return {
      id: d.id,
      shopId: x.shopId,
      name: x.name,
      imageUrl: x.imageUrl || "",
      active: x.active,
      createdAt: x.createdAt?.toDate?.(),
      updatedAt: x.updatedAt?.toDate?.(),
    } as BarberDoc;
  });
}

export async function getBarberById(barberId: string) {
  const ref = doc(db, "barbers", barberId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const x = snap.data() as any;
  return {
    id: snap.id,
    shopId: x.shopId,
    name: x.name,
    imageUrl: x.imageUrl || "",
    active: x.active,
    workingHours: x.workingHours,
    createdAt: x.createdAt?.toDate?.(),
    updatedAt: x.updatedAt?.toDate?.(),
  } as BarberDoc;
}
