import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "../firebase";

// ============================================================
// FIRESTORE COLLECTION
// ============================================================

const REMINDERS_COLLECTION = "reminders";

// ============================================================
// GET CURRENT USER
// ============================================================

function getCurrentUser() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "You must be logged in to manage reminders."
    );
  }

  return user;
}

// ============================================================
// CREATE REMINDER
// ============================================================
//
// This function supports BOTH:
//
// 1. Normal reminder page
// 2. Reminder created from a predicted post
//
// Prediction-related fields are OPTIONAL.
// ============================================================

export async function createReminder({
  title,
  date,
  time,
  notes = "",

  // ----------------------------------------------------------
  // OPTIONAL PREDICTION INFORMATION
  // ----------------------------------------------------------

  predictionId = null,
  caption = "",
  hashtags = "",
  category = "",
  prediction = "",
  confidence = null,
  optimizationScore = null,
  imageUrl = null,
}) {
  const user = getCurrentUser();

  // ==========================================================
  // VALIDATION
  // ==========================================================

  if (!title || !title.trim()) {
    throw new Error("Reminder title is required.");
  }

  if (!date) {
    throw new Error("Reminder date is required.");
  }

  if (!time) {
    throw new Error("Reminder time is required.");
  }

  // ==========================================================
  // CREATE BASE REMINDER DATA
  // ==========================================================

  const reminderData = {
    // --------------------------------------------------------
    // USER
    // --------------------------------------------------------

    userId: user.uid,

    userEmail: user.email || "",

    // --------------------------------------------------------
    // REMINDER
    // --------------------------------------------------------

    title: title.trim(),

    date: date,

    time: time,

    notes: notes ? notes.trim() : "",

    completed: false,

    // --------------------------------------------------------
    // PREDICTION LINK
    // --------------------------------------------------------

    predictionId: predictionId || null,

    // --------------------------------------------------------
    // PREDICTED POST INFORMATION
    // --------------------------------------------------------

    predictedPost: {
      caption: caption || "",

      hashtags: hashtags || "",

      category: category || "",

      prediction: prediction || "",

      confidence:
        typeof confidence === "number"
          ? confidence
          : null,

      optimizationScore:
        typeof optimizationScore === "number"
          ? optimizationScore
          : null,

      imageUrl: imageUrl || null,
    },

    // --------------------------------------------------------
    // TIMESTAMPS
    // --------------------------------------------------------

    createdAt: serverTimestamp(),

    updatedAt: serverTimestamp(),
  };

  // ==========================================================
  // SAVE TO FIRESTORE
  // ==========================================================

  const reminderRef = await addDoc(
    collection(
      db,
      REMINDERS_COLLECTION
    ),
    reminderData
  );

  // ==========================================================
  // RETURN CREATED REMINDER
  // ==========================================================

  return {
    id: reminderRef.id,

    ...reminderData,
  };
}

// ============================================================
// GET USER REMINDERS
// ============================================================

export async function getUserReminders() {
  const user = getCurrentUser();

  // ----------------------------------------------------------
  // FIRESTORE QUERY
  // ----------------------------------------------------------

  const remindersQuery = query(
    collection(
      db,
      REMINDERS_COLLECTION
    ),

    where(
      "userId",
      "==",
      user.uid
    ),

    orderBy(
      "date",
      "asc"
    )
  );

  const snapshot = await getDocs(
    remindersQuery
  );

  // ----------------------------------------------------------
  // CONVERT FIRESTORE DOCUMENTS
  // ----------------------------------------------------------

  const reminders = snapshot.docs.map(
    (document) => ({
      id: document.id,

      ...document.data(),
    })
  );

  // ----------------------------------------------------------
  // SORT BY DATE + TIME
  // ----------------------------------------------------------

  reminders.sort(
    (a, b) => {
      const dateTimeA =
        `${a.date || ""} ${a.time || ""}`;

      const dateTimeB =
        `${b.date || ""} ${b.time || ""}`;

      return dateTimeA.localeCompare(
        dateTimeB
      );
    }
  );

  return reminders;
}

// ============================================================
// MARK REMINDER AS COMPLETED
// ============================================================

export async function completeReminder(
  reminderId
) {
  const user = getCurrentUser();

  if (!reminderId) {
    throw new Error(
      "Reminder ID is required."
    );
  }

  const reminderRef = doc(
    db,
    REMINDERS_COLLECTION,
    reminderId
  );

  await updateDoc(
    reminderRef,
    {
      completed: true,

      updatedAt:
        serverTimestamp(),

      completedAt:
        serverTimestamp(),

      completedBy:
        user.uid,
    }
  );

  return true;
}

// ============================================================
// MARK REMINDER AS PENDING
// ============================================================

export async function reopenReminder(
  reminderId
) {
  const user = getCurrentUser();

  if (!reminderId) {
    throw new Error(
      "Reminder ID is required."
    );
  }

  const reminderRef = doc(
    db,
    REMINDERS_COLLECTION,
    reminderId
  );

  await updateDoc(
    reminderRef,
    {
      completed: false,

      updatedAt:
        serverTimestamp(),

      completedAt: null,

      completedBy:
        user.uid,
    }
  );

  return true;
}

// ============================================================
// DELETE REMINDER
// ============================================================

export async function deleteReminder(
  reminderId
) {
  getCurrentUser();

  if (!reminderId) {
    throw new Error(
      "Reminder ID is required."
    );
  }

  const reminderRef = doc(
    db,
    REMINDERS_COLLECTION,
    reminderId
  );

  await deleteDoc(
    reminderRef
  );

  return true;
}

// ============================================================
// UPDATE REMINDER
// ============================================================
//
// Prediction information is NOT changed here.
// This keeps the original predicted-post data intact.
// ============================================================

export async function updateReminder(
  reminderId,
  {
    title,
    date,
    time,
    notes = "",
  }
) {
  getCurrentUser();

  if (!reminderId) {
    throw new Error(
      "Reminder ID is required."
    );
  }

  if (!title || !title.trim()) {
    throw new Error(
      "Reminder title is required."
    );
  }

  if (!date) {
    throw new Error(
      "Reminder date is required."
    );
  }

  if (!time) {
    throw new Error(
      "Reminder time is required."
    );
  }

  const reminderRef = doc(
    db,
    REMINDERS_COLLECTION,
    reminderId
  );

  await updateDoc(
    reminderRef,
    {
      title:
        title.trim(),

      date,

      time,

      notes:
        notes
          ? notes.trim()
          : "",

      updatedAt:
        serverTimestamp(),
    }
  );

  return true;
}