// services/appointmentService.ts
import { db } from "@/src/lib/firebase"; // sende nerede ise
import type { AppointmentStatus } from "@/src/types/appointments";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

type ServiceSnapshot = {
  name: string;
  description?: string;
  durationMin: number;
  price: number;
  imageUrl?: string;
};

type BarberSnapshot = {
  name: string;
  imageUrl?: string;
};

type UserSnapshot = {
  name: string;
  surname: string;
};

export type CreateAppointmentInput = {
  shopId: string;
  userId: string;
  barberId: string;
  serviceId: string;
  serviceSnapshot: ServiceSnapshot;
  barberSnapshot: BarberSnapshot;

  userSnapshot: UserSnapshot;

  startAt: Date;
  endAt: Date;

  // istersen başlangıçta CONFIRMED yaparsın, ama genelde PENDING iyidir
  status?: AppointmentStatus;
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  // (aStart < bEnd) && (aEnd > bStart)
  return aStart < bEnd && aEnd > bStart;
}

/**
 * MVP çakışma kontrolü:
 * - Seçilen gün için ilgili berberin randevularını çek
 * - Client tarafında overlap kontrol et
 */
export async function checkBarberAvailability(args: {
  shopId: string;
  barberId: string;
  startAt: Date;
  endAt: Date;
}) {
  const dayStart = startOfDay(args.startAt);
  const dayEnd = endOfDay(args.startAt);

  // startAt'e göre gün filtresi + orderBy
  const q = query(
    collection(db, "appointments"),
    where("shopId", "==", args.shopId),
    where("barberId", "==", args.barberId),
    where("status", "in", ["PENDING", "CONFIRMED"]),
    where("startAt", ">=", Timestamp.fromDate(dayStart)),
    where("startAt", "<=", Timestamp.fromDate(dayEnd)),
    orderBy("startAt", "asc"),
    limit(250),
  );

  const snap = await getDocs(q);

  const s = args.startAt.getTime();
  const e = args.endAt.getTime();

  for (const d of snap.docs) {
    const data = d.data() as any;
    const es = (data.startAt as Timestamp).toDate().getTime();
    const ee = (data.endAt as Timestamp).toDate().getTime();
    if (overlaps(s, e, es, ee)) return { available: false };
  }

  return { available: true };
}

/**
 * Tek kaynak: appointments/{id}
 * + Mirror (users ve barbers altına) — yönetimi kolaylaştırır (listeler için)
 */
export async function createAppointment(input: CreateAppointmentInput) {
  const status: AppointmentStatus = input.status ?? "PENDING";

  // 1) Merkezi kayıt
  const centerRef = await addDoc(collection(db, "appointments"), {
    shopId: input.shopId,
    userId: input.userId,
    barberId: input.barberId,
    serviceId: input.serviceId,

    serviceSnapshot: input.serviceSnapshot,
    barberSnapshot: input.barberSnapshot,

    userSnapshot: input.userSnapshot,

    startAt: Timestamp.fromDate(input.startAt),
    endAt: Timestamp.fromDate(input.endAt),

    status,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const appointmentId = centerRef.id;

  // 2) User mirror
  await setDoc(doc(db, "users", input.userId, "appointments", appointmentId), {
    appointmentId,
    shopId: input.shopId,
    barberId: input.barberId,
    serviceId: input.serviceId,

    serviceSnapshot: input.serviceSnapshot,
    barberSnapshot: input.barberSnapshot,

    startAt: Timestamp.fromDate(input.startAt),
    endAt: Timestamp.fromDate(input.endAt),

    userSnapshot: input.userSnapshot,

    status,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // 3) Barber mirror
  await setDoc(
    doc(db, "barbers", input.barberId, "appointments", appointmentId),
    {
      appointmentId,
      shopId: input.shopId,
      userId: input.userId,
      serviceId: input.serviceId,

      serviceSnapshot: input.serviceSnapshot,
      barberSnapshot: input.barberSnapshot,

      startAt: Timestamp.fromDate(input.startAt),
      endAt: Timestamp.fromDate(input.endAt),

      userSnapshot: input.userSnapshot,

      status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  );

  return { appointmentId };
}

export async function getAppointmentById(appointmentId: string) {
  const ref = doc(db, "appointments", appointmentId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const d = snap.data() as any;
  return {
    id: snap.id,
    shopId: d.shopId,
    userId: d.userId,
    barberId: d.barberId,
    serviceId: d.serviceId,
    serviceSnapshot: d.serviceSnapshot,
    barberSnapshot: d.barberSnapshot,
    startAt: (d.startAt as Timestamp).toDate(),
    endAt: (d.endAt as Timestamp).toDate(),
    status: d.status as AppointmentStatus,
    createdAt: d.createdAt?.toDate?.() ?? undefined,
    updatedAt: d.updatedAt?.toDate?.() ?? undefined,
  };
}

/**
 * Kullanıcının yaklaşan randevusu (en yakın 1 tane)
 */

//test
export async function debugAppointmentsForUser(userId: string) {
  const q = query(
    collection(db, "appointments"),
    where("userId", "==", userId),
    orderBy("startAt", "desc"),
    limit(20),
  );

  const snap = await getDocs(q);
  console.log("DEBUG appointments size:", snap.size);

  return snap.docs.map((x) => {
    const d = x.data() as any;
    return {
      id: x.id,
      userId: d.userId,
      status: d.status,
      startAt: (d.startAt as Timestamp)?.toDate?.(),
      rawStartAt: d.startAt,
    };
  });
}
//---------------

export async function getUpcomingAppointmentForUser(args: {
  userId: string;
  now?: Date;
}) {
  const now = args.now ?? new Date();

  const q = query(
    collection(db, "appointments"),
    where("userId", "==", args.userId),
    where("status", "in", ["PENDING", "CONFIRMED"]),
    where("startAt", ">=", Timestamp.fromDate(now)),
    orderBy("startAt", "asc"),
    limit(1),
  );

  const snap = await getDocs(q);
  if (snap.empty) return null;

  const doc0 = snap.docs[0];
  const d = doc0.data() as any;

  return {
    id: doc0.id,
    shopId: d.shopId,
    userId: d.userId,
    barberId: d.barberId,
    serviceId: d.serviceId,
    serviceSnapshot: d.serviceSnapshot,
    barberSnapshot: d.barberSnapshot,
    startAt: (d.startAt as Timestamp).toDate(),
    endAt: (d.endAt as Timestamp).toDate(),
    status: d.status as AppointmentStatus,
  };
}

/**
 * Kullanıcının geçmiş randevuları (son N)
 */
export async function getPastAppointmentsForUser(args: {
  userId: string;
  limitCount?: number;
  before?: Date;
}) {
  const before = args.before ?? new Date();
  const limitCount = args.limitCount ?? 10;

  const q = query(
    collection(db, "appointments"),
    where("userId", "==", args.userId),
    where("startAt", "<", Timestamp.fromDate(before)),
    orderBy("startAt", "desc"),
    limit(limitCount),
  );

  const snap = await getDocs(q);
  return snap.docs.map((x) => {
    const d = x.data() as any;
    return {
      id: x.id,
      shopId: d.shopId,
      userId: d.userId,
      barberId: d.barberId,
      serviceId: d.serviceId,
      serviceSnapshot: d.serviceSnapshot,
      barberSnapshot: d.barberSnapshot,
      startAt: (d.startAt as Timestamp).toDate(),
      endAt: (d.endAt as Timestamp).toDate(),
      status: d.status as AppointmentStatus,
    };
  });
}

export async function cancelAppointment(args: {
  appointmentId: string;
  userId: string;
  barberId: string;
}) {
  const payload = {
    status: "CANCELED" as AppointmentStatus,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(doc(db, "appointments", args.appointmentId), payload);
  await updateDoc(
    doc(db, "users", args.userId, "appointments", args.appointmentId),
    payload,
  );
  await updateDoc(
    doc(db, "barbers", args.barberId, "appointments", args.appointmentId),
    payload,
  );
}

export async function rescheduleAppointment(args: {
  appointmentId: string;
  userId: string;
  barberId: string;
  shopId: string;
  newStartAt: Date;
  newEndAt: Date;
}) {
  // önce uygun mu kontrol et
  const ok = await checkBarberAvailability({
    shopId: args.shopId,
    barberId: args.barberId,
    startAt: args.newStartAt,
    endAt: args.newEndAt,
  });
  if (!ok.available) {
    throw new Error("SELECTED_SLOT_NOT_AVAILABLE");
  }

  const payload = {
    startAt: Timestamp.fromDate(args.newStartAt),
    endAt: Timestamp.fromDate(args.newEndAt),
    updatedAt: serverTimestamp(),
  };

  await updateDoc(doc(db, "appointments", args.appointmentId), payload);
  await updateDoc(
    doc(db, "users", args.userId, "appointments", args.appointmentId),
    payload,
  );
  await updateDoc(
    doc(db, "barbers", args.barberId, "appointments", args.appointmentId),
    payload,
  );
}

/**
 * Berberin belirli bir gündeki randevuları (slotları disable etmek için)
 */
export async function getBarberAppointmentsForDay(args: {
  shopId: string;
  barberId: string;
  day: Date;
}) {
  const dayStart = startOfDay(args.day);
  const dayEnd = endOfDay(args.day);

  const q = query(
    collection(db, "appointments"),
    where("shopId", "==", args.shopId),
    where("barberId", "==", args.barberId),
    where("status", "in", ["PENDING", "CONFIRMED"]),
    where("startAt", ">=", Timestamp.fromDate(dayStart)),
    where("startAt", "<=", Timestamp.fromDate(dayEnd)),
    orderBy("startAt", "asc"),
    limit(250),
  );

  const snap = await getDocs(q);
  return snap.docs.map((x) => {
    const d = x.data() as any;
    return {
      id: x.id,
      startAt: (d.startAt as Timestamp).toDate(),
      endAt: (d.endAt as Timestamp).toDate(),
      status: d.status as AppointmentStatus,
    };
  });
}
