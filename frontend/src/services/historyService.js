import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase";

/**
 * Get prediction history for the currently
 * authenticated user.
 *
 * We filter by userId so users only receive
 * their own prediction records.
 */
export async function getUserPredictionHistory(userId) {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  const predictionsRef = collection(
    db,
    "predictions"
  );

  const historyQuery = query(
    predictionsRef,
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(historyQuery);

  const history = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Sort newest first.
  // We do this in JavaScript instead of using
  // Firestore orderBy so we don't need an index.
  history.sort((a, b) => {
    const dateA =
      a.createdAt?.toDate?.() ||
      new Date(0);

    const dateB =
      b.createdAt?.toDate?.() ||
      new Date(0);

    return dateB - dateA;
  });

  return history;
}