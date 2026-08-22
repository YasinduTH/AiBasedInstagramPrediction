# ============================================================
# AI-BASED INSTAGRAM ENGAGEMENT PREDICTION SYSTEM
# PRODUCTION 56-FEATURE MAPPER
# ============================================================

import re
import math
from pathlib import Path

import numpy as np
import pandas as pd

try:
    import cv2
except ImportError:
    cv2 = None


# ============================================================
# TEXT FEATURE ENGINEERING
# ============================================================

def safe_text(value):
    if value is None:
        return ""

    return str(value).strip()


def extract_hashtags(text):
    text = safe_text(text)

    return re.findall(
        r"#([A-Za-z0-9_]+)",
        text
    )


def extract_mentions(text):
    text = safe_text(text)

    return re.findall(
        r"@[A-Za-z0-9_.]+",
        text
    )


def count_emojis(text):
    """
    Lightweight Unicode emoji detection.
    """

    text = safe_text(text)

    count = 0

    for char in text:

        code = ord(char)

        if (
            0x1F300 <= code <= 0x1FAFF
            or
            0x2600 <= code <= 0x27BF
        ):
            count += 1

    return count


def calculate_sentiment(text):
    """
    TextBlob sentiment when available.
    Falls back to neutral sentiment.
    """

    try:

        from textblob import TextBlob

        score = TextBlob(text).sentiment.polarity

        return float(
            np.clip(score, -1, 1)
        )

    except Exception:

        return 0.0


def calculate_subjectivity(text):

    try:

        from textblob import TextBlob

        score = TextBlob(text).sentiment.subjectivity

        return float(
            np.clip(score, 0, 1)
        )

    except Exception:

        return 0.5


def calculate_readability(text):

    words = re.findall(
        r"\b\w+\b",
        text
    )

    sentences = re.split(
        r"[.!?]+",
        text
    )

    sentences = [
        s for s in sentences
        if s.strip()
    ]

    if not words:
        return 0.0

    if not sentences:
        sentence_count = 1
    else:
        sentence_count = len(sentences)

    avg_words_per_sentence = (
        len(words) /
        sentence_count
    )

    # Lightweight readability proxy
    score = 100 - (
        avg_words_per_sentence * 2
    )

    return float(
        np.clip(score, 0, 100)
    )


def calculate_keyword_density(
    text,
    hashtags
):

    words = re.findall(
        r"\b\w+\b",
        text.lower()
    )

    if not words:
        return 0.0

    hashtag_words = [
        h.lower()
        for h in hashtags
    ]

    matches = sum(
        1
        for word in words
        if word in hashtag_words
    )

    return float(
        matches / len(words)
    )


def calculate_caption_complexity(
    text,
    word_count,
    sentence_count
):

    if word_count == 0:
        return 0.0

    avg_word_length = (
        sum(
            len(word)
            for word in re.findall(
                r"\b\w+\b",
                text
            )
        )
        /
        word_count
    )

    sentence_factor = (
        word_count /
        max(sentence_count, 1)
    )

    complexity = (
        avg_word_length * 0.6
        +
        sentence_factor * 0.15
    )

    return float(
        np.clip(
            complexity,
            0,
            20
        )
    )


def calculate_engagement_intent(text):

    text_lower = text.lower()

    intent_words = [
        "comment",
        "share",
        "save",
        "follow",
        "like",
        "tell me",
        "what do you think",
        "let me know",
        "tag",
        "click",
        "visit",
        "check",
        "discover"
    ]

    matches = sum(
        1
        for keyword in intent_words
        if keyword in text_lower
    )

    return float(
        min(matches, 5)
    )


def calculate_call_to_action(text):

    text_lower = text.lower()

    cta_words = [
        "follow",
        "like",
        "comment",
        "share",
        "save",
        "click",
        "visit",
        "check",
        "book",
        "buy",
        "learn",
        "discover",
        "subscribe",
        "dm"
    ]

    return int(
        any(
            word in text_lower
            for word in cta_words
        )
    )


# ============================================================
# IMAGE FEATURE ENGINEERING
# ============================================================

def extract_image_features(
    image_path
):

    features = {

        "has_image": 0,

        "image_width": 0,

        "image_height": 0,

        "aspect_ratio": 0.0,

        "brightness": 0.0,

        "contrast": 0.0,

        "saturation": 0.0,

        "sharpness": 0.0,

        "colorfulness": 0.0,

        "face_count": 0,

        "text_in_image": 0,

        "visual_complexity": 0.0,

        "estimated_image_quality": 0.0
    }


    if not image_path:

        return features


    path = Path(
        image_path
    )


    if not path.exists():

        return features


    if cv2 is None:

        raise ImportError(
            "OpenCV is required for image features."
        )


    image = cv2.imread(
        str(path)
    )


    if image is None:

        return features


    features["has_image"] = 1


    height, width = image.shape[:2]


    features[
        "image_width"
    ] = int(width)


    features[
        "image_height"
    ] = int(height)


    if height > 0:

        features[
            "aspect_ratio"
        ] = float(
            width / height
        )


    gray = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY
    )


    features[
        "brightness"
    ] = float(
        np.mean(gray)
    )


    features[
        "contrast"
    ] = float(
        np.std(gray)
    )


    hsv = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2HSV
    )


    features[
        "saturation"
    ] = float(
        np.mean(hsv[:, :, 1])
    )


    features[
        "sharpness"
    ] = float(
        cv2.Laplacian(
            gray,
            cv2.CV_64F
        ).var()
    )


    # --------------------------------------------------------
    # Colorfulness
    # --------------------------------------------------------

    b, g, r = cv2.split(
        image.astype(
            np.float32
        )
    )

    rg = np.abs(
        r - g
    )

    yb = np.abs(
        0.5 * (r + g) - b
    )

    std_rg = np.std(rg)

    std_yb = np.std(yb)

    mean_rg = np.mean(rg)

    mean_yb = np.mean(yb)

    colorfulness = (
        math.sqrt(
            std_rg ** 2 +
            std_yb ** 2
        )
        +
        0.3 *
        math.sqrt(
            mean_rg ** 2 +
            mean_yb ** 2
        )
    )

    features[
        "colorfulness"
    ] = float(
        colorfulness
    )


    # --------------------------------------------------------
    # Face Detection
    # --------------------------------------------------------

    try:

        cascade_path = (
            cv2.data.haarcascades
            +
            "haarcascade_frontalface_default.xml"
        )

        face_detector = cv2.CascadeClassifier(
            cascade_path
        )

        faces = face_detector.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5
        )

        features[
            "face_count"
        ] = int(
            len(faces)
        )

    except Exception:

        features[
            "face_count"
        ] = 0


    # --------------------------------------------------------
    # Edge Density / Visual Complexity
    # --------------------------------------------------------

    edges = cv2.Canny(
        gray,
        100,
        200
    )

    edge_density = (
        np.mean(
            edges > 0
        )
    )

    features[
        "visual_complexity"
    ] = float(
        edge_density
    )


    # --------------------------------------------------------
    # Text-in-image Proxy
    # --------------------------------------------------------

    # This is intentionally conservative.
    # Full OCR can be added later.

    horizontal_edges = cv2.Sobel(
        gray,
        cv2.CV_64F,
        1,
        0,
        ksize=3
    )

    edge_strength = np.mean(
        np.abs(
            horizontal_edges
        )
    )

    features[
        "text_in_image"
    ] = int(
        edge_strength > 20
    )


    # --------------------------------------------------------
    # Estimated Image Quality
    # --------------------------------------------------------

    resolution_score = min(
        (width * height)
        /
        (1080 * 1080),
        1.0
    )

    sharpness_score = min(
        features["sharpness"]
        /
        1000,
        1.0
    )

    contrast_score = min(
        features["contrast"]
        /
        80,
        1.0
    )

    quality = (
        0.40 * resolution_score
        +
        0.35 * sharpness_score
        +
        0.25 * contrast_score
    )

    features[
        "estimated_image_quality"
    ] = float(
        np.clip(
            quality,
            0,
            1
        )
    )


    return features


# ============================================================
# MAIN 56-FEATURE MAPPER
# ============================================================

def build_56_feature_vector(
    caption="",
    hashtags="",
    category="Other",
    account_type="Creator",
    follower_count=0,
    following_count=0,
    account_age_days=365,
    verified_status=0,
    posting_frequency=1.0,
    average_historical_engagement=0.05,
    audience_growth_rate=0.0,
    account_activity_level=0.5,
    content_consistency=0.5,
    posting_hour=12,
    day_of_week="Monday",
    posting_time_period="Afternoon",
    media_type="Image",
    has_location=0,
    sponsored=0,
    content_originality=0.5,
    content_quality_score=0.5,
    creator_activity_score=0.5,
    image_path=None
):

    caption = safe_text(
        caption
    )

    hashtags = safe_text(
        hashtags
    )


    # --------------------------------------------------------
    # Combine caption + hashtag text
    # --------------------------------------------------------

    full_text = (
        caption
        +
        " "
        +
        hashtags
    ).strip()


    # --------------------------------------------------------
    # Text statistics
    # --------------------------------------------------------

    words = re.findall(
        r"\b\w+\b",
        caption
    )

    sentences = [
        s
        for s in re.split(
            r"[.!?]+",
            caption
        )
        if s.strip()
    ]

    hashtag_list = extract_hashtags(
        hashtags
    )

    mentions = extract_mentions(
        full_text
    )


    word_count = len(
        words
    )

    sentence_count = max(
        len(sentences),
        1 if caption else 0
    )

    character_count = len(
        caption
    )

    hashtag_count = len(
        hashtag_list
    )

    unique_hashtag_count = len(
        set(
            h.lower()
            for h in hashtag_list
        )
    )


    if hashtag_list:

        average_hashtag_length = (
            sum(
                len(h)
                for h in hashtag_list
            )
            /
            len(hashtag_list)
        )

    else:

        average_hashtag_length = 0.0


    hashtag_character_count = sum(
        len(h)
        for h in hashtag_list
    )


    emoji_count = count_emojis(
        caption
    )

    mention_count = len(
        mentions
    )

    question_mark_count = caption.count(
        "?"
    )

    exclamation_count = caption.count(
        "!"
    )


    alphabetic_chars = [
        c
        for c in caption
        if c.isalpha()
    ]

    if alphabetic_chars:

        uppercase_ratio = (
            sum(
                c.isupper()
                for c in alphabetic_chars
            )
            /
            len(alphabetic_chars)
        )

    else:

        uppercase_ratio = 0.0


    numeric_token_count = len(
        re.findall(
            r"\b\d+\b",
            caption
        )
    )


    url_present = int(
        bool(
            re.search(
                r"https?://|www\.",
                full_text.lower()
            )
        )
    )


    call_to_action = calculate_call_to_action(
        caption
    )


    caption_sentiment = calculate_sentiment(
        caption
    )


    caption_subjectivity = calculate_subjectivity(
        caption
    )


    caption_readability = calculate_readability(
        caption
    )


    keyword_density = calculate_keyword_density(
        caption,
        hashtag_list
    )


    caption_complexity = calculate_caption_complexity(
        caption,
        word_count,
        sentence_count
    )


    caption_engagement_intent = (
        calculate_engagement_intent(
            caption
        )
    )


    is_weekend = int(
        str(day_of_week).lower()
        in {
            "saturday",
            "sunday"
        }
    )


    # --------------------------------------------------------
    # Image
    # --------------------------------------------------------

    image_features = extract_image_features(
        image_path
    )


    # --------------------------------------------------------
    # EXACT PRODUCTION FEATURES
    # --------------------------------------------------------

    features = {

        # 01
        "category": category,

        # 02
        "account_type": account_type,

        # 03
        "follower_count": follower_count,

        # 04
        "following_count": following_count,

        # 05
        "account_age_days": account_age_days,

        # 06
        "verified_status": verified_status,

        # 07
        "posting_frequency": posting_frequency,

        # 08
        "average_historical_engagement":
            average_historical_engagement,

        # 09
        "audience_growth_rate":
            audience_growth_rate,

        # 10
        "account_activity_level":
            account_activity_level,

        # 11
        "content_consistency":
            content_consistency,

        # 12
        "caption_length":
            character_count,

        # 13
        "word_count":
            word_count,

        # 14
        "sentence_count":
            sentence_count,

        # 15
        "hashtag_count":
            hashtag_count,

        # 16
        "unique_hashtag_count":
            unique_hashtag_count,

        # 17
        "average_hashtag_length":
            average_hashtag_length,

        # 18
        "hashtag_character_count":
            hashtag_character_count,

        # 19
        "emoji_count":
            emoji_count,

        # 20
        "mention_count":
            mention_count,

        # 21
        "question_mark_count":
            question_mark_count,

        # 22
        "exclamation_count":
            exclamation_count,

        # 23
        "uppercase_ratio":
            uppercase_ratio,

        # 24
        "numeric_token_count":
            numeric_token_count,

        # 25
        "url_present":
            url_present,

        # 26
        "call_to_action":
            call_to_action,

        # 27
        "caption_sentiment":
            caption_sentiment,

        # 28
        "caption_subjectivity":
            caption_subjectivity,

        # 29
        "caption_readability":
            caption_readability,

        # 30
        "keyword_density":
            keyword_density,

        # 31
        "caption_complexity":
            caption_complexity,

        # 32
        "caption_engagement_intent":
            caption_engagement_intent,

        # 33
        "posting_hour":
            posting_hour,

        # 34
        "day_of_week":
            day_of_week,

        # 35
        "is_weekend":
            is_weekend,

        # 36
        "posting_time_period":
            posting_time_period,

        # 37
        "media_type":
            media_type,

        # 38
        "has_image":
            image_features[
                "has_image"
            ],

        # 39
        "has_location":
            has_location,

        # 40
        "has_mention":
            int(
                mention_count > 0
            ),

        # 41
        "sponsored":
            sponsored,

        # 42
        "content_originality":
            content_originality,

        # 43
        "content_quality_score":
            content_quality_score,

        # 44
        "creator_activity_score":
            creator_activity_score,

        # 45
        "image_width":
            image_features[
                "image_width"
            ],

        # 46
        "image_height":
            image_features[
                "image_height"
            ],

        # 47
        "aspect_ratio":
            image_features[
                "aspect_ratio"
            ],

        # 48
        "brightness":
            image_features[
                "brightness"
            ],

        # 49
        "contrast":
            image_features[
                "contrast"
            ],

        # 50
        "saturation":
            image_features[
                "saturation"
            ],

        # 51
        "sharpness":
            image_features[
                "sharpness"
            ],

        # 52
        "colorfulness":
            image_features[
                "colorfulness"
            ],

        # 53
        "face_count":
            image_features[
                "face_count"
            ],

        # 54
        "text_in_image":
            image_features[
                "text_in_image"
            ],

        # 55
        "visual_complexity":
            image_features[
                "visual_complexity"
            ],

        # 56
        "estimated_image_quality":
            image_features[
                "estimated_image_quality"
            ]
    }


    # --------------------------------------------------------
    # Return DataFrame
    # --------------------------------------------------------

    return pd.DataFrame(
        [features]
    )