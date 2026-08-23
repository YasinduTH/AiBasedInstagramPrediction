// ============================================================
// DASHBOARD ANALYTICS SERVICE
// ============================================================

import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase";

// ============================================================
// GET USER PREDICTIONS
// ============================================================

export async function getUserPredictions(userId) {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  const predictionsRef = collection(db, "predictions");

  const predictionsQuery = query(
    predictionsRef,
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(predictionsQuery);

  const records = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Sort newest first.
  records.sort((a, b) => {
    const dateA = getPredictionDate(a);
    const dateB = getPredictionDate(b);

    return dateB.getTime() - dateA.getTime();
  });

  return records;
}

// ============================================================
// CALCULATE DASHBOARD ANALYTICS
// ============================================================

export function calculateDashboardAnalytics(predictions = []) {
  const total = predictions.length;

  // ----------------------------------------------------------
  // ENGAGEMENT COUNTS
  // ----------------------------------------------------------

  const high = predictions.filter(
    (item) =>
      String(item.prediction || "").toLowerCase() === "high"
  ).length;

  const medium = predictions.filter(
    (item) =>
      String(item.prediction || "").toLowerCase() === "medium"
  ).length;

  const low = predictions.filter(
    (item) =>
      String(item.prediction || "").toLowerCase() === "low"
  ).length;

  // ----------------------------------------------------------
  // IMAGE PREDICTIONS
  // ----------------------------------------------------------

  const imagePredictions = predictions.filter((item) => {
    return (
      item.image?.uploaded === true ||
      item.userInput?.hasImage === true ||
      item.inputSummary?.has_image === 1 ||
      item.inputSummary?.has_image === true
    );
  }).length;

  // ----------------------------------------------------------
  // CONFIDENCE
  // ----------------------------------------------------------

  const confidences = predictions
    .map((item) => {
      if (typeof item.confidence === "number") {
        return item.confidence;
      }

      if (
        typeof item.apiResponse?.confidence ===
        "number"
      ) {
        return item.apiResponse.confidence;
      }

      return null;
    })
    .filter(
      (value) =>
        typeof value === "number" &&
        Number.isFinite(value)
    );

  const averageConfidence =
    confidences.length > 0
      ? confidences.reduce(
          (sum, value) => sum + value,
          0
        ) / confidences.length
      : 0;

  // ----------------------------------------------------------
  // OPTIMIZATION SCORES
  // ----------------------------------------------------------

  const optimizationScores = predictions
    .map((item) => getOptimizationScore(item))
    .filter(
      (value) =>
        typeof value === "number" &&
        Number.isFinite(value)
    );

  const averageOptimizationScore =
    optimizationScores.length > 0
      ? optimizationScores.reduce(
          (sum, value) => sum + value,
          0
        ) / optimizationScores.length
      : 0;

  // ----------------------------------------------------------
  // OPTIMIZATION QUALITY
  // ----------------------------------------------------------

  const optimizationGood = optimizationScores.filter(
    (score) => score >= 80
  ).length;

  const optimizationModerate = optimizationScores.filter(
    (score) => score >= 50 && score < 80
  ).length;

  const optimizationNeedsImprovement =
    optimizationScores.filter(
      (score) => score < 50
    ).length;

  // ----------------------------------------------------------
  // OPTIMIZATION STATUS
  // ----------------------------------------------------------

  let optimizationStatus = "No optimization data";

  if (optimizationScores.length > 0) {
    if (averageOptimizationScore >= 80) {
      optimizationStatus = "Excellent";
    } else if (averageOptimizationScore >= 60) {
      optimizationStatus = "Good";
    } else if (averageOptimizationScore >= 40) {
      optimizationStatus = "Moderate";
    } else {
      optimizationStatus = "Needs Improvement";
    }
  }

  // ----------------------------------------------------------
  // ENGAGEMENT PERCENTAGES
  // ----------------------------------------------------------

  const highPercentage =
    total > 0 ? (high / total) * 100 : 0;

  const mediumPercentage =
    total > 0 ? (medium / total) * 100 : 0;

  const lowPercentage =
    total > 0 ? (low / total) * 100 : 0;

  // ----------------------------------------------------------
  // RETURN COMPLETE ANALYTICS OBJECT
  // ----------------------------------------------------------

  return {
    total,

    high,
    medium,
    low,

    highPercentage,
    mediumPercentage,
    lowPercentage,

    imagePredictions,

    averageConfidence,

    optimization: {
      available: optimizationScores.length > 0,

      count: optimizationScores.length,

      averageScore:
        averageOptimizationScore,

      status: optimizationStatus,

      good: optimizationGood,

      moderate: optimizationModerate,

      needsImprovement:
        optimizationNeedsImprovement,
    },
  };
}

// ============================================================
// GET OPTIMIZATION SCORE
// ============================================================

function getOptimizationScore(prediction) {
  const optimization =
    prediction?.optimization;

  if (!optimization) {
    return null;
  }

  // Current optimization structure
  // ----------------------------------------------------------

  if (
    typeof optimization.overall_score ===
    "number"
  ) {
    return optimization.overall_score;
  }

  if (
    typeof optimization.optimization_score ===
    "number"
  ) {
    return optimization.optimization_score;
  }

  if (
    typeof optimization.score ===
    "number"
  ) {
    return optimization.score;
  }

  // ----------------------------------------------------------
  // Alternative top-level structures
  // ----------------------------------------------------------

  if (
    typeof prediction.optimizationScore ===
    "number"
  ) {
    return prediction.optimizationScore;
  }

  if (
    typeof prediction.optimization_score ===
    "number"
  ) {
    return prediction.optimization_score;
  }

  return null;
}

// ============================================================
// FIRESTORE DATE HELPER
// ============================================================

function getPredictionDate(prediction) {
  const timestamp =
    prediction?.createdAt;

  if (!timestamp) {
    return new Date(0);
  }

  // Firestore Timestamp
  if (
    typeof timestamp.toDate ===
    "function"
  ) {
    return timestamp.toDate();
  }

  // Firestore timestamp object
  if (
    typeof timestamp.seconds ===
    "number"
  ) {
    return new Date(
      timestamp.seconds * 1000
    );
  }

  // JavaScript Date
  if (
    timestamp instanceof Date
  ) {
    return timestamp;
  }

  // String / number fallback
  const parsed =
    new Date(timestamp);

  if (
    !Number.isNaN(
      parsed.getTime()
    )
  ) {
    return parsed;
  }

  return new Date(0);
}