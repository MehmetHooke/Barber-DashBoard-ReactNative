import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { ensureBarberDoc } from "./barbers.service";
import { createUserDoc, getUserDoc } from "./user.service";

export async function registerWithEmail(params: {
  name: string;
  surname: string;
  phone: string;
  email: string;
  password: string;
}) {
  const { name, surname, phone, email, password } = params;

  //auth kaydı yapılıyor
  const cred = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password.trim()
  );
  const uid = cred.user.uid;

  //firestore'da users/{uid} oluştur kayıt esnasında

  await createUserDoc({
    uid,
    name: name.trim(),
    surname: surname.trim(),
    phone: phone.trim(),
    role: "USER", //herkes user şimdilik bu yetkiyi uygulamaya sahip olan işletmelerin oturumlarına db üzerinden verilecek.
    createdAt: Date.now(),
  });

  return cred.user;
}

export async function loginWithEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(
    auth,
    email.trim(),
    password.trim()
  );

  const uid = cred.user.uid;

  // users/{uid} rolünü oku
  const userDoc = await getUserDoc(uid);

  // berber ise barbers/{uid} yoksa oluştur
  if (userDoc?.role === "BARBER") {
    const fullName =
      `${userDoc.name ?? ""} ${userDoc.surname ?? ""}`.trim() || "Berber";
    await ensureBarberDoc({
      uid,
      shopId: "main",
      name: fullName,
      imageUrl: "",
    });
  }

  return cred.user;
}

export async function logout() {
  await signOut(auth);
}
