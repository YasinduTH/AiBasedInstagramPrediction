import jsPDF from "jspdf";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase";

// ============================================================
// HELPERS
// ============================================================

function safeText(value, fallback = "N/A") {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return fallback;
  }

  return String(value);
}

// ============================================================
// NUMBER FORMAT
// ============================================================

function formatNumber(value, decimals = 2) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "N/A";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return "N/A";
  }

  return number.toFixed(decimals);
}

// ============================================================
// PERCENTAGE FORMAT
// ============================================================

function formatPercentage(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "N/A";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return "N/A";
  }

  if (number <= 1) {
    return `${(number * 100).toFixed(2)}%`;
  }

  return `${number.toFixed(2)}%`;
}

// ============================================================
// DATE FORMAT
// ============================================================

function formatDate(value) {
  if (!value) {
    return new Date().toLocaleString();
  }

  // Firebase Timestamp
  if (
    value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toLocaleString();
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

// ============================================================
// ARRAY VALUE HELPER
// ============================================================

function getArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  return [];
}

// ============================================================
// CONVERT VALUE TO DISPLAY TEXT
// ============================================================

function displayValue(
  value,
  fallback = "N/A"
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return fallback;
    }

    return value.join(", ");
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }

  return String(value);
}

// ============================================================
// ADD WRAPPED TEXT
// ============================================================

function addWrappedText(
  doc,
  text,
  x,
  y,
  maxWidth,
  lineHeight = 5
) {
  const safe = safeText(text);

  const lines =
    doc.splitTextToSize(
      safe,
      maxWidth
    );

  doc.text(
    lines,
    x,
    y
  );

  return (
    y +
    lines.length *
      lineHeight
  );
}

// ============================================================
// SECTION TITLE
// ============================================================

function addSectionTitle(
  doc,
  title,
  y
) {
  doc.setFontSize(14);

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.text(
    title,
    20,
    y
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  return y + 8;
}

// ============================================================
// LABEL + VALUE
// ============================================================

function addLabelValue(
  doc,
  label,
  value,
  y
) {
  const pageWidth =
    doc.internal.pageSize.width;

  const leftX = 20;
  const valueX = 65;

  const valueWidth =
    pageWidth -
    valueX -
    20;

  doc.setFontSize(10);

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.text(
    `${label}:`,
    leftX,
    y
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  const lines =
    doc.splitTextToSize(
      safeText(value),
      valueWidth
    );

  doc.text(
    lines,
    valueX,
    y
  );

  return (
    y +
    Math.max(
      1,
      lines.length
    ) *
      5
  );
}

// ============================================================
// FOOTER
// ============================================================

function addFooter(
  doc,
  pageNumber
) {
  const pageWidth =
    doc.internal.pageSize.width;

  const pageHeight =
    doc.internal.pageSize.height;

  doc.setFontSize(8);

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.text(
    "AI Instagram Engagement Prediction & Content Optimization System",
    20,
    pageHeight - 12
  );

  doc.text(
    `Page ${pageNumber}`,
    pageWidth - 20,
    pageHeight - 12,
    {
      align: "right",
    }
  );
}

// ============================================================
// PAGE BREAK CHECK
// ============================================================

function checkPage(
  doc,
  y,
  pageNumber,
  requiredSpace = 25
) {
  const pageHeight =
    doc.internal.pageSize.height;

  const footerSpace = 25;

  if (
    y + requiredSpace >
    pageHeight -
      footerSpace
  ) {
    addFooter(
      doc,
      pageNumber.value
    );

    doc.addPage();

    pageNumber.value += 1;

    return 20;
  }

  return y;
}

// ============================================================
// ADD SAFE ROW
// ============================================================

function addSafeRow(
  doc,
  pageNumber,
  label,
  value,
  y,
  extraSpace = 2
) {
  y = checkPage(
    doc,
    y,
    pageNumber,
    12
  );

  y = addLabelValue(
    doc,
    label,
    value,
    y
  );

  return y + extraSpace;
}

// ============================================================
// GET OPTIMIZATION OBJECT
// ============================================================

function getOptimizationData(
  prediction
) {
  const apiResponse =
    prediction?.apiResponse ||
    {};

  return (
    prediction?.optimization ||
    prediction?.contentOptimization ||
    apiResponse?.optimization ||
    apiResponse?.content_optimization ||
    apiResponse?.contentOptimization ||
    {}
  );
}

// ============================================================
// GET OPTIMIZATION SCORE
// ============================================================

function getOptimizationScore(
  prediction,
  optimization
) {
  const possibleValues = [
    prediction?.optimizationScore,

    prediction?.optimization_score,

    optimization?.score,

    optimization?.optimizationScore,

    optimization?.optimization_score,

    optimization?.optimization?.score,

    prediction?.apiResponse
      ?.optimizationScore,

    prediction?.apiResponse
      ?.optimization_score,

    prediction?.apiResponse
      ?.optimization?.score,

    prediction?.apiResponse
      ?.optimization
      ?.optimizationScore,

    prediction?.apiResponse
      ?.optimization
      ?.optimization_score,
  ];

  for (
    const value of possibleValues
  ) {
    if (
      value !== null &&
      value !== undefined &&
      value !== "" &&
      !Number.isNaN(
        Number(value)
      )
    ) {
      return Number(value);
    }
  }

  return null;
}

// ============================================================
// GET MODEL NAME
// ============================================================

function getModelName(
  prediction
) {
  const apiResponse =
    prediction?.apiResponse ||
    {};

  return (
    prediction?.modelName ||
    prediction?.model_name ||
    apiResponse?.modelName ||
    apiResponse?.model_name ||
    apiResponse?.model?.name ||
    apiResponse?.model?.model_name ||
    "HistGradientBoosting Baseline"
  );
}

// ============================================================
// GET MODEL FEATURE COUNT
// ============================================================

function getFeatureCount(
  prediction
) {
  const apiResponse =
    prediction?.apiResponse ||
    {};

  return (
    prediction?.featureCount ||
    prediction?.feature_count ||
    apiResponse?.featureCount ||
    apiResponse?.feature_count ||
    56
  );
}

// ============================================================
// GET OPTIMIZATION STATUS
// ============================================================

function getOptimizationStatus(
  score
) {
  if (score === null) {
    return "N/A";
  }

  if (score >= 80) {
    return "Good";
  }

  if (score >= 50) {
    return "Moderate";
  }

  return "Needs Improvement";
}

// ============================================================
// GET USER PROFILE VALUE
// ============================================================

function getProfileValue(
  profile,
  key,
  fallback = "N/A"
) {
  if (
    profile &&
    profile[key] !== null &&
    profile[key] !== undefined &&
    String(
      profile[key]
    ).trim() !== ""
  ) {
    return profile[key];
  }

  return fallback;
}

// ============================================================
// GET FIRESTORE USER PROFILE
// ============================================================

async function getUserProfile(
  user
) {
  if (!user?.uid) {
    return null;
  }

  try {
    const userRef =
      doc(
        db,
        "users",
        user.uid
      );

    const userSnapshot =
      await getDoc(
        userRef
      );

    if (
      userSnapshot.exists()
    ) {
      return userSnapshot.data();
    }

    return null;
  } catch (error) {
    console.error(
      "Failed to load user profile:",
      error
    );

    return null;
  }
}

// ============================================================
// GENERATE PDF REPORT
// ============================================================

export async function generatePredictionPDF({
  prediction,
  user,
  profile,
}) {
  if (!prediction) {
    throw new Error(
      "Prediction data is required to generate the report."
    );
  }

  // ==========================================================
  // GET CURRENT USER
  // ==========================================================

  const currentUser =
    user ||
    auth.currentUser;

  // ==========================================================
  // LOAD USER PROFILE
  // ==========================================================

  let firestoreProfile =
    profile || null;

  if (
    !firestoreProfile &&
    currentUser?.uid
  ) {
    firestoreProfile =
      await getUserProfile(
        currentUser
      );
  }

  // ==========================================================
  // CREATE PDF
  // ==========================================================

  const doc =
    new jsPDF();

  const pageWidth =
    doc.internal.pageSize.width;

  const margin = 20;

  let y = 20;

  const pageNumber = {
    value: 1,
  };

  // ==========================================================
  // EXTRACT DATA
  // ==========================================================

  const input =
    prediction.userInput ||
    prediction.user_input ||
    {};

  const summary =
    prediction.inputSummary ||
    prediction.input_summary ||
    {};

  const image =
    prediction.image ||
    {};

  const apiResponse =
    prediction.apiResponse ||
    {};

  const optimization =
    getOptimizationData(
      prediction
    );

  const optimizationScore =
    getOptimizationScore(
      prediction,
      optimization
    );

  const optimizationStatus =
    getOptimizationStatus(
      optimizationScore
    );

  // ==========================================================
  // USER INFORMATION
  // ==========================================================

  const fullName =
    getProfileValue(
      firestoreProfile,
      "fullName",
      currentUser?.displayName ||
        "Instagram User"
    );

  const email =
    getProfileValue(
      firestoreProfile,
      "email",
      currentUser?.email ||
        "N/A"
    );

  const dateOfBirth =
    getProfileValue(
      firestoreProfile,
      "dateOfBirth",
      "N/A"
    );

  const instagramProfile =
    getProfileValue(
      firestoreProfile,
      "instagramProfile",
      "N/A"
    );

  // ==========================================================
  // PREDICTION
  // ==========================================================

  const predictionResult =
    prediction.prediction ||
    prediction.result ||
    summary.prediction ||
    apiResponse.prediction ||
    "N/A";

  const confidence =
    prediction.confidence ??
    apiResponse.confidence ??
    null;

  const probabilities =
    prediction.probabilities ||
    apiResponse.probabilities ||
    {};

  // ==========================================================
  // MODEL
  // ==========================================================

  const modelName =
    getModelName(
      prediction
    );

  const featureCount =
    getFeatureCount(
      prediction
    );

  // ==========================================================
  // IMAGE
  // ==========================================================

  const imageUploaded =
    image.uploaded === true ||
    input.hasImage === true ||
    summary.has_image === 1 ||
    summary.hasImage === 1;

  // ==========================================================
  // HEADER
  // ==========================================================

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(22);

  doc.text(
    "AI Instagram",
    margin,
    y
  );

  y += 8;

  doc.text(
    "Engagement Prediction Report",
    margin,
    y
  );

  y += 8;

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(10);

  doc.text(
    "AI-Based Instagram Engagement Prediction and Content Optimization System",
    margin,
    y
  );

  y += 10;

  doc.line(
    margin,
    y,
    pageWidth - margin,
    y
  );

  y += 12;

  // ==========================================================
  // REPORT INFORMATION
  // ==========================================================

  y = checkPage(
    doc,
    y,
    pageNumber,
    40
  );

  y = addSectionTitle(
    doc,
    "Report Information",
    y
  );

  y = addSafeRow(
    doc,
    pageNumber,
    "Generated",
    formatDate(new Date()),
    y
  );

  y = addSafeRow(
    doc,
    pageNumber,
    "Full Name",
    fullName,
    y
  );

  y = addSafeRow(
    doc,
    pageNumber,
    "Email",
    email,
    y
  );

  y = addSafeRow(
    doc,
    pageNumber,
    "Date of Birth",
    dateOfBirth,
    y
  );

  y = addSafeRow(
    doc,
    pageNumber,
    "Instagram Profile",
    instagramProfile,
    y
  );

  y += 6;

  // ==========================================================
  // PREDICTION RESULT
  // ==========================================================

  y = checkPage(
    doc,
    y,
    pageNumber,
    50
  );

  y = addSectionTitle(
    doc,
    "Prediction Result",
    y
  );

  y = addSafeRow(
    doc,
    pageNumber,
    "Engagement Level",
    predictionResult,
    y
  );

  y = addSafeRow(
    doc,
    pageNumber,
    "Confidence",
    formatPercentage(
      confidence
    ),
    y
  );

  y += 3;

  // ==========================================================
  // PREDICTION PROBABILITIES
  // ==========================================================

  if (
    probabilities &&
    Object.keys(
      probabilities
    ).length > 0
  ) {
    y = checkPage(
      doc,
      y,
      pageNumber,
      45
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(10);

    doc.text(
      "Prediction Probabilities:",
      20,
      y
    );

    y += 6;

    doc.setFont(
      "helvetica",
      "normal"
    );

    const probabilityOrder = [
      "High",
      "high",
      "Medium",
      "medium",
      "Low",
      "low",
    ];

    const displayed =
      new Set();

    probabilityOrder.forEach(
      (key) => {
        if (
          probabilities[key] !==
            undefined &&
          !displayed.has(
            key.toLowerCase()
          )
        ) {
          displayed.add(
            key.toLowerCase()
          );

          y = addSafeRow(
            doc,
            pageNumber,
            key
              .charAt(0)
              .toUpperCase() +
              key
                .slice(1)
                .toLowerCase(),
            formatPercentage(
              probabilities[key]
            ),
            y
          );
        }
      }
    );

    Object.entries(
      probabilities
    ).forEach(
      ([label, value]) => {
        if (
          !displayed.has(
            label.toLowerCase()
          )
        ) {
          displayed.add(
            label.toLowerCase()
          );

          y = addSafeRow(
            doc,
            pageNumber,
            label,
            formatPercentage(
              value
            ),
            y
          );
        }
      }
    );

    y += 5;
  }

  // ==========================================================
  // INSTAGRAM CONTENT
  // ==========================================================

  y = checkPage(
    doc,
    y,
    pageNumber,
    65
  );

  y = addSectionTitle(
    doc,
    "Instagram Content",
    y
  );

  y = addSafeRow(
    doc,
    pageNumber,
    "Category",
    input.category ||
      summary.category ||
      "N/A",
    y
  );

  y = addSafeRow(
    doc,
    pageNumber,
    "Account Type",
    input.accountType ||
      summary.account_type ||
      summary.accountType ||
      "N/A",
    y
  );

  y = addSafeRow(
    doc,
    pageNumber,
    "Activity Level",
    input.accountActivityLevel ??
      summary.account_activity_level ??
      summary.activity_level ??
      "N/A",
    y
  );

  y = addSafeRow(
    doc,
    pageNumber,
    "Content Consistency",
    input.contentConsistency ??
      summary.content_consistency ??
      summary.contentConsistency ??
      "N/A",
    y
  );

  y = addSafeRow(
    doc,
    pageNumber,
    "Caption",
    input.caption ||
      summary.caption ||
      "N/A",
    y
  );

  y = addSafeRow(
    doc,
    pageNumber,
    "Hashtags",
    input.hashtags ||
      summary.hashtags ||
      "None",
    y
  );

  y += 6;

  // ==========================================================
  // IMAGE ANALYSIS
  // ==========================================================

  y = checkPage(
    doc,
    y,
    pageNumber,
    75
  );

  y = addSectionTitle(
    doc,
    "Image Analysis",
    y
  );

  y = addSafeRow(
    doc,
    pageNumber,
    "Image Uploaded",
    imageUploaded
      ? "Yes"
      : "No",
    y
  );

  if (imageUploaded) {
    y = addSafeRow(
      doc,
      pageNumber,
      "File Name",
      image.originalFileName ||
        input.imageName ||
        "N/A",
      y
    );

    y = addSafeRow(
      doc,
      pageNumber,
      "Image Type",
      image.fileType ||
        input.imageType ||
        "N/A",
      y
    );

    y = addSafeRow(
      doc,
      pageNumber,
      "File Size",
      image.fileSize
        ? `${(
            Number(
              image.fileSize
            ) / 1024
          ).toFixed(2)} KB`
        : "N/A",
      y
    );

    const imageWidth =
      image.imageWidth ??
      summary.image_width ??
      summary.imageWidth;

    const imageHeight =
      image.imageHeight ??
      summary.image_height ??
      summary.imageHeight;

    if (
      imageWidth &&
      imageHeight
    ) {
      y = addSafeRow(
        doc,
        pageNumber,
        "Dimensions",
        `${imageWidth} × ${imageHeight}`,
        y
      );
    }

    // --------------------------------------------------------
    // IMAGE FEATURES
    // --------------------------------------------------------

    const imageAnalysis =
      prediction.imageAnalysis ||
      apiResponse.imageAnalysis ||
      apiResponse.image_analysis ||
      optimization.image ||
      {};

    const brightness =
      imageAnalysis.brightness ??
      imageAnalysis.average_brightness ??
      imageAnalysis.avg_brightness;

    const contrast =
      imageAnalysis.contrast ??
      imageAnalysis.image_contrast;

    const sharpness =
      imageAnalysis.sharpness ??
      imageAnalysis.image_sharpness;

    if (
      brightness !==
        undefined &&
      brightness !== null
    ) {
      y = addSafeRow(
        doc,
        pageNumber,
        "Brightness",
        formatNumber(
          brightness,
          2
        ),
        y
      );
    }

    if (
      contrast !==
        undefined &&
      contrast !== null
    ) {
      y = addSafeRow(
        doc,
        pageNumber,
        "Contrast",
        formatNumber(
          contrast,
          2
        ),
        y
      );
    }

    if (
      sharpness !==
        undefined &&
      sharpness !== null
    ) {
      y = addSafeRow(
        doc,
        pageNumber,
        "Sharpness",
        formatNumber(
          sharpness,
          2
        ),
        y
      );
    }
  }

  y += 6;

  // ==========================================================
  // CONTENT OPTIMIZATION
  // ==========================================================

  y = checkPage(
    doc,
    y,
    pageNumber,
    55
  );

  y = addSectionTitle(
    doc,
    "Content Optimization",
    y
  );

  y = addSafeRow(
    doc,
    pageNumber,
    "Optimization Score",
    optimizationScore !== null
      ? `${optimizationScore.toFixed(
          1
        )}/100`
      : "N/A",
    y
  );

  y = addSafeRow(
    doc,
    pageNumber,
    "Optimization Status",
    optimizationStatus,
    y
  );

  y += 5;

  // ==========================================================
  // CAPTION ANALYSIS
  // ==========================================================

  const captionAnalysis =
    optimization.caption ||
    optimization.captionAnalysis ||
    apiResponse.caption ||
    apiResponse.captionAnalysis ||
    {};

  if (
    Object.keys(
      captionAnalysis
    ).length > 0
  ) {
    y = checkPage(
      doc,
      y,
      pageNumber,
      75
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(11);

    doc.text(
      "Caption Analysis",
      20,
      y
    );

    y += 7;

    doc.setFont(
      "helvetica",
      "normal"
    );

    const characterCount =
      captionAnalysis.character_count ??
      captionAnalysis.characterCount;

    const wordCount =
      captionAnalysis.word_count ??
      captionAnalysis.wordCount;

    const hasCallToAction =
      captionAnalysis.has_call_to_action ??
      captionAnalysis.hasCallToAction;

    const hasEmoji =
      captionAnalysis.has_emoji ??
      captionAnalysis.hasEmoji;

    const hasQuestion =
      captionAnalysis.has_question ??
      captionAnalysis.hasQuestion;

    if (
      characterCount !==
      undefined
    ) {
      y = addSafeRow(
        doc,
        pageNumber,
        "Character Count",
        characterCount,
        y
      );
    }

    if (
      wordCount !==
      undefined
    ) {
      y = addSafeRow(
        doc,
        pageNumber,
        "Word Count",
        wordCount,
        y
      );
    }

    if (
      hasCallToAction !==
      undefined
    ) {
      y = addSafeRow(
        doc,
        pageNumber,
        "Has Call To Action",
        hasCallToAction
          ? "Yes"
          : "No",
        y
      );
    }

    if (
      hasEmoji !==
      undefined
    ) {
      y = addSafeRow(
        doc,
        pageNumber,
        "Has Emoji",
        hasEmoji
          ? "Yes"
          : "No",
        y
      );
    }

    if (
      hasQuestion !==
      undefined
    ) {
      y = addSafeRow(
        doc,
        pageNumber,
        "Has Question",
        hasQuestion
          ? "Yes"
          : "No",
        y
      );
    }

    if (
      captionAnalysis.status
    ) {
      y = addSafeRow(
        doc,
        pageNumber,
        "Status",
        captionAnalysis.status,
        y
      );
    }

    if (
      captionAnalysis.suggestions
    ) {
      y = addSafeRow(
        doc,
        pageNumber,
        "Suggestions",
        Array.isArray(
          captionAnalysis.suggestions
        )
          ? captionAnalysis.suggestions.join(
              " "
            )
          : captionAnalysis.suggestions,
        y
      );
    }

    y += 5;
  }

  // ==========================================================
  // HASHTAG ANALYSIS
  // ==========================================================

  const hashtagAnalysis =
    optimization.hashtag ||
    optimization.hashtags ||
    optimization.hashtagAnalysis ||
    apiResponse.hashtag ||
    apiResponse.hashtags ||
    apiResponse.hashtagAnalysis ||
    {};

  if (
    Object.keys(
      hashtagAnalysis
    ).length > 0
  ) {
    y = checkPage(
      doc,
      y,
      pageNumber,
      65
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(11);

    doc.text(
      "Hashtag Analysis",
      20,
      y
    );

    y += 7;

    doc.setFont(
      "helvetica",
      "normal"
    );

    const hashtagCount =
      hashtagAnalysis.hashtag_count ??
      hashtagAnalysis.hashtagCount ??
      hashtagAnalysis.count;

    if (
      hashtagCount !==
      undefined
    ) {
      y = addSafeRow(
        doc,
        pageNumber,
        "Hashtag Count",
        hashtagCount,
        y
      );
    }

    if (
      hashtagAnalysis.hashtags
    ) {
      y = addSafeRow(
        doc,
        pageNumber,
        "Hashtags",
        Array.isArray(
          hashtagAnalysis.hashtags
        )
          ? hashtagAnalysis.hashtags.join(
              ", "
            )
          : hashtagAnalysis.hashtags,
        y
      );
    }

    if (
      hashtagAnalysis.status
    ) {
      y = addSafeRow(
        doc,
        pageNumber,
        "Status",
        hashtagAnalysis.status,
        y
      );
    }

    if (
      hashtagAnalysis.suggestions
    ) {
      y = addSafeRow(
        doc,
        pageNumber,
        "Suggestions",
        Array.isArray(
          hashtagAnalysis.suggestions
        )
          ? hashtagAnalysis.suggestions.join(
              " "
            )
          : hashtagAnalysis.suggestions,
        y
      );
    }

    y += 5;
  }

  // ==========================================================
  // IMAGE OPTIMIZATION ANALYSIS
  // ==========================================================

  const optimizationImage =
    optimization.image ||
    optimization.imageAnalysis ||
    {};

  if (
    Object.keys(
      optimizationImage
    ).length > 0
  ) {
    y = checkPage(
      doc,
      y,
      pageNumber,
      65
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(11);

    doc.text(
      "Image Optimization Analysis",
      20,
      y
    );

    y += 7;

    doc.setFont(
      "helvetica",
      "normal"
    );

    if (
      optimizationImage.status
    ) {
      y = addSafeRow(
        doc,
        pageNumber,
        "Status",
        optimizationImage.status,
        y
      );
    }

    if (
      optimizationImage.strengths
    ) {
      y = addSafeRow(
        doc,
        pageNumber,
        "Strengths",
        Array.isArray(
          optimizationImage.strengths
        )
          ? optimizationImage.strengths.join(
              " "
            )
          : optimizationImage.strengths,
        y
      );
    }

    if (
      optimizationImage.suggestions
    ) {
      y = addSafeRow(
        doc,
        pageNumber,
        "Suggestions",
        Array.isArray(
          optimizationImage.suggestions
        )
          ? optimizationImage.suggestions.join(
              " "
            )
          : optimizationImage.suggestions,
        y
      );
    }

    y += 5;
  }

  // ==========================================================
  // ACCOUNT ANALYSIS
  // ==========================================================

  const accountAnalysis =
    optimization.account ||
    optimization.accountAnalysis ||
    apiResponse.account ||
    apiResponse.accountAnalysis ||
    {};

  if (
    Object.keys(
      accountAnalysis
    ).length > 0
  ) {
    y = checkPage(
      doc,
      y,
      pageNumber,
      70
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(11);

    doc.text(
      "Account Analysis",
      20,
      y
    );

    y += 7;

    doc.setFont(
      "helvetica",
      "normal"
    );

    if (
      accountAnalysis.account_type ||
      accountAnalysis.accountType
    ) {
      y = addSafeRow(
        doc,
        pageNumber,
        "Account Type",
        accountAnalysis.account_type ||
          accountAnalysis.accountType,
        y
      );
    }

    if (
      accountAnalysis.activity_level !==
        undefined ||
      accountAnalysis.activityLevel !==
        undefined
    ) {
      y = addSafeRow(
        doc,
        pageNumber,
        "Activity Level",
        accountAnalysis.activity_level ??
          accountAnalysis.activityLevel,
        y
      );
    }

    if (
      accountAnalysis.content_consistency !==
        undefined ||
      accountAnalysis.contentConsistency !==
        undefined
    ) {
      y = addSafeRow(
        doc,
        pageNumber,
        "Content Consistency",
        accountAnalysis.content_consistency ??
          accountAnalysis.contentConsistency,
        y
      );
    }

    if (
      accountAnalysis.strengths
    ) {
      y = addSafeRow(
        doc,
        pageNumber,
        "Strengths",
        Array.isArray(
          accountAnalysis.strengths
        )
          ? accountAnalysis.strengths.join(
              " "
            )
          : accountAnalysis.strengths,
        y
      );
    }

    if (
      accountAnalysis.suggestions
    ) {
      y = addSafeRow(
        doc,
        pageNumber,
        "Suggestions",
        Array.isArray(
          accountAnalysis.suggestions
        )
          ? accountAnalysis.suggestions.join(
              " "
            )
          : accountAnalysis.suggestions,
        y
      );
    }

    y += 5;
  }

  // ==========================================================
  // GENERAL OPTIMIZATION RECOMMENDATIONS
  // ==========================================================

  const recommendations =
    optimization.recommendations ||
    apiResponse.recommendations ||
    [];

  const strengths =
    optimization.strengths ||
    apiResponse.strengths ||
    [];

  if (
    getArray(
      recommendations
    ).length > 0
  ) {
    y = checkPage(
      doc,
      y,
      pageNumber,
      50
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(11);

    doc.text(
      "Optimization Recommendations",
      20,
      y
    );

    y += 7;

    doc.setFont(
      "helvetica",
      "normal"
    );

    getArray(
      recommendations
    ).forEach(
      (recommendation) => {
        y = checkPage(
          doc,
          y,
          pageNumber,
          15
        );

        const text =
          typeof recommendation ===
          "string"
            ? recommendation
            : recommendation?.text ||
              recommendation?.message ||
              JSON.stringify(
                recommendation
              );

        const lines =
          doc.splitTextToSize(
            `• ${text}`,
            165
          );

        doc.text(
          lines,
          22,
          y
        );

        y +=
          lines.length *
            5 +
          2;
      }
    );

    y += 3;
  }

  // ==========================================================
  // OPTIMIZATION STRENGTHS
  // ==========================================================

  if (
    getArray(
      strengths
    ).length > 0
  ) {
    y = checkPage(
      doc,
      y,
      pageNumber,
      50
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(11);

    doc.text(
      "Optimization Strengths",
      20,
      y
    );

    y += 7;

    doc.setFont(
      "helvetica",
      "normal"
    );

    getArray(
      strengths
    ).forEach(
      (strength) => {
        y = checkPage(
          doc,
          y,
          pageNumber,
          15
        );

        const text =
          typeof strength ===
          "string"
            ? strength
            : strength?.text ||
              strength?.message ||
              JSON.stringify(
                strength
              );

        const lines =
          doc.splitTextToSize(
            `• ${text}`,
            165
          );

        doc.text(
          lines,
          22,
          y
        );

        y +=
          lines.length *
            5 +
          2;
      }
    );

    y += 3;
  }

  // ==========================================================
  // AI MODEL INFORMATION
  // ==========================================================

  y = checkPage(
    doc,
    y,
    pageNumber,
    70
  );

  y = addSectionTitle(
    doc,
    "AI Model Information",
    y
  );

  const modelRows = [
    [
      "Model",
      modelName,
    ],
    [
      "Feature Count",
      featureCount,
    ],
    [
      "Hold-out Accuracy",
      "91.14%",
    ],
    [
      "Hold-out Weighted F1",
      "91.1778%",
    ],
    [
      "Mean CV Accuracy",
      "90.8010%",
    ],
    [
      "Mean CV Weighted F1",
      "90.8344%",
    ],
    [
      "Prediction ID",
      prediction.id ||
        "N/A",
    ],
  ];

  for (
    const [
      label,
      value,
    ] of modelRows
  ) {
    y = addSafeRow(
      doc,
      pageNumber,
      label,
      value,
      y
    );
  }

  y += 8;

  // ==========================================================
  // SUMMARY
  // ==========================================================

  y = checkPage(
    doc,
    y,
    pageNumber,
    55
  );

  y = addSectionTitle(
    doc,
    "Summary",
    y
  );

  let summaryText =
    `The AI system predicted a ${safeText(
      predictionResult
    )} engagement level for the submitted Instagram content with a confidence of ${formatPercentage(
      confidence
    )}.`;

  if (
    optimizationScore !==
    null
  ) {
    summaryText +=
      ` The content optimization score was ${optimizationScore.toFixed(
        1
      )}/100, classified as ${optimizationStatus}.`;
  }

  summaryText +=
    " The report contains the submitted Instagram content, prediction results, image analysis, content optimization analysis, and AI model information.";

  y = addWrappedText(
    doc,
    summaryText,
    20,
    y,
    170,
    6
  );

  // ==========================================================
  // FINAL FOOTER
  // ==========================================================

  addFooter(
    doc,
    pageNumber.value
  );

  // ==========================================================
  // FILE NAME
  // ==========================================================

  const safePrediction =
    String(
      predictionResult
    )
      .replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )
      .toLowerCase();

  const fileName =
    `instagram_prediction_${safePrediction}_${Date.now()}.pdf`;

  // ==========================================================
  // DOWNLOAD PDF
  // ==========================================================

  doc.save(
    fileName
  );

  return fileName;
}