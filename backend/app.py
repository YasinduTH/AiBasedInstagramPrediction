# ============================================================
# AI-BASED INSTAGRAM ENGAGEMENT PREDICTION SYSTEM
# PRODUCTION FLASK API
# STAGE 9E
# ============================================================

import json
import os
import sys
import tempfile
from pathlib import Path

import joblib
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS


# ============================================================
# PROJECT PATHS
# ============================================================

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent

MODELS_DIR = PROJECT_ROOT / "models"

MODEL_FILE = (
    MODELS_DIR /
    "final_instagram_engagement_model.joblib"
)

FEATURE_FILE = (
    MODELS_DIR /
    "final_model_features.json"
)

METADATA_FILE = (
    MODELS_DIR /
    "final_model_metadata.json"
)


# ============================================================
# FLASK APPLICATION
# ============================================================

app = Flask(__name__)

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": "*"
        }
    }
)

app.config["MAX_CONTENT_LENGTH"] = (
    10 * 1024 * 1024
)


# ============================================================
# GLOBAL PRODUCTION COMPONENTS
# ============================================================

MODEL = None
FEATURE_SCHEMA = None
METADATA = None
FEATURE_MAPPER = None


# ============================================================
# LOAD FEATURE MAPPER
# ============================================================

print("=" * 70)
print("AI INSTAGRAM PREDICTION API")
print("=" * 70)

print("\nLoading feature mapper...")

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

    print(error)

    raise


# ============================================================
# LOAD FEATURE SCHEMA
# ============================================================

print(
    "\nLoading feature schema..."
)

if not FEATURE_FILE.exists():

    raise FileNotFoundError(
        f"Feature schema not found:\n"
        f"{FEATURE_FILE}"
    )


with open(
    FEATURE_FILE,
    "r",
    encoding="utf-8"
) as file:

    FEATURE_SCHEMA = json.load(
        file
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


print(
    "✓ Feature schema loaded"
)


# ============================================================
# LOAD MODEL METADATA
# ============================================================

print(
    "\nLoading model metadata..."
)

if not METADATA_FILE.exists():

    raise FileNotFoundError(
        f"Metadata not found:\n"
        f"{METADATA_FILE}"
    )


with open(
    METADATA_FILE,
    "r",
    encoding="utf-8"
) as file:

    METADATA = json.load(
        file
    )


print(
    "✓ Metadata loaded"
)


# ============================================================
# LOAD PRODUCTION MODEL
# ============================================================

print(
    "\nLoading production model..."
)

if not MODEL_FILE.exists():

    raise FileNotFoundError(
        f"Production model not found:\n"
        f"{MODEL_FILE}"
    )


MODEL = joblib.load(
    MODEL_FILE
)


print(
    "✓ Production model loaded"
)


# ============================================================
# FEATURE SCHEMA VALIDATION
# ============================================================

print("\n" + "=" * 70)
print("FEATURE SCHEMA VALIDATION")
print("=" * 70)


EXPECTED_FEATURE_COUNT = 56


if len(PRODUCTION_FEATURES) != EXPECTED_FEATURE_COUNT:

    raise ValueError(
        "Production feature schema must "
        f"contain exactly {EXPECTED_FEATURE_COUNT} "
        f"features, found "
        f"{len(PRODUCTION_FEATURES)}"
    )


if len(set(PRODUCTION_FEATURES)) != len(
    PRODUCTION_FEATURES
):

    raise ValueError(
        "Duplicate production features found."
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
    f"\nTotal features: "
    f"{len(PRODUCTION_FEATURES)}"
)

print(
    f"Numeric features: "
    f"{len(NUMERIC_FEATURES)}"
)

print(
    f"Categorical features: "
    f"{len(CATEGORICAL_FEATURES)}"
)

print(
    "✓ Exactly 56 unique features"
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


def get_form_value(
    name,
    default=None
):

    value = request.form.get(
        name
    )

    if value is None:

        return default

    return value


def get_json_value(
    data,
    name,
    default=None
):

    value = data.get(
        name,
        default
    )

    return value


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


# ============================================================
# HEALTH ENDPOINT
# ============================================================

@app.route(
    "/api/health",
    methods=["GET"]
)
def health():

    return jsonify({

        "success": True,

        "status": "healthy",

        "model": (
            METADATA.get(
                "model_name",
                type(MODEL).__name__
            )
        ),

        "features": len(
            PRODUCTION_FEATURES
        )
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

        "success": True,

        "project_name": (
            METADATA.get(
                "project_name"
            )
        ),

        "dataset_name": (
            METADATA.get(
                "dataset_name"
            )
        ),

        "model_name": (
            METADATA.get(
                "model_name"
            )
        ),

        "target_column": (
            METADATA.get(
                "target_column"
            )
        ),

        "target_classes": (
            METADATA.get(
                "target_classes"
            )
        ),

        "feature_count": len(
            PRODUCTION_FEATURES
        ),

        "numeric_features": len(
            NUMERIC_FEATURES
        ),

        "categorical_features": len(
            CATEGORICAL_FEATURES
        )
    })


# ============================================================
# PREDICTION ENDPOINT
# ============================================================

@app.route(
    "/api/predict",
    methods=["POST"]
)
def predict():

    temporary_image = None

    try:

        # ----------------------------------------------------
        # DETECT REQUEST TYPE
        # ----------------------------------------------------

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


        # ----------------------------------------------------
        # CAPTION
        # ----------------------------------------------------

        caption = validate_required_text(
            data.get(
                "caption"
            ),
            "caption"
        )


        # ----------------------------------------------------
        # HASHTAGS
        # ----------------------------------------------------

        hashtags = data.get(
            "hashtags",
            ""
        )

        hashtags = str(
            hashtags
        ).strip()


        # ----------------------------------------------------
        # ACCOUNT / POST DATA
        # ----------------------------------------------------

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


        # ----------------------------------------------------
        # POST TIMING
        # ----------------------------------------------------

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


        # ----------------------------------------------------
        # CONTENT
        # ----------------------------------------------------

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


        # ----------------------------------------------------
        # IMAGE
        # ----------------------------------------------------

        image_path = None


        if (
            "image" in request.files
        ):

            uploaded_image = (
                request.files[
                    "image"
                ]
            )

            if (
                uploaded_image
                and
                uploaded_image.filename
            ):

                suffix = Path(
                    uploaded_image.filename
                ).suffix

                if not suffix:

                    suffix = ".jpg"


                temp_file = tempfile.NamedTemporaryFile(
                    delete=False,
                    suffix=suffix
                )

                uploaded_image.save(
                    temp_file.name
                )

                temp_file.close()

                temporary_image = (
                    temp_file.name
                )

                image_path = (
                    temporary_image
                )


        # ----------------------------------------------------
        # OPTIONAL JSON IMAGE PATH
        # ----------------------------------------------------

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


        # ----------------------------------------------------
        # BUILD EXACT 56 FEATURES
        # ----------------------------------------------------

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


        # ----------------------------------------------------
        # VALIDATE FEATURES
        # ----------------------------------------------------

        if features.shape != (
            1,
            56
        ):

            raise ValueError(
                "Feature mapper produced "
                f"{features.shape} instead of "
                "(1, 56)."
            )


        missing_features = [
            feature
            for feature in PRODUCTION_FEATURES
            if feature not in features.columns
        ]


        unexpected_features = [
            feature
            for feature in features.columns
            if feature not in PRODUCTION_FEATURES
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


        # ----------------------------------------------------
        # EXACT PRODUCTION ORDER
        # ----------------------------------------------------

        features = features[
            PRODUCTION_FEATURES
        ]


        if features.isna().sum().sum() > 0:

            raise ValueError(
                "Feature vector contains "
                "missing values."
            )


        # ----------------------------------------------------
        # MODEL PREDICTION
        # ----------------------------------------------------

        prediction = MODEL.predict(
            features
        )


        prediction_label = str(
            prediction[0]
        )


        # ----------------------------------------------------
        # PROBABILITIES
        # ----------------------------------------------------

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

            model_classes = (
                MODEL.classes_
            )


            for cls, probability in zip(
                model_classes,
                probability_values
            ):

                probabilities[
                    str(cls)
                ] = float(
                    probability
                )


        # ----------------------------------------------------
        # CONFIDENCE
        # ----------------------------------------------------

        confidence = None

        if probabilities:

            confidence = max(
                probabilities.values()
            )


        # ----------------------------------------------------
        # INPUT SUMMARY
        # ----------------------------------------------------

        input_summary = {

            "category": category,

            "account_type": account_type,

            "caption_length": int(
                features.iloc[0][
                    "caption_length"
                ]
            ),

            "has_image": int(
                features.iloc[0][
                    "has_image"
                ]
            ),

            "image_width": int(
                features.iloc[0][
                    "image_width"
                ]
            ),

            "image_height": int(
                features.iloc[0][
                    "image_height"
                ]
            )
        }


        # ----------------------------------------------------
        # RESPONSE
        # ----------------------------------------------------

        response = {

            "success": True,

            "prediction": (
                prediction_label
            ),

            "confidence": confidence,

            "probabilities": (
                probabilities
            ),

            "feature_count": int(
                features.shape[1]
            ),

            "input_summary": (
                input_summary
            )
        }


        return jsonify(
            response
        )


    except Exception as error:

        print(
            "\nPREDICTION ERROR:"
        )

        print(
            repr(error)
        )


        return jsonify({

            "success": False,

            "error": str(
                error
            )
        }), 400


    finally:

        # ----------------------------------------------------
        # REMOVE TEMPORARY IMAGE
        # ----------------------------------------------------

        if temporary_image:

            try:

                os.remove(
                    temporary_image
                )

            except Exception:

                pass


# ============================================================
# APPLICATION START
# ============================================================

if __name__ == "__main__":

    print("\n" + "=" * 70)
    print("PRODUCTION SERVICE READY")
    print("=" * 70)

    print(
        "\nAI INSTAGRAM PREDICTION API"
    )

    print(
        f"Model: "
        f"{type(MODEL).__name__}"
    )

    print(
        f"Features: "
        f"{len(PRODUCTION_FEATURES)}"
    )

    print(
        "API: http://127.0.0.1:5000"
    )

    print(
        "\nEndpoints:"
    )

    print(
        "GET  /api/health"
    )

    print(
        "GET  /api/model-info"
    )

    print(
        "POST /api/predict"
    )

    print("=" * 70)

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )