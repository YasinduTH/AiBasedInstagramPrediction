import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase";

export async function createUserProfile(user) {
  if (!user) {
    throw new Error("User is required.");
  }

  const userRef = doc(db, "users", user.uid);

  await setDoc(
    userRef,
    {
      email: user.email || "",
      displayName: user.displayName || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      merge: true,
    }
  );
}