"""
AI Instagram Content Optimization Engine

Generates actionable recommendations based on:
- Caption
- Hashtags
- Content category
- Account type
- Account activity level
- Content consistency
- ML prediction
- Prediction confidence
- Image analysis results
"""

import re


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def _safe_float(value, default=0.0):
    """Safely convert a value to float."""
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _clamp(value, minimum=0, maximum=100):
    """Keep a numeric value inside a given range."""
    return max(minimum, min(maximum, value))


def _count_words(text):
    """Count words in text."""
    if not text:
        return 0

    return len(re.findall(r"\b[\w'-]+\b", str(text)))


def _count_hashtags(hashtags):
    """Count hashtags from a hashtag string."""
    if not hashtags:
        return 0

    return len(
        re.findall(
            r"(?:^|\s)#[\w]+",
            str(hashtags)
        )
    )


def _contains_question(text):
    """Check whether the caption contains a question."""
    if not text:
        return False

    return "?" in str(text)


def _contains_call_to_action(text):
    """
    Detect common Instagram call-to-action phrases.
    """
    if not text:
        return False

    text_lower = str(text).lower()

    cta_phrases = [
        "comment",
        "share",
        "save",
        "follow",
        "like",
        "tell me",
        "let me know",
        "what do you think",
        "tag",
        "dm me",
        "send me",
        "check out",
        "click",
        "learn more",
        "book now",
        "shop now",
    ]

    return any(
        phrase in text_lower
        for phrase in cta_phrases
    )


def _has_emojis(text):
    """
    Basic emoji detection.
    """
    if not text:
        return False

    text = str(text)

    for character in text:
        code = ord(character)

        if (
            0x1F300 <= code <= 0x1FAFF
            or 0x2600 <= code <= 0x27BF
        ):
            return True

    return False


def _normalize_prediction(prediction):
    """Normalize model prediction text."""
    if not prediction:
        return "Unknown"

    value = str(prediction).strip().lower()

    if value == "high":
        return "High"

    if value == "medium":
        return "Medium"

    if value == "low":
        return "Low"

    return str(prediction).strip().title()


# ============================================================
# CAPTION ANALYSIS
# ============================================================

def analyze_caption(caption):
    """
    Analyze caption quality and generate recommendations.
    """

    caption = str(caption or "").strip()

    character_count = len(caption)
    word_count = _count_words(caption)

    suggestions = []
    strengths = []

    # Empty caption
    if not caption:
        return {
            "status": "Needs improvement",
            "character_count": 0,
            "word_count": 0,
            "has_call_to_action": False,
            "has_question": False,
            "has_emoji": False,
            "strengths": [],
            "suggestions": [
                "Create a clear and engaging caption.",
                "Explain the value or story behind the post.",
                "Add a call-to-action to encourage interaction.",
            ],
        }

    # Caption length
    if character_count < 30:
        suggestions.append(
            "Your caption is very short. Add more context, "
            "storytelling, or value for your audience."
        )
    elif character_count < 80:
        suggestions.append(
            "Consider adding more useful or emotional context "
            "to make the caption more engaging."
        )
    elif character_count <= 2200:
        strengths.append(
            "Caption length is suitable for Instagram."
        )
    else:
        suggestions.append(
            "Your caption is very long. Consider making it "
            "more concise and easier to read."
        )

    # CTA
    has_cta = _contains_call_to_action(caption)

    if has_cta:
        strengths.append(
            "Caption contains a call-to-action."
        )
    else:
        suggestions.append(
            "Add a clear call-to-action such as "
            "'What do you think?', 'Save this post', "
            "or 'Share with a friend'."
        )

    # Question
    has_question = _contains_question(caption)

    if has_question:
        strengths.append(
            "Caption uses a question to encourage interaction."
        )
    else:
        suggestions.append(
            "Consider asking a relevant question to encourage "
            "comments and audience interaction."
        )

    # Emoji
    has_emoji = _has_emojis(caption)

    if has_emoji:
        strengths.append(
            "Caption uses visual elements such as emojis."
        )
    else:
        suggestions.append(
            "Consider using a small number of relevant emojis "
            "to make the caption visually engaging."
        )

    if not suggestions:
        status = "Strong"
    elif len(suggestions) <= 2:
        status = "Good"
    else:
        status = "Needs improvement"

    return {
        "status": status,
        "character_count": character_count,
        "word_count": word_count,
        "has_call_to_action": has_cta,
        "has_question": has_question,
        "has_emoji": has_emoji,
        "strengths": strengths,
        "suggestions": suggestions,
    }


# ============================================================
# HASHTAG ANALYSIS
# ============================================================

def analyze_hashtags(hashtags):
    """
    Analyze hashtag usage and generate recommendations.
    """

    hashtags = str(hashtags or "").strip()

    hashtag_list = re.findall(
        r"#[A-Za-z0-9_]+",
        hashtags
    )

    hashtag_count = len(hashtag_list)

    suggestions = []
    strengths = []

    if hashtag_count == 0:
        status = "Needs improvement"

        suggestions.extend([
            "Add relevant hashtags related to your content.",
            "Use a mixture of broad, niche, and category-specific hashtags.",
        ])

    elif hashtag_count < 3:
        status = "Needs improvement"

        suggestions.append(
            "Consider using more relevant hashtags to improve "
            "content discoverability."
        )

    elif hashtag_count <= 15:
        status = "Good"

        strengths.append(
            "Hashtag usage is within a reasonable range."
        )

        suggestions.append(
            "Use a balanced combination of broad and niche hashtags."
        )

    else:
        status = "Needs improvement"

        suggestions.append(
            "You are using many hashtags. Focus on highly relevant "
            "hashtags rather than adding excessive tags."
        )

    # Duplicate detection
    normalized = [
        tag.lower()
        for tag in hashtag_list
    ]

    if len(normalized) != len(set(normalized)):
        suggestions.append(
            "Remove duplicate hashtags."
        )

    return {
        "status": status,
        "hashtag_count": hashtag_count,
        "hashtags": hashtag_list,
        "strengths": strengths,
        "suggestions": suggestions,
    }


# ============================================================
# IMAGE ANALYSIS
# ============================================================

def analyze_image(image_analysis):
    """
    Analyze image information returned by the Flask ML API.

    Expected possible fields:
        uploaded
        image_width
        image_height
        file_size
        file_type
        brightness
        contrast
        sharpness
    """

    if not image_analysis:
        return {
            "status": "No image",
            "uploaded": False,
            "suggestions": [
                "Upload an Instagram image so the AI system "
                "can include visual features in the analysis."
            ],
        }

    uploaded = image_analysis.get(
        "uploaded",
        True
    )

    if not uploaded:
        return {
            "status": "No image",
            "uploaded": False,
            "suggestions": [
                "Upload an image to enable image-based prediction "
                "and visual content analysis."
            ],
        }

    suggestions = []
    strengths = []

    width = _safe_float(
        image_analysis.get("image_width"),
        0
    )

    height = _safe_float(
        image_analysis.get("image_height"),
        0
    )

    brightness = _safe_float(
        image_analysis.get("brightness"),
        None
    )

    contrast = _safe_float(
        image_analysis.get("contrast"),
        None
    )

    sharpness = _safe_float(
        image_analysis.get("sharpness"),
        None
    )

    # Dimensions
    if width > 0 and height > 0:

        if width >= 1080 and height >= 1080:
            strengths.append(
                "Image resolution is suitable for Instagram content."
            )
        else:
            suggestions.append(
                "Consider using a higher-resolution image "
                "for better visual quality."
            )

    # Brightness
    if brightness is not None:

        if brightness < 40:
            suggestions.append(
                "The image appears relatively dark. "
                "Consider improving lighting or exposure."
            )

        elif brightness > 220:
            suggestions.append(
                "The image appears very bright. "
                "Consider reducing exposure or highlights."
            )

        else:
            strengths.append(
                "Image brightness is within a reasonable range."
            )

    # Contrast
    if contrast is not None:

        if contrast < 20:
            suggestions.append(
                "The image has relatively low contrast. "
                "Consider improving visual separation."
            )

        else:
            strengths.append(
                "Image contrast appears suitable."
            )

    # Sharpness
    if sharpness is not None:

        if sharpness < 50:
            suggestions.append(
                "The image may appear soft or blurry. "
                "Consider using a sharper image."
            )

        else:
            strengths.append(
                "Image sharpness appears suitable."
            )

    if not suggestions:
        status = "Strong"
    elif len(suggestions) <= 2:
        status = "Good"
    else:
        status = "Needs improvement"

    return {
        "status": status,
        "uploaded": True,
        "width": int(width) if width else None,
        "height": int(height) if height else None,
        "brightness": brightness,
        "contrast": contrast,
        "sharpness": sharpness,
        "strengths": strengths,
        "suggestions": suggestions,
    }


# ============================================================
# ACCOUNT / ENGAGEMENT ANALYSIS
# ============================================================

def analyze_account(
    account_type,
    account_activity_level,
    content_consistency
):
    """
    Analyze account activity and consistency.
    """

    activity = _clamp(
        _safe_float(
            account_activity_level,
            0.75
        ) * 100
    )

    consistency = _clamp(
        _safe_float(
            content_consistency,
            0.70
        ) * 100
    )

    suggestions = []
    strengths = []

    if activity >= 75:
        strengths.append(
            "Account activity level is strong."
        )
    elif activity >= 50:
        suggestions.append(
            "Increasing account activity may help maintain "
            "audience engagement."
        )
    else:
        suggestions.append(
            "Increase account activity through consistent posting "
            "and audience interaction."
        )

    if consistency >= 75:
        strengths.append(
            "Content consistency is strong."
        )
    elif consistency >= 50:
        suggestions.append(
            "Improve posting consistency to build a stronger "
            "audience routine."
        )
    else:
        suggestions.append(
            "A more consistent content schedule is recommended."
        )

    return {
        "account_type": account_type or "Unknown",
        "activity_level": round(activity / 100, 2),
        "content_consistency": round(consistency / 100, 2),
        "strengths": strengths,
        "suggestions": suggestions,
    }


# ============================================================
# ENGAGEMENT STRATEGY
# ============================================================

def generate_engagement_strategy(
    prediction,
    confidence,
    caption_analysis,
    hashtag_analysis,
    account_analysis,
    image_analysis,
):
    """
    Generate recommendations based on the ML prediction
    and content analysis.
    """

    prediction = _normalize_prediction(prediction)

    confidence_percent = _clamp(
        _safe_float(confidence, 0) * 100
    )

    suggestions = []

    if prediction == "High":

        overall_message = (
            "Your content is predicted to achieve high engagement. "
            "Maintain the current content strategy while testing "
            "small improvements."
        )

        suggestions.extend([
            "Maintain the current content style and quality.",
            "Continue using relevant hashtags.",
            "Keep audience interaction active.",
            "Test variations of successful captions and visuals.",
        ])

    elif prediction == "Medium":

        overall_message = (
            "Your content has moderate engagement potential. "
            "Improving the caption, discoverability, and audience "
            "interaction could increase engagement."
        )

        suggestions.extend([
            "Strengthen the caption with a clear call-to-action.",
            "Use relevant niche and category-specific hashtags.",
            "Encourage comments, saves, or shares.",
            "Maintain consistent posting activity.",
        ])

    elif prediction == "Low":

        overall_message = (
            "Your content is currently predicted to have low "
            "engagement potential. Several content elements "
            "can be improved before publishing."
        )

        suggestions.extend([
            "Improve the caption with stronger storytelling or value.",
            "Add a clear call-to-action.",
            "Review and improve hashtag relevance.",
            "Improve image quality and visual presentation where needed.",
            "Increase audience interaction and posting consistency.",
        ])

    else:

        overall_message = (
            "The system could not determine a specific engagement "
            "strategy from the current prediction."
        )

    # Add analysis-specific recommendations
    suggestions.extend(
        caption_analysis.get(
            "suggestions",
            []
        )[:2]
    )

    suggestions.extend(
        hashtag_analysis.get(
            "suggestions",
            []
        )[:2]
    )

    suggestions.extend(
        image_analysis.get(
            "suggestions",
            []
        )[:2]
    )

    suggestions.extend(
        account_analysis.get(
            "suggestions",
            []
        )[:2]
    )

    # Remove duplicates while preserving order
    unique_suggestions = []

    for suggestion in suggestions:
        if suggestion not in unique_suggestions:
            unique_suggestions.append(suggestion)

    return {
        "prediction": prediction,
        "confidence": round(
            confidence_percent,
            2
        ),
        "overallRecommendation": overall_message,
        "suggestions": unique_suggestions[:10],
    }


# ============================================================
# OPTIMIZATION SCORE
# ============================================================

def calculate_optimization_score(
    caption_analysis,
    hashtag_analysis,
    account_analysis,
    image_analysis,
    prediction,
):
    """
    Calculate an interpretable content optimization score.

    This is NOT the ML prediction itself.
    It is an additional rule-based diagnostic score.
    """

    score = 100

    # Caption
    caption_status = caption_analysis.get(
        "status"
    )

    if caption_status == "Needs improvement":
        score -= 20
    elif caption_status == "Good":
        score -= 8

    # Hashtags
    hashtag_status = hashtag_analysis.get(
        "status"
    )

    if hashtag_status == "Needs improvement":
        score -= 15
    elif hashtag_status == "Good":
        score -= 5

    # Account
    activity = account_analysis.get(
        "activity_level",
        0.75
    )

    consistency = account_analysis.get(
        "content_consistency",
        0.70
    )

    if activity < 0.5:
        score -= 10
    elif activity < 0.75:
        score -= 5

    if consistency < 0.5:
        score -= 10
    elif consistency < 0.75:
        score -= 5

    # Image
    if image_analysis.get("uploaded"):

        image_status = image_analysis.get(
            "status"
        )

        if image_status == "Needs improvement":
            score -= 15
        elif image_status == "Good":
            score -= 5

    # Prediction
    normalized_prediction = _normalize_prediction(
        prediction
    )

    if normalized_prediction == "High":
        score += 5

    elif normalized_prediction == "Low":
        score -= 5

    return int(
        _clamp(score)
    )


# ============================================================
# MAIN OPTIMIZATION ENGINE
# ============================================================

def generate_content_optimization(
    caption,
    hashtags,
    category,
    account_type,
    account_activity_level,
    content_consistency,
    prediction,
    confidence,
    image_analysis=None,
):
    """
    Main Content Optimization Engine.

    Returns a complete structured optimization report.
    """

    caption_result = analyze_caption(
        caption
    )

    hashtag_result = analyze_hashtags(
        hashtags
    )

    account_result = analyze_account(
        account_type,
        account_activity_level,
        content_consistency,
    )

    image_result = analyze_image(
        image_analysis
    )

    strategy_result = generate_engagement_strategy(
        prediction,
        confidence,
        caption_result,
        hashtag_result,
        account_result,
        image_result,
    )

    optimization_score = calculate_optimization_score(
        caption_result,
        hashtag_result,
        account_result,
        image_result,
        prediction,
    )

    # Category-specific advice
    category_suggestions = []

    category_lower = str(
        category or ""
    ).lower()

    if category_lower == "education":
        category_suggestions.append(
            "Provide a useful takeaway, tip, or learning point "
            "that users can save or share."
        )

    elif category_lower == "fashion":
        category_suggestions.append(
            "Use visually strong presentation and relevant "
            "fashion/style hashtags."
        )

    elif category_lower == "food":
        category_suggestions.append(
            "Highlight the visual appeal and invite users "
            "to share their food preferences."
        )

    elif category_lower == "travel":
        category_suggestions.append(
            "Use storytelling and location-related hashtags "
            "to increase discoverability."
        )

    elif category_lower == "technology":
        category_suggestions.append(
            "Highlight the key benefit or practical value "
            "of the technology being presented."
        )

    elif category_lower == "fitness":
        category_suggestions.append(
            "Use motivational messaging and encourage users "
            "to share their progress or goals."
        )

    else:
        category_suggestions.append(
            "Keep the content relevant to the selected category "
            "and target audience."
        )

    return {
        "optimization_score": optimization_score,

        "category": category,

        "caption": caption_result,

        "hashtags": hashtag_result,

        "account": account_result,

        "image": image_result,

        "engagement": strategy_result,

        "categoryRecommendations": category_suggestions,

        "summary": {
            "prediction": _normalize_prediction(
                prediction
            ),
            "confidence": round(
                _safe_float(confidence, 0) * 100,
                2
            ),
            "optimization_score": optimization_score,
            "has_image": bool(
                image_analysis
                and image_analysis.get(
                    "uploaded",
                    False
                )
            ),
        },
    }