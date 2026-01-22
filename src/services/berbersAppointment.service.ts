// src/services/berbersAppointment.service.ts
import { auth, db } from "@/src/lib/firebase";
import {
    collection,
    doc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from "firebase/firestore";

function requireUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("AUTH_REQUIRED");
  return uid;
}

export type AppointmentStatus = "PENDING" | "CONFIRMED" | "CANCELED";

export type AppointmentDoc = {
  barberId: string;
  shopId: string;
  userId: string;
  serviceId: string;

  status: AppointmentStatus;

  startAt: any; // Firestore Timestamp
  endAt: any; // Firestore Timestamp
  createdAt: any;
  updatedAt: any;

  serviceSnapshot?: {
    name?: string;
    description?: string;
    durationMin?: number;
    price?: number;
    imageUrl?: string;
  };

  // varsa çok iyi (yoksa UI'da userId üzerinden çekersin)
  userSnapshot?: {
    name?: string;
    surname?: string;
    phone?: string;
  };
};

const COL = "appointments";

export async function listMyAppointments(params?: {
  status?: AppointmentStatus;
  pageSize?: number;
}) {
  const uid = requireUid();
  const pageSize = params?.pageSize ?? 30;

  const base = [
    where("barberId", "==", uid),
    ...(params?.status ? [where("status", "==", params.status)] : []),
    orderBy("startAt", "desc" as const), // yeni -> eski
    limit(pageSize),
  ];

  const q = query(collection(db, COL), ...base);
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as AppointmentDoc),
  }));
}

export async function setAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
) {
  const refDoc = doc(db, COL, appointmentId);
  await updateDoc(refDoc, {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function confirmAppointment(appointmentId: string) {
  return setAppointmentStatus(appointmentId, "CONFIRMED");
}

export async function cancelAppointment(appointmentId: string) {
  return setAppointmentStatus(appointmentId, "CANCELED");
}
