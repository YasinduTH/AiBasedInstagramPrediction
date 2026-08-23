import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase";

// ============================================================
// CREATE / UPDATE USER PROFILE
// ============================================================

export async function createUserProfile(
  user,
  profileData = {}
) {
  // ==========================================================
  // VALIDATE USER
  // ==========================================================

  if (!user) {
    throw new Error(
      "User is required."
    );
  }

  // ==========================================================
  // EXTRACT PROFILE DATA
  // ==========================================================

  const {
    fullName = "",
    dateOfBirth = "",
    instagramProfile = "",
  } = profileData;

  // ==========================================================
  // FIRESTORE USER DOCUMENT
  // ==========================================================

  const userRef = doc(
    db,
    "users",
    user.uid
  );

  // ==========================================================
  // SAVE PROFILE
  // ==========================================================

  await setDoc(
    userRef,
    {
      // ------------------------------------------------------
      // BASIC USER INFORMATION
      // ------------------------------------------------------

      email:
        user.email || "",

      displayName:
        fullName.trim() ||
        user.displayName ||
        "",

      fullName:
        fullName.trim(),

      // ------------------------------------------------------
      // PERSONAL INFORMATION
      // ------------------------------------------------------

      dateOfBirth:
        dateOfBirth || "",

      // ------------------------------------------------------
      // INSTAGRAM INFORMATION
      // ------------------------------------------------------

      instagramProfile:
        instagramProfile.trim(),

      // ------------------------------------------------------
      // TIMESTAMPS
      // ------------------------------------------------------

      createdAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp(),
    },
    {
      // Keep existing profile fields
      merge: true,
    }
  );

  return true;
}