import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { UserDoc } from "../types/user";


export async function createUserDoc(data:UserDoc) {
    //users/uid
    const ref = doc(db,"users",data.uid);
    await setDoc(ref,data,{merge:true});//merge true option'u ile eğer böyle bir uid ya sahip bilgi varsa güncelle
}

export async function getUserDoc(uid:string) {

    const ref =doc(db,"users",uid);
    const snap = await getDoc(ref)

    if(!snap.exists()) return null;  


    return snap.data() as UserDoc;
}

