import { storage } from "@/src/lib/firebase";
import * as ImagePicker from "expo-image-picker";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

/**
 * Galeriden foto seçer ve Firebase Storage'a yükleyip downloadURL döner.
 * folder örn: "services"
 * fileName örn: "svc_1700000000.jpg"
 */
export async function pickAndUploadImage(args: {
  folder: string;
  fileName: string;
}) {
  // izin
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (perm.status !== "granted") {
    throw new Error("MEDIA_PERMISSION_DENIED");
  }

  // seç
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.85,
    allowsEditing: true,
    aspect: [4, 3],
  });

  if (result.canceled) {
    return { canceled: true as const, downloadUrl: null as string | null };
  }

  const uri = result.assets[0]?.uri;
  if (!uri) throw new Error("IMAGE_URI_NOT_FOUND");

  // blob
  const blob = await (await fetch(uri)).blob();

  // upload
  const fileRef = ref(storage, `${args.folder}/${args.fileName}`);
  await uploadBytes(fileRef, blob);

  const downloadUrl = await getDownloadURL(fileRef);
  return { canceled: false as const, downloadUrl };
}
