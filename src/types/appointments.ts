
export type AppointmentStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "DONE";

export type Appointment = {
  id: string;
  shopId: string;
  userId: string;
  barberId: string;
  serviceId: string;

  serviceSnapshot: {
    name: string;
    description?: string;
    durationMin: number;
    price: number;
    imageUrl?: string;
  };

  barberSnapshot: {
    name: string;
    imageUrl?: string;
  };

  startAt: Date;
  endAt: Date;

  status: AppointmentStatus;

  createdAt?: Date;
  updatedAt?: Date;
};
