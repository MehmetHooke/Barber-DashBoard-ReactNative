// src/services/berbersAppointment.service.ts
import { auth, db } from "@/src/lib/firebase";
import {
    collection,
    doc,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
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
  endAt: any;
  createdAt: any;
  updatedAt: any;

  serviceSnapshot?: {
    name?: string;
    description?: string;
    durationMin?: number;
    price?: number;
    imageUrl?: string;
  };

  userSnapshot?: {
    name?: string;
    surname?: string;
  };

  barberSnapshot?: {
    name?: string;
    imageUrl?: string;
  };
};

export type AppointmentItem = { id: string } & AppointmentDoc;

const COL = "appointments";

function mapSnap(snap: any): AppointmentItem[] {
  return snap.docs.map((d: any) => ({
    id: d.id,
    ...(d.data() as AppointmentDoc),
  }));
}

export function subscribeMyPendingAppointments(
  cb: (items: AppointmentItem[]) => void,
  opts?: { pageSize?: number },
) {
  const uid = requireUid();
  const pageSize = opts?.pageSize ?? 30;

  // PENDING: en çok yeni gelenler önemli (createdAt desc ideal)
  // Eğer createdAt yoksa startAt desc kullanırız.
  const q = query(
    collection(db, COL),
    where("barberId", "==", uid),
    where("status", "==", "PENDING"),
    orderBy("createdAt", "desc"),
    limit(pageSize),
  );

  return onSnapshot(q, (snap) => cb(mapSnap(snap)));
}

export function subscribeMyAppointments(
  cb: (items: AppointmentItem[]) => void,
  opts?: { pageSize?: number },
) {
  const uid = requireUid();
  const pageSize = opts?.pageSize ?? 80;

  const q = query(
    collection(db, COL),
    where("barberId", "==", uid),
    orderBy("startAt", "desc"),
    limit(pageSize),
  );

  return onSnapshot(q, (snap) => cb(mapSnap(snap)));
}

export function subscribeMyTodayAppointments(
  cb: (items: AppointmentItem[]) => void,
  opts?: { pageSize?: number; tzOffsetMinutes?: number },
) {
  const uid = requireUid();
  const pageSize = opts?.pageSize ?? 80;

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const startTs = Timestamp.fromDate(start);
  const endTs = Timestamp.fromDate(end);

  const q = query(
    collection(db, COL),
    where("barberId", "==", uid),
    where("startAt", ">=", startTs),
    where("startAt", "<=", endTs),
    orderBy("startAt", "asc"),
    limit(pageSize),
  );

  return onSnapshot(q, (snap) => cb(mapSnap(snap)));
}

export async function setAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
) {
  const refDoc = doc(db, COL, appointmentId);
  await updateDoc(refDoc, { status, updatedAt: serverTimestamp() });
}

export async function confirmAppointment(appointmentId: string) {
  return setAppointmentStatus(appointmentId, "CONFIRMED");
}

export async function cancelAppointment(appointmentId: string) {
  return setAppointmentStatus(appointmentId, "CANCELED");
}
