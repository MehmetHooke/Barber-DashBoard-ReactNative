export type Service = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  durationMin: number;
  price: number;
};

export type Appointment = {
  id: string;
  serviceId: string;
  serviceName: string;
  barberId: string;
  barberName: string;
  startsAtISO: string; // "2026-01-14T15:30:00.000Z" gibi
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "DONE";
};
