
export type UserRole = "USER" | "BARBER";

export type UserDoc = {
    uid: string;
    name: string;
    surname:string;
    phone:string;
    role:string;
    createdAt:number;
}