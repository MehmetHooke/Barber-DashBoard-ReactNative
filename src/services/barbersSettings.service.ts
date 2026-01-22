import { auth, db, storage } from "@/src/lib/firebase";
import * as ImagePicker from "expo-image-picker";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { BarberDoc } from "./barbers.service";

function requireUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("AUTH_REQUIRED");
  return uid;
}

export async function getMyUserDoc(): Promise<BarberDoc | null> {
  const uid = requireUid();
  const refDoc = doc(db, "barbers", uid);
  const snap = await getDoc(refDoc);
  if (!snap.exists()) return null;
  return snap.data() as BarberDoc;
}

export async function updateMyPhone(phone: string) {
  const uid = requireUid();
  const refDoc = doc(db, "barbers", uid);
  await updateDoc(refDoc, { phone: phone.trim() });
}

export async function updateMyProfile(params: { name: string }) {
  const uid = requireUid();
  const refDoc = doc(db, "barbers", uid);
  await updateDoc(refDoc, {
    name: params.name.trim(),
  });
}

/**
 * Kullanıcı galeriden foto seçer -> Storage'a yükler -> downloadURL'i users/{uid}.profileImage'a yazar
 */
export async function pickAndUploadMyProfileImage(): Promise<string> {
  const uid = requireUid();

  // permission
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error("MEDIA_PERMISSION_DENIED");

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled) throw new Error("PICK_CANCELED");

  const asset = result.assets[0];
  const uri = asset.uri;

  // uri -> blob
  const blob: Blob = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response);
    xhr.onerror = () => reject(new Error("BLOB_FAILED"));
    xhr.responseType = "blob";
    xhr.open("GET", uri, true);
    xhr.send(null);
  });

  // Storage path ilerleyen aşamada berber ve kullanıcı rolune göre ayrı klasörde toplanabilir.
  const path = `profileImages/${uid}.jpg`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
  const downloadURL = await getDownloadURL(storageRef);

  const refDoc = doc(db, "barbers", uid);
  await updateDoc(refDoc, { imageUrl: downloadURL });

  return downloadURL;
}

export async function removeMyProfileImage() {
  const uid = requireUid();
  const refDoc = doc(db, "barbers", uid);
  await updateDoc(refDoc, { imageUrl: "" });
}

export async function getBarberDoc(uid: string) {
  const ref = doc(db, "barbers", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return snap.data() as BarberDoc;
}
