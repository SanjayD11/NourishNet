"""
Pollinations.ai Food Safety AI Scanner
=======================================
Analyzes food images using Pollinations.ai Vision API and returns
structured, risk-based JSON output for the NourishNet food-sharing platform.

Usage:
    from pollinations_scanner import scan_food_image
    result = scan_food_image("path/to/food.jpg")
    print(result)  # Structured JSON with risk level, issues, etc.
"""

import os
import sys
import base64
import json
import re
import time
from pathlib import Path
from typing import Dict, Optional
import requests
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

load_dotenv()
load_dotenv(Path(__file__).resolve().parent.parent / ".env")  # Also try project root

POLLINATIONS_API_KEY = os.getenv("POLLINATIONS_API_KEY")
POLLINATIONS_API_URL = "https://gen.pollinations.ai/v1/chat/completions"

# Maximum image size in bytes (10 MB)
MAX_IMAGE_SIZE = 10 * 1024 * 1024

# Supported image MIME types
SUPPORTED_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".bmp": "image/bmp",
}

# ---------------------------------------------------------------------------
# System Prompt — The food safety AI brain
# ---------------------------------------------------------------------------

FOOD_SAFETY_SYSTEM_PROMPT = """You are a Food Safety AI Scanner integrated inside a food-sharing platform.

Your job is to analyze uploaded food images and return structured, reliable, risk-based output.

IMPORTANT RULES:
- Only analyze what is visually observable.
- Do NOT guess invisible contamination.
- Do NOT hallucinate expiry dates if not visible.
- If information is unclear, say "Not Visible".
- Never guarantee food safety.
- Provide risk estimation only based on visual evidence.

TASKS:

1. Identify the food item (short name).
2. Detect visible spoilage indicators:
   - Mold (white/green/black fuzzy spots)
   - Discoloration
   - Slimy texture
   - Excess moisture leakage
   - Swollen packaging
   - Torn or damaged packaging
3. Detect expiry or best-before date if clearly visible.
4. Assess overall visual risk level:
   - LOW → No visible issues
   - MEDIUM → Minor concerns / unclear freshness
   - HIGH → Visible spoilage or damage
5. Provide short user-facing message.

OUTPUT FORMAT (STRICT JSON ONLY):

{
  "food_identified": "",
  "expiry_date_visible": "Yes / No",
  "detected_expiry_text": "",
  "visible_issues": [],
  "risk_level": "LOW / MEDIUM / HIGH",
  "confidence": "Low / Medium / High",
  "user_message": ""
}

If image quality is poor, reduce confidence.
Never return explanations outside JSON."""


# ---------------------------------------------------------------------------
# Custom Exceptions
# ---------------------------------------------------------------------------

class ScannerError(Exception):
    """Base exception for scanner errors."""
    pass


class ImageError(ScannerError):
    """Raised when image is missing or invalid."""
    pass


class APIError(ScannerError):
    """Raised when Pollinations API request fails."""
    pass


# ---------------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------------

def encode_image_to_data_uri(image_path: str) -> str:
    """
    Encode an image file to a base64 data URI.

    Args:
        image_path: Path to the image file

    Returns:
        Data URI string (data:image/jpeg;base64,...)

    Raises:
        ImageError: If image cannot be read or is invalid
    """
    path = Path(image_path)

    if not path.exists():
        raise ImageError(f"Image file not found: {image_path}")

    if not path.is_file():
        raise ImageError(f"Path is not a file: {image_path}")

    ext = path.suffix.lower()
    mime_type = SUPPORTED_TYPES.get(ext)
    if not mime_type:
        raise ImageError(
            f"Unsupported image format: {ext}. "
            f"Supported: {', '.join(SUPPORTED_TYPES.keys())}"
        )

    file_size = path.stat().st_size
    if file_size > MAX_IMAGE_SIZE:
        raise ImageError(
            f"Image too large: {file_size / (1024*1024):.1f} MB. "
            f"Maximum: {MAX_IMAGE_SIZE / (1024*1024):.0f} MB"
        )

    try:
        with open(path, "rb") as f:
            image_bytes = f.read()
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        return f"data:{mime_type};base64,{b64}"
    except Exception as e:
        raise ImageError(f"Failed to read image: {e}")


def base64_to_data_uri(image_base64: str, mime_type: str = "image/jpeg") -> str:
    """
    Convert a raw base64 string to a data URI.

    Args:
        image_base64: Raw base64 encoded image string
        mime_type: MIME type of the image

    Returns:
        Data URI string
    """
    # Strip any existing data URI prefix
    if image_base64.startswith("data:"):
        return image_base64

    return f"data:{mime_type};base64,{image_base64}"


def call_pollinations_vision(image_data_uri: str, max_retries: int = 2) -> str:
    """
    Call Pollinations.ai Vision API with a food image.

    Args:
        image_data_uri: Image as a data URI string
        max_retries: Number of retries on transient failures

    Returns:
        Raw text response from the AI model

    Raises:
        APIError: If API request fails after retries
    """
    if not POLLINATIONS_API_KEY:
        raise APIError(
            "POLLINATIONS_API_KEY not found. Create a .env file with:\n"
            "  POLLINATIONS_API_KEY=your_api_key\n"
            "Get your key at: https://pollinations.ai"
        )

    headers = {
        "Authorization": f"Bearer {POLLINATIONS_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "openai",
        "response_format": {"type": "json_object"},
        "temperature": 0.2,
        "max_tokens": 1024,
        "messages": [
            {
                "role": "system",
                "content": FOOD_SAFETY_SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Analyze this food image for safety. Return ONLY the JSON object.",
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": image_data_uri},
                    },
                ],
            },
        ],
    }

    last_error = None
    for attempt in range(max_retries + 1):
        try:
            response = requests.post(
                POLLINATIONS_API_URL,
                headers=headers,
                json=payload,
                timeout=60,
            )
            response.raise_for_status()

            data = response.json()
            choices = data.get("choices", [])
            if not choices:
                raise APIError("No response choices returned from API")

            content = choices[0].get("message", {}).get("content", "")
            if not content:
                raise APIError("Empty response content from API")

            return content

        except requests.exceptions.Timeout:
            last_error = APIError("API request timed out after 60 seconds")
        except requests.exceptions.HTTPError as e:
            status = e.response.status_code if e.response is not None else 0
            if status == 401:
                raise APIError("Authentication failed. Check your POLLINATIONS_API_KEY")
            elif status == 429:
                last_error = APIError("Rate limit exceeded. Please wait and try again")
            elif status >= 500:
                last_error = APIError(f"Server error {status}. Retrying...")
            else:
                raise APIError(f"HTTP error {status}: {e}")
        except requests.exceptions.ConnectionError:
            last_error = APIError("Could not connect to Pollinations API. Check internet")
        except APIError:
            raise
        except Exception as e:
            raise APIError(f"Unexpected error: {e}")

        # Wait before retry (exponential backoff)
        if attempt < max_retries:
            wait_time = 2 ** (attempt + 1)
            print(f"⏳ Retrying in {wait_time}s (attempt {attempt + 2}/{max_retries + 1})...",
                  file=sys.stderr)
            time.sleep(wait_time)

    raise last_error


def parse_scanner_response(raw_response: str) -> Dict:
    """
    Parse and validate the AI's JSON response.

    Args:
        raw_response: Raw text from the AI model

    Returns:
        Validated dictionary matching the required schema

    Raises:
        APIError: If response cannot be parsed or is invalid
    """
    # Try to extract JSON from the response
    text = raw_response.strip()

    # Remove markdown code fences if present
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)

    try:
        result = json.loads(text)
    except json.JSONDecodeError:
        # Try to find JSON object in the response
        match = re.search(r"\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}", text, re.DOTALL)
        if match:
            try:
                result = json.loads(match.group())
            except json.JSONDecodeError:
                raise APIError(f"Could not parse JSON from response: {text[:200]}")
        else:
            raise APIError(f"No JSON found in response: {text[:200]}")

    # Validate and normalize required fields
    schema_defaults = {
        "food_identified": "Unknown",
        "expiry_date_visible": "No",
        "detected_expiry_text": "Not Visible",
        "visible_issues": [],
        "risk_level": "MEDIUM",
        "confidence": "Low",
        "user_message": "Unable to fully assess food safety from image.",
    }

    # Ensure all required fields exist
    for key, default in schema_defaults.items():
        if key not in result:
            result[key] = default

    # Normalize risk_level
    risk = result["risk_level"].upper().strip()
    if risk not in ("LOW", "MEDIUM", "HIGH"):
        result["risk_level"] = "MEDIUM"
    else:
        result["risk_level"] = risk

    # Normalize confidence
    conf = result["confidence"].strip().capitalize()
    if conf not in ("Low", "Medium", "High"):
        result["confidence"] = "Medium"
    else:
        result["confidence"] = conf

    # Normalize expiry_date_visible
    exp = result["expiry_date_visible"].strip().capitalize()
    if exp not in ("Yes", "No"):
        result["expiry_date_visible"] = "No"
    else:
        result["expiry_date_visible"] = exp

    # Ensure visible_issues is a list
    if not isinstance(result["visible_issues"], list):
        result["visible_issues"] = [str(result["visible_issues"])]

    # Return only the expected keys (no extras)
    return {k: result[k] for k in schema_defaults}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def scan_food_image(image_path: str) -> Dict:
    """
    Analyze a food image for safety using Pollinations.ai Vision API.

    Args:
        image_path: Path to image file (JPG, PNG, etc.)

    Returns:
        Dictionary with structured food safety assessment:
            - food_identified: Short name of the food
            - expiry_date_visible: "Yes" or "No"
            - detected_expiry_text: The date text or "Not Visible"
            - visible_issues: List of detected spoilage signs
            - risk_level: "LOW", "MEDIUM", or "HIGH"
            - confidence: "Low", "Medium", or "High"
            - user_message: Short safety message

    Raises:
        ImageError: If image is invalid or missing
        APIError: If Pollinations API call fails
    """
    print("📸 Encoding image...", file=sys.stderr)
    data_uri = encode_image_to_data_uri(image_path)

    print("🤖 Analyzing with Pollinations AI Vision...", file=sys.stderr)
    raw_response = call_pollinations_vision(data_uri)

    print("🔍 Parsing results...", file=sys.stderr)
    result = parse_scanner_response(raw_response)

    print("✅ Analysis complete!", file=sys.stderr)
    return result


def scan_food_base64(image_base64: str, mime_type: str = "image/jpeg") -> Dict:
    """
    Analyze a base64-encoded food image for safety.

    Args:
        image_base64: Base64 encoded image string
        mime_type: MIME type of the image

    Returns:
        Same structured dictionary as scan_food_image()

    Raises:
        APIError: If analysis fails
    """
    data_uri = base64_to_data_uri(image_base64, mime_type)

    print("🤖 Analyzing with Pollinations AI Vision...", file=sys.stderr)
    raw_response = call_pollinations_vision(data_uri)

    print("🔍 Parsing results...", file=sys.stderr)
    result = parse_scanner_response(raw_response)

    print("✅ Analysis complete!", file=sys.stderr)
    return result


# ---------------------------------------------------------------------------
# CLI Entry Point
# ---------------------------------------------------------------------------

def main():
    """Command-line interface for testing."""
    if len(sys.argv) < 2:
        print("Usage: python pollinations_scanner.py <image_path>")
        print("\nExample:")
        print('  python pollinations_scanner.py "food.jpg"')
        sys.exit(1)

    image_path = sys.argv[1]

    try:
        result = scan_food_image(image_path)
        print("\n" + json.dumps(result, indent=2))

    except ScannerError as e:
        print(f"\n❌ Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
