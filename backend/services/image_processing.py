from PIL import Image


# ============================================================
# IMAGE FEATURE EXTRACTION
# ============================================================

def extract_image_features(
    image_path
):

    image = Image.open(
        image_path
    )

    width, height = image.size

    aspect_ratio = (
        width / height
        if height
        else 0
    )

    return {

        "has_image": 1,

        "image_width":
            width,

        "image_height":
            height,

        "aspect_ratio":
            aspect_ratio,

    }