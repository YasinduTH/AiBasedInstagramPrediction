import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db, auth } from "../firebase";

// ============================================================
// FLASK PRODUCTION API
// ============================================================

const API_URL = "http://127.0.0.1:5000/api/predict";

const API_BASE_URL = "http://127.0.0.1:5000";


// ============================================================
// RUN PREDICTION
// ============================================================

export async function runPrediction({
  caption,
  hashtags,
  category,
  accountType,
  accountActivityLevel,
  contentConsistency,
  image,
}) {

  // ==========================================================
  // 1. CHECK AUTHENTICATION
  // ==========================================================

  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "You must be logged in to make a prediction."
    );
  }


  // ==========================================================
  // 2. VALIDATE INPUT
  // ==========================================================

  if (!caption || !caption.trim()) {
    throw new Error("Caption is required.");
  }

  if (!category) {
    throw new Error("Content category is required.");
  }

  if (!accountType) {
    throw new Error("Account type is required.");
  }


  // ==========================================================
  // 3. CLEAN INPUT VALUES
  // ==========================================================

  const cleanCaption = caption.trim();

  const cleanHashtags = hashtags
    ? hashtags.trim()
    : "";

  const activityLevel = Number(
    accountActivityLevel ?? 0.75
  );

  const consistency = Number(
    contentConsistency ?? 0.70
  );


  // ==========================================================
  // 4. CREATE FORMDATA
  // ==========================================================

  const formData = new FormData();


  formData.append(
    "caption",
    cleanCaption
  );


  formData.append(
    "hashtags",
    cleanHashtags
  );


  formData.append(
    "category",
    category
  );


  formData.append(
    "account_type",
    accountType
  );


  formData.append(
    "account_activity_level",
    String(activityLevel)
  );


  formData.append(
    "content_consistency",
    String(consistency)
  );


  // ==========================================================
  // 5. ADD IMAGE
  // ==========================================================

  if (image) {

    formData.append(
      "image",
      image
    );

    console.log(
      "Image attached:",
      image.name
    );
  } else {

    console.log(
      "No image attached."
    );
  }


  // ==========================================================
  // 6. CALL FLASK AI API
  // ==========================================================

  let response;

  try {

    response = await fetch(
      API_URL,
      {
        method: "POST",
        body: formData,
      }
    );

  } catch (error) {

    console.error(
      "Prediction API connection error:",
      error
    );

    throw new Error(
      "Unable to connect to the AI prediction server. " +
      "Make sure Flask is running on port 5000."
    );
  }


  // ==========================================================
  // 7. READ API RESPONSE
  // ==========================================================

  let result;

  try {

    result = await response.json();

  } catch (error) {

    console.error(
      "Invalid API response:",
      error
    );

    throw new Error(
      "The prediction server returned an invalid response."
    );
  }


  // ==========================================================
  // 8. CHECK API RESULT
  // ==========================================================

  if (
    !response.ok ||
    result.success === false
  ) {

    throw new Error(
      result.error ||
      result.message ||
      `Prediction API failed with status ${response.status}.`
    );
  }


  // ==========================================================
  // 9. EXTRACT IMAGE INFORMATION
  // ==========================================================

  const apiImage =
    result.image || null;


  let imageData = {

    uploaded: false,

    originalFileName: null,

    savedFileName: null,

    fileType: null,

    fileSize: null,

    imageUrl: null,

    imageWidth: null,

    imageHeight: null,
  };


  // ----------------------------------------------------------
  // IMAGE WAS SUCCESSFULLY STORED BY FLASK
  // ----------------------------------------------------------

  if (
    apiImage &&
    apiImage.uploaded === true
  ) {

    let imageUrl = apiImage.image_url || null;


    // --------------------------------------------------------
    // Convert relative Flask URL into full URL
    // --------------------------------------------------------

    if (
      imageUrl &&
      imageUrl.startsWith("/")
    ) {

      imageUrl =
        `${API_BASE_URL}${imageUrl}`;
    }


    imageData = {

      uploaded: true,

      originalFileName:
        apiImage.original_file_name ||
        image?.name ||
        null,

      savedFileName:
        apiImage.saved_file_name ||
        null,

      fileType:
        apiImage.file_type ||
        image?.type ||
        null,

      fileSize:
        apiImage.file_size ||
        image?.size ||
        null,

      imageUrl:
        imageUrl,

      imageWidth:
        apiImage.image_width ??
        result.input_summary?.image_width ??
        null,

      imageHeight:
        apiImage.image_height ??
        result.input_summary?.image_height ??
        null,
    };


    console.log(
      "Image stored successfully:",
      imageData
    );

  } else {

    console.log(
      "Prediction completed without an uploaded image."
    );
  }


  // ==========================================================
  // 10. BUILD COMPLETE FIRESTORE HISTORY RECORD
  // ==========================================================

  const predictionData = {

    // ========================================================
    // USER INFORMATION
    // ========================================================

    userId:
      user.uid,

    userEmail:
      user.email || "",


    // ========================================================
    // USER INPUT
    // ========================================================

    userInput: {

      caption:
        cleanCaption,

      hashtags:
        cleanHashtags,

      category:
        category,

      accountType:
        accountType,

      accountActivityLevel:
        activityLevel,

      contentConsistency:
        consistency,

      hasImage:
        imageData.uploaded,

      imageName:
        imageData.originalFileName,

      imageType:
        imageData.fileType,

      imageSize:
        imageData.fileSize,
    },


    // ========================================================
    // IMAGE INFORMATION
    // ========================================================

    image: {

      uploaded:
        imageData.uploaded,

      originalFileName:
        imageData.originalFileName,

      savedFileName:
        imageData.savedFileName,

      fileType:
        imageData.fileType,

      fileSize:
        imageData.fileSize,

      imageUrl:
        imageData.imageUrl,

      imageWidth:
        imageData.imageWidth,

      imageHeight:
        imageData.imageHeight,
    },


    // ========================================================
    // MODEL PREDICTION
    // ========================================================

    prediction:
      result.prediction || null,


    confidence:
      typeof result.confidence === "number"
        ? result.confidence
        : null,


    probabilities:
      result.probabilities || {},


    // ========================================================
    // MODEL INFORMATION
    // ========================================================

    featureCount:
      result.feature_count || 56,


    // ========================================================
    // MODEL INPUT SUMMARY
    // ========================================================

    inputSummary:
      result.input_summary || {},


    // ========================================================
    // COMPLETE API RESPONSE
    // ========================================================

    apiResponse:
      result,


    // ========================================================
    // TIMESTAMP
    // ========================================================

    createdAt:
      serverTimestamp(),
  };


  // ==========================================================
  // 11. SAVE TO FIRESTORE
  // ==========================================================

  const predictionRef =
    await addDoc(
      collection(
        db,
        "predictions"
      ),
      predictionData
    );


  // ==========================================================
  // 12. RETURN RECORD TO UI
  // ==========================================================

  return {

    id:
      predictionRef.id,

    ...predictionData,

  };
}