import re
from collections import Counter


# ============================================================
# TEXT FEATURE ENGINEERING
# ============================================================

def extract_text_features(
    caption: str,
    hashtags: str = ""
):

    caption = caption or ""
    hashtags = hashtags or ""

    words = caption.split()

    hashtag_matches = re.findall(
        r"#\w+",
        caption
    )

    emoji_count = sum(
        1
        for char in caption
        if ord(char) > 127
    )

    uppercase_count = sum(
        1
        for char in caption
        if char.isupper()
    )

    exclamation_count = caption.count("!")

    question_count = caption.count("?")

    return {

        "caption_length":
            len(caption),

        "word_count":
            len(words),

        "character_count":
            len(caption),

        "hashtag_count":
            len(hashtag_matches),

        "emoji_count":
            emoji_count,

        "uppercase_count":
            uppercase_count,

        "exclamation_count":
            exclamation_count,

        "question_count":
            question_count,

        "hashtag_length":
            len(hashtags),

    }