# ============================================================
# AI-BASED INSTAGRAM ENGAGEMENT PREDICTION SYSTEM
# PRODUCTION FLASK API
#
# FINAL MODEL INTEGRATION
# ------------------------------------------------------------
# Model:
#   Tuned HistGradient Boosting
#
# Production features:
#   56 features
#
# Image storage:
#   Local backend/uploads/
#
# Firebase:
#   Firebase Admin SDK
#
# Additional services:
#   Content Optimization
#   Admin API
# ============================================================

import json
import os
import sys
import uuid
from pathlib import Path

import joblib
import pandas as pd

from flask import (
    Flask,
    jsonify,
    request,
    send_from_directory
)

from flask_cors import CORS
from werkzeug.utils import secure_filename


# ============================================================
# FIREBASE ADMIN SDK
# ============================================================

import firebase_admin
from firebase_admin import credentials


# ============================================================
# PROJECT PATHS
# ============================================================

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent

MODELS_DIR = PROJECT_ROOT / "models"


# ============================================================
# FIREBASE ADMIN INITIALIZATION
# ============================================================

FIREBASE_ADMIN_KEY = (
    BACKEND_DIR /
    "firebase-admin-key.json"
)


if not firebase_admin._apps:

    if not FIREBASE_ADMIN_KEY.exists():

        raise FileNotFoundError(
            "Firebase Admin service account file "
            "was not found:\n"
            f"{FIREBASE_ADMIN_KEY}\n\n"
            "Please place firebase-admin-key.json "
            "inside the backend folder."
        )

    firebase_credential = credentials.Certificate(
        str(FIREBASE_ADMIN_KEY)
    )

    firebase_admin.initialize_app(
        firebase_credential
    )

    print(
        "✓ Firebase Admin SDK initialized"
    )

else:

    print(
        "✓ Firebase Admin SDK already initialized"
    )


# ============================================================
# CONTENT OPTIMIZATION ENGINE
# ============================================================

from services.content_optimizer import (
    generate_content_optimization
)


# ============================================================
# ADMIN ROUTES
# ============================================================

from routes.admin_routes import (
    admin_bp
)


# ============================================================
# PRODUCTION MODEL FILES
# ============================================================

# NEW FINAL MODEL
MODEL_FILE = (
    MODELS_DIR /
    "instagram_engagement_model.joblib"
)


# Flask-compatible feature schema
FEATURE_FILE = (
    MODELS_DIR /
    "final_model_features.json"
)


# Flask-compatible model metadata
METADATA_FILE = (
    MODELS_DIR /
    "final_model_metadata.json"
)


# Backup schema created by model-selection notebook
JOBLIB_FEATURE_FILE = (
    MODELS_DIR /
    "feature_schema.joblib"
)


# ============================================================
# IMAGE STORAGE CONFIGURATION
# ============================================================

UPLOAD_FOLDER = (
    BACKEND_DIR /
    "uploads"
)


UPLOAD_FOLDER.mkdir(
    parents=True,
    exist_ok=True
)


ALLOWED_IMAGE_EXTENSIONS = {
    "jpg",
    "jpeg",
    "png",
    "webp"
}


MAX_IMAGE_SIZE_MB = 10


# ============================================================
# FLASK APPLICATION
# ============================================================

app = Flask(__name__)


CORS(
    app,
    resources={
        r"/*": {
            "origins": "*"
        }
    }
)


app.config["MAX_CONTENT_LENGTH"] = (
    MAX_IMAGE_SIZE_MB * 1024 * 1024
)


# ============================================================
# REGISTER ADMIN BLUEPRINT
# ============================================================

app.register_blueprint(
    admin_bp
)


# ============================================================
# GLOBAL PRODUCTION COMPONENTS
# ============================================================

MODEL = None

FEATURE_SCHEMA = None

METADATA = None

FEATURE_MAPPER = None

PRODUCTION_FEATURES = []

CATEGORICAL_FEATURES = []

NUMERIC_FEATURES = []


# ============================================================
# APPLICATION STARTUP
# ============================================================

print()
print("=" * 70)
print("AI INSTAGRAM ENGAGEMENT PREDICTION API")
print("=" * 70)


# ============================================================
# LOAD FEATURE MAPPER
# ============================================================

print()
print("Loading feature mapper...")


try:

    if str(BACKEND_DIR) not in sys.path:

        sys.path.insert(
            0,
            str(BACKEND_DIR)
        )


    from feature_mapper import (
        build_56_feature_vector
    )


    FEATURE_MAPPER = (
        build_56_feature_vector
    )


    print(
        "✓ Feature mapper loaded"
    )


except Exception as error:

    print(
        "✗ Feature mapper loading failed"
    )

    print(
        repr(error)
    )

    raise


# ============================================================
# LOAD FEATURE SCHEMA
# ============================================================

print()
print("Loading feature schema...")


# ------------------------------------------------------------
# PRIMARY: JSON FEATURE SCHEMA
# ------------------------------------------------------------

if FEATURE_FILE.exists():

    with open(
        FEATURE_FILE,
        "r",
        encoding="utf-8"
    ) as file:

        FEATURE_SCHEMA = json.load(
            file
        )

    print(
        "✓ JSON feature schema loaded"
    )


# ------------------------------------------------------------
# FALLBACK: JOBLIB FEATURE SCHEMA
# ------------------------------------------------------------

elif JOBLIB_FEATURE_FILE.exists():

    FEATURE_SCHEMA = joblib.load(
        JOBLIB_FEATURE_FILE
    )

    print(
        "✓ Joblib feature schema loaded"
    )


else:

    raise FileNotFoundError(
        "No production feature schema found.\n\n"
        f"Expected either:\n"
        f"  {FEATURE_FILE}\n"
        f"or:\n"
        f"  {JOBLIB_FEATURE_FILE}"
    )


# ============================================================
# EXTRACT FEATURE LIST
# ============================================================

PRODUCTION_FEATURES = (
    FEATURE_SCHEMA.get(
        "all_features",
        []
    )
)


# ------------------------------------------------------------
# FALLBACK IF all_features DOES NOT EXIST
# ------------------------------------------------------------

if not PRODUCTION_FEATURES:

    PRODUCTION_FEATURES = (
        FEATURE_SCHEMA.get(
            "expected_features",
            []
        )
    )


# ------------------------------------------------------------
# SECOND FALLBACK
# ------------------------------------------------------------

if not PRODUCTION_FEATURES:

    PRODUCTION_FEATURES = (
        FEATURE_SCHEMA.get(
            "categorical_features",
            []
        )
        +
        FEATURE_SCHEMA.get(
            "numeric_features",
            []
        )
    )


# ------------------------------------------------------------
# VALIDATE FEATURE SCHEMA
# ------------------------------------------------------------

if not PRODUCTION_FEATURES:

    raise ValueError(
        "Production feature schema is empty."
    )


CATEGORICAL_FEATURES = (
    FEATURE_SCHEMA.get(
        "categorical_features",
        []
    )
)


NUMERIC_FEATURES = (
    FEATURE_SCHEMA.get(
        "numeric_features",
        []
    )
)


print(
    f"✓ Production features loaded: "
    f"{len(PRODUCTION_FEATURES)}"
)


# ============================================================
# FEATURE SCHEMA VALIDATION
# ============================================================

print()
print("=" * 70)
print("FEATURE SCHEMA VALIDATION")
print("=" * 70)


EXPECTED_FEATURE_COUNT = 56


if len(PRODUCTION_FEATURES) != (
    EXPECTED_FEATURE_COUNT
):

    raise ValueError(
        "Production feature schema must "
        f"contain exactly "
        f"{EXPECTED_FEATURE_COUNT} "
        f"features, found "
        f"{len(PRODUCTION_FEATURES)}"
    )


if len(set(PRODUCTION_FEATURES)) != (
    len(PRODUCTION_FEATURES)
):

    raise ValueError(
        "Duplicate production features found."
    )


print(
    f"Total features      : "
    f"{len(PRODUCTION_FEATURES)}"
)


print(
    f"Numeric features    : "
    f"{len(NUMERIC_FEATURES)}"
)


print(
    f"Categorical features: "
    f"{len(CATEGORICAL_FEATURES)}"
)


print(
    "✓ Exactly 56 unique production features"
)


# ============================================================
# LOAD MODEL METADATA
# ============================================================

print()
print("Loading model metadata...")


if METADATA_FILE.exists():

    with open(
        METADATA_FILE,
        "r",
        encoding="utf-8"
    ) as file:

        METADATA = json.load(
            file
        )

    print(
        "✓ Model metadata loaded"
    )


else:

    # --------------------------------------------------------
    # FALLBACK METADATA
    # --------------------------------------------------------

    METADATA = {

        "project_name":
            "AI-Based Instagram Engagement Prediction System",

        "model_name":
            "Tuned HistGradient Boosting",

        "model_type":
            "HistGradientBoostingClassifier",

        "target_column":
            "performance_class",

        "target_classes":
            [
                "High",
                "Low",
                "Medium"
            ],

        "feature_count":
            56
    }


    print(
        "⚠ Metadata JSON not found."
    )

    print(
        "✓ Default model metadata created."
    )


# ============================================================
# LOAD FINAL PRODUCTION MODEL
# ============================================================

print()
print("Loading final production model...")


if not MODEL_FILE.exists():

    raise FileNotFoundError(
        "Final production model not found:\n"
        f"{MODEL_FILE}\n\n"
        "Make sure the model-selection notebook "
        "saved instagram_engagement_model.joblib "
        "inside the models folder."
    )


MODEL = joblib.load(
    MODEL_FILE
)


print(
    "✓ Final production model loaded"
)


print(
    f"  Model type: "
    f"{type(MODEL).__name__}"
)


# ============================================================
# MODEL VALIDATION
# ============================================================

print()
print("=" * 70)
print("MODEL VALIDATION")
print("=" * 70)


if not hasattr(
    MODEL,
    "predict"
):

    raise TypeError(
        "Loaded model does not provide "
        "a predict() method."
    )


print(
    "✓ Model provides predict()"
)


if hasattr(
    MODEL,
    "predict_proba"
):

    print(
        "✓ Model provides predict_proba()"
    )

else:

    print(
        "⚠ Model does not provide predict_proba()"
    )


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def safe_int(
    value,
    default=0
):

    try:

        return int(
            float(value)
        )

    except (
        TypeError,
        ValueError
    ):

        return default


def safe_float(
    value,
    default=0.0
):

    try:

        return float(value)

    except (
        TypeError,
        ValueError
    ):

        return default


def safe_bool(
    value,
    default=False
):

    if value is None:

        return default


    if isinstance(
        value,
        bool
    ):

        return value


    value = str(
        value
    ).strip().lower()


    return value in {
        "true",
        "1",
        "yes",
        "on"
    }


def validate_required_text(
    value,
    field_name
):

    if value is None:

        raise ValueError(
            f"{field_name} is required."
        )


    value = str(
        value
    ).strip()


    if not value:

        raise ValueError(
            f"{field_name} cannot be empty."
        )


    return value


def allowed_image(
    filename
):

    if not filename:

        return False


    if "." not in filename:

        return False


    extension = (
        filename
        .rsplit(".", 1)[1]
        .lower()
    )


    return extension in (
        ALLOWED_IMAGE_EXTENSIONS
    )


def generate_unique_image_name(
    original_filename
):

    safe_name = secure_filename(
        original_filename
    )


    extension = Path(
        safe_name
    ).suffix.lower()


    if not extension:

        extension = ".jpg"


    unique_name = (
        f"{uuid.uuid4().hex}"
        f"{extension}"
    )


    return unique_name


# ============================================================
# IMAGE STORAGE
# ============================================================

def save_uploaded_image():

    """
    Save uploaded image permanently inside:

        backend/uploads/

    Returns image metadata.

    Returns None if no image was uploaded.
    """

    if "image" not in request.files:

        return None


    uploaded_image = (
        request.files["image"]
    )


    if (
        uploaded_image is None
        or
        not uploaded_image.filename
    ):

        return None


    original_filename = (
        uploaded_image.filename
    )


    # --------------------------------------------------------
    # VALIDATE IMAGE FORMAT
    # --------------------------------------------------------

    if not allowed_image(
        original_filename
    ):

        raise ValueError(
            "Unsupported image format. "
            "Allowed formats: JPG, JPEG, PNG, WEBP."
        )


    # --------------------------------------------------------
    # GENERATE SAFE UNIQUE NAME
    # --------------------------------------------------------

    saved_filename = (
        generate_unique_image_name(
            original_filename
        )
    )


    # --------------------------------------------------------
    # FINAL IMAGE PATH
    # --------------------------------------------------------

    image_path = (
        UPLOAD_FOLDER /
        saved_filename
    )


    # --------------------------------------------------------
    # SAVE IMAGE
    # --------------------------------------------------------

    uploaded_image.save(
        str(image_path)
    )


    # --------------------------------------------------------
    # VERIFY FILE
    # --------------------------------------------------------

    if not image_path.exists():

        raise RuntimeError(
            "Image could not be saved."
        )


    file_size = (
        image_path.stat().st_size
    )


    # --------------------------------------------------------
    # IMAGE URL
    # --------------------------------------------------------

    image_url = (
        f"/uploads/{saved_filename}"
    )


    print()
    print("✓ Image saved")
    print(
        f"  Original: {original_filename}"
    )
    print(
        f"  Saved:    {saved_filename}"
    )
    print(
        f"  Size:     {file_size} bytes"
    )


    return {

        "original_file_name":
            original_filename,

        "saved_file_name":
            saved_filename,

        "file_type":
            uploaded_image.mimetype
            or "image/jpeg",

        "file_size":
            file_size,

        "image_path":
            str(image_path),

        "image_url":
            image_url
    }


# ============================================================
# SERVE STORED IMAGES
# ============================================================

@app.route(
    "/uploads/<filename>",
    methods=["GET"]
)
def uploaded_file(
    filename
):

    return send_from_directory(
        str(UPLOAD_FOLDER),
        filename
    )


# ============================================================
# HEALTH ENDPOINT
# ============================================================

@app.route(
    "/api/health",
    methods=["GET"]
)
def health():

    return jsonify({

        "success":
            True,

        "status":
            "healthy",

        "model":
            METADATA.get(
                "model_name",
                type(MODEL).__name__
            ),

        "model_type":
            type(MODEL).__name__,

        "features":
            len(
                PRODUCTION_FEATURES
            ),

        "image_storage":
            "local_backend_uploads",

        "content_optimization":
            "enabled",

        "admin_api":
            "enabled"
    })


# ============================================================
# MODEL INFORMATION
# ============================================================

@app.route(
    "/api/model-info",
    methods=["GET"]
)
def model_info():

    return jsonify({

        "success":
            True,

        "project_name":
            METADATA.get(
                "project_name"
            ),

        "dataset_name":
            METADATA.get(
                "dataset_name"
            ),

        "model_name":
            METADATA.get(
                "model_name",
                type(MODEL).__name__
            ),

        "model_type":
            METADATA.get(
                "model_type",
                type(MODEL).__name__
            ),

        "target_column":
            METADATA.get(
                "target_column",
                "performance_class"
            ),

        "target_classes":
            METADATA.get(
                "target_classes",
                [
                    "High",
                    "Low",
                    "Medium"
                ]
            ),

        "feature_count":
            len(
                PRODUCTION_FEATURES
            ),

        "numeric_features":
            len(
                NUMERIC_FEATURES
            ),

        "categorical_features":
            len(
                CATEGORICAL_FEATURES
            ),

        "image_storage":
            "local_backend_uploads",

        "content_optimization":
            "enabled"
    })


# ============================================================
# PREDICTION ENDPOINT
# ============================================================

@app.route(
    "/api/predict",
    methods=["POST"]
)
def predict():

    saved_image = None

    try:

        # ====================================================
        # 1. DETECT REQUEST TYPE
        # ====================================================

        if request.is_json:

            data = (
                request.get_json()
                or {}
            )

        else:

            data = {}

            for key in request.form:

                data[key] = (
                    request.form.get(
                        key
                    )
                )


        # ====================================================
        # 2. CAPTION
        # ====================================================

        caption = (
            validate_required_text(
                data.get(
                    "caption"
                ),
                "caption"
            )
        )


        # ====================================================
        # 3. HASHTAGS
        # ====================================================

        hashtags = data.get(
            "hashtags",
            ""
        )


        hashtags = str(
            hashtags
        ).strip()


        # ====================================================
        # 4. ACCOUNT / POST DATA
        # ====================================================

        category = data.get(
            "category",
            "Other"
        )


        account_type = data.get(
            "account_type",
            "Creator"
        )


        follower_count = safe_int(
            data.get(
                "follower_count"
            ),
            0
        )


        following_count = safe_int(
            data.get(
                "following_count"
            ),
            0
        )


        account_age_days = safe_int(
            data.get(
                "account_age_days"
            ),
            365
        )


        verified_status = int(
            safe_bool(
                data.get(
                    "verified_status"
                ),
                False
            )
        )


        posting_frequency = safe_float(
            data.get(
                "posting_frequency"
            ),
            1.0
        )


        average_historical_engagement = (
            safe_float(
                data.get(
                    "average_historical_engagement"
                ),
                0.05
            )
        )


        audience_growth_rate = safe_float(
            data.get(
                "audience_growth_rate"
            ),
            0.0
        )


        account_activity_level = safe_float(
            data.get(
                "account_activity_level"
            ),
            0.5
        )


        content_consistency = safe_float(
            data.get(
                "content_consistency"
            ),
            0.5
        )


        # ====================================================
        # 5. POST TIMING
        # ====================================================

        posting_hour = safe_int(
            data.get(
                "posting_hour"
            ),
            12
        )


        day_of_week = data.get(
            "day_of_week",
            "Monday"
        )


        posting_time_period = data.get(
            "posting_time_period",
            "Afternoon"
        )


        # ====================================================
        # 6. CONTENT
        # ====================================================

        media_type = data.get(
            "media_type",
            "Image"
        )


        has_location = int(
            safe_bool(
                data.get(
                    "has_location"
                ),
                False
            )
        )


        sponsored = int(
            safe_bool(
                data.get(
                    "sponsored"
                ),
                False
            )
        )


        content_originality = safe_float(
            data.get(
                "content_originality"
            ),
            0.5
        )


        content_quality_score = safe_float(
            data.get(
                "content_quality_score"
            ),
            0.5
        )


        creator_activity_score = safe_float(
            data.get(
                "creator_activity_score"
            ),
            0.5
        )


        # ====================================================
        # 7. SAVE IMAGE
        # ====================================================

        saved_image = (
            save_uploaded_image()
        )


        # ====================================================
        # 8. IMAGE PATH FOR MODEL
        # ====================================================

        image_path = None


        if saved_image:

            image_path = (
                saved_image[
                    "image_path"
                ]
            )


        # ====================================================
        # 9. OPTIONAL JSON IMAGE PATH
        # ====================================================

        if (
            image_path is None
            and
            data.get(
                "image_path"
            )
        ):

            supplied_path = Path(
                str(
                    data.get(
                        "image_path"
                    )
                )
            ).resolve()


            if supplied_path.exists():

                image_path = str(
                    supplied_path
                )


        # ====================================================
        # 10. BUILD EXACT 56 FEATURES
        # ====================================================

        features = FEATURE_MAPPER(

            caption=caption,

            hashtags=hashtags,

            category=category,

            account_type=account_type,

            follower_count=follower_count,

            following_count=following_count,

            account_age_days=account_age_days,

            verified_status=verified_status,

            posting_frequency=posting_frequency,

            average_historical_engagement=(
                average_historical_engagement
            ),

            audience_growth_rate=(
                audience_growth_rate
            ),

            account_activity_level=(
                account_activity_level
            ),

            content_consistency=(
                content_consistency
            ),

            posting_hour=posting_hour,

            day_of_week=day_of_week,

            posting_time_period=(
                posting_time_period
            ),

            media_type=media_type,

            has_location=has_location,

            sponsored=sponsored,

            content_originality=(
                content_originality
            ),

            content_quality_score=(
                content_quality_score
            ),

            creator_activity_score=(
                creator_activity_score
            ),

            image_path=image_path
        )


        # ====================================================
        # 11. VALIDATE FEATURE SHAPE
        # ====================================================

        if features.shape != (
            1,
            56
        ):

            raise ValueError(
                "Feature mapper produced "
                f"{features.shape} instead of "
                "(1, 56)."
            )


        # ====================================================
        # 12. CHECK MISSING FEATURES
        # ====================================================

        missing_features = [

            feature

            for feature
            in PRODUCTION_FEATURES

            if feature
            not in features.columns

        ]


        # ====================================================
        # 13. CHECK UNEXPECTED FEATURES
        # ====================================================

        unexpected_features = [

            feature

            for feature
            in features.columns

            if feature
            not in PRODUCTION_FEATURES

        ]


        if missing_features:

            raise ValueError(
                "Missing production features: "
                +
                ", ".join(
                    missing_features
                )
            )


        if unexpected_features:

            raise ValueError(
                "Unexpected production features: "
                +
                ", ".join(
                    unexpected_features
                )
            )


        # ====================================================
        # 14. EXACT PRODUCTION FEATURE ORDER
        # ====================================================

        features = features[
            PRODUCTION_FEATURES
        ]


        # ====================================================
        # 15. CHECK MISSING VALUES
        # ====================================================

        if features.isna().sum().sum() > 0:

            missing_value_columns = (
                features.columns[
                    features.isna().any()
                ].tolist()
            )


            raise ValueError(
                "Feature vector contains "
                "missing values in: "
                +
                ", ".join(
                    missing_value_columns
                )
            )


        # ====================================================
        # 16. MODEL PREDICTION
        # ====================================================

        prediction = MODEL.predict(
            features
        )


        prediction_label = str(
            prediction[0]
        )


        # ====================================================
        # 17. PREDICTION PROBABILITIES
        # ====================================================

        probabilities = {}


        if hasattr(
            MODEL,
            "predict_proba"
        ):

            probability_values = (
                MODEL.predict_proba(
                    features
                )[0]
            )


            if hasattr(
                MODEL,
                "classes_"
            ):

                model_classes = (
                    MODEL.classes_
                )

            else:

                model_classes = [
                    "High",
                    "Low",
                    "Medium"
                ]


            for cls, probability in zip(
                model_classes,
                probability_values
            ):

                probabilities[
                    str(cls)
                ] = float(
                    probability
                )


        # ====================================================
        # 18. CONFIDENCE
        # ====================================================

        confidence = None


        if probabilities:

            confidence = max(
                probabilities.values()
            )


        # ====================================================
        # 19. INPUT SUMMARY
        # ====================================================

        input_summary = {

            "category":
                category,

            "account_type":
                account_type,

            "caption_length":
                int(
                    features.iloc[0][
                        "caption_length"
                    ]
                ),

            "has_image":
                int(
                    features.iloc[0][
                        "has_image"
                    ]
                ),

            "image_width":
                int(
                    features.iloc[0][
                        "image_width"
                    ]
                ),

            "image_height":
                int(
                    features.iloc[0][
                        "image_height"
                    ]
                )
        }


        # ====================================================
        # 20. IMAGE RESPONSE
        # ====================================================

        image_response = {

            "uploaded":
                False,

            "original_file_name":
                None,

            "saved_file_name":
                None,

            "file_type":
                None,

            "file_size":
                None,

            "image_url":
                None,

            "image_width":
                input_summary[
                    "image_width"
                ],

            "image_height":
                input_summary[
                    "image_height"
                ]
        }


        if saved_image:

            image_response.update({

                "uploaded":
                    True,

                "original_file_name":
                    saved_image[
                        "original_file_name"
                    ],

                "saved_file_name":
                    saved_image[
                        "saved_file_name"
                    ],

                "file_type":
                    saved_image[
                        "file_type"
                    ],

                "file_size":
                    saved_image[
                        "file_size"
                    ],

                "image_url":
                    saved_image[
                        "image_url"
                    ]
            })


        # ====================================================
        # 21. IMAGE ANALYSIS DATA
        # ====================================================

        def get_feature_value(
            possible_names,
            default=None
        ):

            for name in possible_names:

                if name in features.columns:

                    value = features.iloc[0][
                        name
                    ]


                    try:

                        if pd.isna(value):

                            return default

                    except Exception:

                        pass


                    return value


            return default


        image_brightness = (
            get_feature_value(
                [
                    "image_brightness",
                    "brightness",
                    "avg_brightness",
                    "image_avg_brightness"
                ],
                None
            )
        )


        image_contrast = (
            get_feature_value(
                [
                    "image_contrast",
                    "contrast",
                    "image_avg_contrast"
                ],
                None
            )
        )


        image_sharpness = (
            get_feature_value(
                [
                    "image_sharpness",
                    "sharpness",
                    "image_avg_sharpness"
                ],
                None
            )
        )


        # ====================================================
        # 22. CONTENT OPTIMIZATION
        # ====================================================

        optimization = (
            generate_content_optimization(

                caption=caption,

                hashtags=hashtags,

                category=category,

                account_type=account_type,

                account_activity_level=(
                    account_activity_level
                ),

                content_consistency=(
                    content_consistency
                ),

                prediction=prediction_label,

                confidence=confidence,

                image_analysis={

                    **image_response,

                    "brightness":
                        image_brightness,

                    "contrast":
                        image_contrast,

                    "sharpness":
                        image_sharpness
                }
            )
        )


        # ====================================================
        # 23. FINAL RESPONSE
        # ====================================================

        response = {

            "success":
                True,

            "prediction":
                prediction_label,

            "confidence":
                confidence,

            "probabilities":
                probabilities,

            "feature_count":
                int(
                    features.shape[1]
                ),

            "input_summary":
                input_summary,

            "image":
                image_response,

            "optimization":
                optimization
        }


        # ====================================================
        # 24. LOG RESULT
        # ====================================================

        print()
        print("✓ Prediction completed")

        print(
            f"  Prediction: "
            f"{prediction_label}"
        )


        if confidence is not None:

            print(
                f"  Confidence: "
                f"{confidence * 100:.2f}%"
            )


        print(
            f"  Features: "
            f"{features.shape[1]}"
        )


        print(
            f"  Optimization score: "
            f"{optimization.get('optimization_score')}"
        )


        if saved_image:

            print(
                "  Image: "
                f"{saved_image['saved_file_name']}"
            )

        else:

            print(
                "  Image: Not uploaded"
            )


        return jsonify(
            response
        )


    except Exception as error:

        # ====================================================
        # CLEANUP FAILED IMAGE
        # ====================================================

        if saved_image:

            try:

                failed_image = Path(
                    saved_image[
                        "image_path"
                    ]
                )


                if failed_image.exists():

                    failed_image.unlink()


                    print(
                        "✓ Failed prediction "
                        "image removed."
                    )


            except Exception as cleanup_error:

                print(
                    "Image cleanup failed:"
                )

                print(
                    repr(
                        cleanup_error
                    )
                )


        print()
        print(
            "PREDICTION ERROR:"
        )


        print(
            repr(error)
        )


        return jsonify({

            "success":
                False,

            "error":
                str(error)

        }), 400


# ============================================================
# MAXIMUM REQUEST SIZE ERROR
# ============================================================

@app.errorhandler(
    413
)
def request_entity_too_large(
    error
):

    return jsonify({

        "success":
            False,

        "error":
            "Image is too large. "
            f"Maximum allowed size is "
            f"{MAX_IMAGE_SIZE_MB} MB."

    }), 413


# ============================================================
# APPLICATION START
# ============================================================

if __name__ == "__main__":

    print()
    print("=" * 70)
    print("PRODUCTION SERVICE READY")
    print("=" * 70)

    print()
    print(
        "AI INSTAGRAM PREDICTION API"
    )

    print(
        f"Model: "
        f"{METADATA.get('model_name', type(MODEL).__name__)}"
    )

    print(
        f"Model Type: "
        f"{type(MODEL).__name__}"
    )

    print(
        f"Features: "
        f"{len(PRODUCTION_FEATURES)}"
    )

    print(
        "API: "
        "http://127.0.0.1:5000"
    )

    print(
        "Image storage: "
        f"{UPLOAD_FOLDER}"
    )

    print(
        "Content optimization: ENABLED"
    )

    print(
        "Admin API: ENABLED"
    )

    print()
    print("Endpoints:")

    print(
        "GET  /api/health"
    )

    print(
        "GET  /api/model-info"
    )

    print(
        "POST /api/predict"
    )

    print(
        "GET  /uploads/<filename>"
    )

    print()
    print("ADMIN ENDPOINTS:")

    print(
        "GET    /api/admin/health"
    )

    print(
        "GET    /api/admin/users"
    )

    print(
        "GET    /api/admin/users/<uid>"
    )

    print(
        "DELETE /api/admin/users/<uid>"
    )

    print()
    print("=" * 70)


    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )