# ============================================================
# AI-BASED INSTAGRAM ENGAGEMENT PREDICTION SYSTEM
# PRODUCTION PREDICTION SERVICE
# ============================================================

import json
from pathlib import Path

import joblib
import pandas as pd


class PredictionService:
    """
    Production service responsible for:

    1. Loading the trained production model
    2. Loading the production feature schema
    3. Loading model metadata
    4. Building the complete 56-feature vector
    5. Validating feature names and data types
    6. Running the final prediction
    7. Returning class probabilities and confidence
    """

    # ========================================================
    # INITIALIZATION
    # ========================================================

    def __init__(
        self,
        model_path: Path,
        feature_schema_path: Path,
        metadata_path: Path
    ):

        self.model_path = Path(model_path)
        self.feature_schema_path = Path(
            feature_schema_path
        )
        self.metadata_path = Path(
            metadata_path
        )

        self.model = None
        self.feature_schema = None
        self.metadata = None

        self.numeric_features = []
        self.categorical_features = []
        self.all_features = []

        self._load()

    # ========================================================
    # LOAD PRODUCTION COMPONENTS
    # ========================================================

    def _load(self):

        print("=" * 70)
        print("PRODUCTION PREDICTION SERVICE")
        print("=" * 70)

        print("\nModel:")
        print(self.model_path)

        print("\nFeature schema:")
        print(self.feature_schema_path)

        print("\nMetadata:")
        print(self.metadata_path)

        # ----------------------------------------------------
        # Validate files
        # ----------------------------------------------------

        if not self.model_path.exists():

            raise FileNotFoundError(
                f"Production model not found:\n"
                f"{self.model_path}"
            )

        if not self.feature_schema_path.exists():

            raise FileNotFoundError(
                f"Feature schema not found:\n"
                f"{self.feature_schema_path}"
            )

        if not self.metadata_path.exists():

            raise FileNotFoundError(
                f"Model metadata not found:\n"
                f"{self.metadata_path}"
            )

        # ----------------------------------------------------
        # Load model
        # ----------------------------------------------------

        print("\nLoading trained model...")

        self.model = joblib.load(
            self.model_path
        )

        print(
            "✓ Model loaded:",
            type(self.model).__name__
        )

        # ----------------------------------------------------
        # Load feature schema
        # ----------------------------------------------------

        print("\nLoading feature schema...")

        with open(
            self.feature_schema_path,
            "r",
            encoding="utf-8"
        ) as file:

            self.feature_schema = json.load(
                file
            )

        print("✓ Feature schema loaded")

        # ----------------------------------------------------
        # Load metadata
        # ----------------------------------------------------

        print("\nLoading model metadata...")

        with open(
            self.metadata_path,
            "r",
            encoding="utf-8"
        ) as file:

            self.metadata = json.load(
                file
            )

        print("✓ Metadata loaded")

        # ----------------------------------------------------
        # Extract feature lists
        # ----------------------------------------------------

        self.numeric_features = (
            self.feature_schema.get(
                "numeric_features",
                []
            )
        )

        self.categorical_features = (
            self.feature_schema.get(
                "categorical_features",
                []
            )
        )

        self.all_features = (
            self.feature_schema.get(
                "all_features",
                []
            )
        )

        # ----------------------------------------------------
        # Fallback if all_features isn't explicitly stored
        # ----------------------------------------------------

        if not self.all_features:

            self.all_features = (
                self.categorical_features
                +
                self.numeric_features
            )

        # ----------------------------------------------------
        # Validate production schema
        # ----------------------------------------------------

        self._validate_schema()

        print("\n" + "=" * 70)
        print("PRODUCTION SERVICE READY")
        print("=" * 70)

    # ========================================================
    # SCHEMA VALIDATION
    # ========================================================

    def _validate_schema(self):

        print("\n" + "=" * 70)
        print("FEATURE SCHEMA VALIDATION")
        print("=" * 70)

        total_features = len(
            self.all_features
        )

        numeric_count = len(
            self.numeric_features
        )

        categorical_count = len(
            self.categorical_features
        )

        print(
            "\nTotal features:",
            total_features
        )

        print(
            "Numeric features:",
            numeric_count
        )

        print(
            "Categorical features:",
            categorical_count
        )

        # ----------------------------------------------------
        # Production model must use 56 features
        # ----------------------------------------------------

        if total_features != 56:

            raise ValueError(
                "Invalid production feature schema. "
                f"Expected 56 features, "
                f"found {total_features}."
            )

        # ----------------------------------------------------
        # Check duplicate features
        # ----------------------------------------------------

        duplicates = (
            pd.Series(self.all_features)
            .loc[
                pd.Series(
                    self.all_features
                ).duplicated()
            ]
            .tolist()
        )

        if duplicates:

            raise ValueError(
                "Duplicate features found:\n"
                f"{duplicates}"
            )

        # ----------------------------------------------------
        # Check overlap
        # ----------------------------------------------------

        overlap = set(
            self.numeric_features
        ).intersection(
            set(
                self.categorical_features
            )
        )

        if overlap:

            raise ValueError(
                "Features cannot be both "
                "numeric and categorical:\n"
                f"{sorted(overlap)}"
            )

        # ----------------------------------------------------
        # Check all features are classified
        # ----------------------------------------------------

        classified = set(
            self.numeric_features
            +
            self.categorical_features
        )

        unclassified = [
            feature
            for feature in self.all_features
            if feature not in classified
        ]

        if unclassified:

            raise ValueError(
                "Unclassified production features:\n"
                f"{unclassified}"
            )

        # ----------------------------------------------------
        # Validate counts
        # ----------------------------------------------------

        if (
            numeric_count
            +
            categorical_count
            != 56
        ):

            raise ValueError(
                "Numeric + categorical feature "
                "count does not equal 56."
            )

        print("\n✓ Exactly 56 unique features")
        print("✓ No feature overlap")
        print("✓ All features classified")

    # ========================================================
    # COMPLETE FEATURE VECTOR
    # ========================================================

    def complete_feature_vector(
        self,
        values: dict
    ):
        """
        Create a complete production feature dictionary.

        Any feature not explicitly supplied is initialized
        using a safe default:

        categorical -> ""
        numeric     -> 0.0

        The supplied values are then applied.

        IMPORTANT:
        This method does NOT change the model or schema.
        """

        if not isinstance(
            values,
            dict
        ):

            raise TypeError(
                "Feature values must be a dictionary."
            )

        feature_values = {}

        # ----------------------------------------------------
        # Initialize every required feature
        # ----------------------------------------------------

        for feature in self.all_features:

            if feature in self.categorical_features:

                feature_values[feature] = ""

            elif feature in self.numeric_features:

                feature_values[feature] = 0.0

            else:

                raise ValueError(
                    f"Unknown feature type: {feature}"
                )

        # ----------------------------------------------------
        # Apply supplied values
        # ----------------------------------------------------

        for feature, value in values.items():

            if feature not in self.all_features:

                # Ignore unrelated application fields
                # such as caption, hashtags, image_path.
                continue

            feature_values[feature] = value

        # ----------------------------------------------------
        # Ensure categorical values are strings
        # ----------------------------------------------------

        for feature in self.categorical_features:

            value = feature_values.get(
                feature,
                ""
            )

            if value is None:

                value = ""

            feature_values[feature] = str(
                value
            )

        # ----------------------------------------------------
        # Ensure numeric values are numeric
        # ----------------------------------------------------

        for feature in self.numeric_features:

            value = feature_values.get(
                feature,
                0.0
            )

            if value is None:

                value = 0.0

            try:

                feature_values[feature] = float(
                    value
                )

            except (
                ValueError,
                TypeError
            ):

                raise ValueError(
                    f"Feature '{feature}' "
                    f"must be numeric. "
                    f"Received: {value!r}"
                )

        return feature_values

    # ========================================================
    # BUILD DATAFRAME
    # ========================================================

    def build_dataframe(
        self,
        values: dict
    ):

        """
        Convert feature dictionary into the exact
        1 x 56 production DataFrame.
        """

        feature_values = (
            self.complete_feature_vector(
                values
            )
        )

        dataframe = pd.DataFrame(
            [feature_values]
        )

        # ----------------------------------------------------
        # EXACT production feature order
        # ----------------------------------------------------

        dataframe = dataframe[
            self.all_features
        ].copy()

        # ----------------------------------------------------
        # Categorical dtype
        # ----------------------------------------------------

        for feature in self.categorical_features:

            dataframe[feature] = (
                dataframe[feature]
                .astype("object")
            )

        # ----------------------------------------------------
        # Numeric dtype
        # ----------------------------------------------------

        for feature in self.numeric_features:

            dataframe[feature] = pd.to_numeric(
                dataframe[feature],
                errors="coerce"
            )

        return dataframe

    # ========================================================
    # VALIDATE DATAFRAME
    # ========================================================

    def validate_features(
        self,
        dataframe: pd.DataFrame
    ):

        if not isinstance(
            dataframe,
            pd.DataFrame
        ):

            raise TypeError(
                "Input must be a pandas DataFrame."
            )

        # ----------------------------------------------------
        # Shape
        # ----------------------------------------------------

        if dataframe.shape != (
            1,
            56
        ):

            raise ValueError(
                "Invalid production feature shape. "
                f"Expected (1, 56), "
                f"received {dataframe.shape}."
            )

        # ----------------------------------------------------
        # Missing features
        # ----------------------------------------------------

        missing = [
            feature
            for feature in self.all_features
            if feature not in dataframe.columns
        ]

        if missing:

            raise ValueError(
                "Missing production features:\n"
                f"{missing}"
            )

        # ----------------------------------------------------
        # Unexpected features
        # ----------------------------------------------------

        unexpected = [
            feature
            for feature in dataframe.columns
            if feature not in self.all_features
        ]

        if unexpected:

            raise ValueError(
                "Unexpected production features:\n"
                f"{unexpected}"
            )

        # ----------------------------------------------------
        # Duplicate columns
        # ----------------------------------------------------

        if dataframe.columns.duplicated().any():

            duplicates = (
                dataframe.columns[
                    dataframe.columns.duplicated()
                ]
                .tolist()
            )

            raise ValueError(
                "Duplicate feature columns:\n"
                f"{duplicates}"
            )

        # ----------------------------------------------------
        # Reorder exactly
        # ----------------------------------------------------

        dataframe = dataframe[
            self.all_features
        ].copy()

        # ----------------------------------------------------
        # Categorical validation
        # ----------------------------------------------------

        for feature in self.categorical_features:

            dataframe[feature] = (
                dataframe[feature]
                .astype("object")
            )

        # ----------------------------------------------------
        # Numeric validation
        # ----------------------------------------------------

        for feature in self.numeric_features:

            dataframe[feature] = pd.to_numeric(
                dataframe[feature],
                errors="coerce"
            )

        # ----------------------------------------------------
        # Missing values
        # ----------------------------------------------------

        if dataframe.isna().any().any():

            bad_columns = (
                dataframe.columns[
                    dataframe.isna().any()
                ]
                .tolist()
            )

            raise ValueError(
                "Invalid/missing values detected "
                f"in features: {bad_columns}"
            )

        # ----------------------------------------------------
        # Final shape
        # ----------------------------------------------------

        if dataframe.shape != (
            1,
            56
        ):

            raise ValueError(
                "Final feature vector is not "
                "(1, 56)."
            )

        return dataframe

    # ========================================================
    # PREDICT
    # ========================================================

    def predict(
        self,
        dataframe: pd.DataFrame
    ):

        """
        Run the production model.

        Returns:

        {
            "prediction": "Low",
            "confidence": 0.XX,
            "probabilities": {
                "High": 0.XX,
                "Low": 0.XX,
                "Medium": 0.XX
            }
        }
        """

        # ----------------------------------------------------
        # Validate
        # ----------------------------------------------------

        dataframe = (
            self.validate_features(
                dataframe
            )
        )

        # ----------------------------------------------------
        # Model prediction
        # ----------------------------------------------------

        prediction = self.model.predict(
            dataframe
        )[0]

        # ----------------------------------------------------
        # Probabilities
        # ----------------------------------------------------

        probabilities = {}

        confidence = None

        if hasattr(
            self.model,
            "predict_proba"
        ):

            probability_values = (
                self.model.predict_proba(
                    dataframe
                )[0]
            )

            # -----------------------------------------------
            # Determine class labels
            # -----------------------------------------------

            if hasattr(
                self.model,
                "classes_"
            ):

                classes = (
                    self.model.classes_
                )

            else:

                classes = [
                    "High",
                    "Low",
                    "Medium"
                ]

            probabilities = {

                str(cls):
                    float(probability)

                for cls, probability
                in zip(
                    classes,
                    probability_values
                )

            }

            if probabilities:

                confidence = max(
                    probabilities.values()
                )

        # ----------------------------------------------------
        # Result
        # ----------------------------------------------------

        result = {

            "prediction":
                str(prediction),

            "confidence":
                (
                    float(confidence)
                    if confidence is not None
                    else None
                ),

            "probabilities":
                probabilities,

        }

        return result

    # ========================================================
    # PREDICT FROM VALUES
    # ========================================================

    def predict_from_values(
        self,
        values: dict
    ):

        """
        Convenience method.

        Dictionary
             ↓
        Complete 56 features
             ↓
        DataFrame
             ↓
        Validation
             ↓
        Model
             ↓
        Prediction
        """

        dataframe = (
            self.build_dataframe(
                values
            )
        )

        return self.predict(
            dataframe
        )

    # ========================================================
    # MODEL INFORMATION
    # ========================================================

    def get_model_info(self):

        return {

            "model_name":
                self.metadata.get(
                    "model_name",
                    type(
                        self.model
                    ).__name__
                ),

            "model_type":
                type(
                    self.model
                ).__name__,

            "feature_count":
                len(
                    self.all_features
                ),

            "numeric_feature_count":
                len(
                    self.numeric_features
                ),

            "categorical_feature_count":
                len(
                    self.categorical_features
                ),

            "target_column":
                self.metadata.get(
                    "target_column",
                    "performance_class"
                ),

            "target_classes":
                self.metadata.get(
                    "target_classes",
                    [
                        "High",
                        "Low",
                        "Medium"
                    ]
                ),

        }