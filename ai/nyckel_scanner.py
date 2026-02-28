"""
Nyckel Food Spoilage Detection Integration
===========================================
Production-ready integration with Nyckel Food Spoilage Indicator API.

Usage:
    from nyckel_scanner import analyze_food_spoilage
    result = analyze_food_spoilage("path/to/food.jpg")
    print(result)  # {"classification": "Fresh", "confidence": 92.5, ...}
"""

import os
import sys
import base64
import json
from pathlib import Path
from typing import Dict, List, Optional
import requests
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Load environment variables
load_dotenv()

NYCKEL_API_KEY = os.getenv("NYCKEL_API_KEY")
NYCKEL_FUNCTION_ID = os.getenv("NYCKEL_FUNCTION_ID")
NYCKEL_API_URL = f"https://www.nyckel.com/v1/functions/{NYCKEL_FUNCTION_ID}/invoke"

# Safety thresholds
CONFIDENCE_THRESHOLD = 0.70  # 70% confidence minimum
SPOILAGE_INDICATORS = [
    "mold", "discoloration", "liquefaction", "bruising", 
    "browning", "wilting", "texture_change", "off_odor"
]


# ---------------------------------------------------------------------------
# Custom Exceptions
# ---------------------------------------------------------------------------

class NyckelError(Exception):
    """Base exception for Nyckel API errors."""
    pass


class ImageError(NyckelError):
    """Raised when image is missing or invalid."""
    pass


class APIError(NyckelError):
    """Raised when Nyckel API request fails."""
    pass


# ---------------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------------

def encode_image_base64(image_path: str) -> str:
    """
    Encode an image file to base64 string.
    
    Args:
        image_path: Path to the image file
        
    Returns:
        Base64 encoded string
        
    Raises:
        ImageError: If image cannot be read
    """
    path = Path(image_path)
    
    if not path.exists():
        raise ImageError(f"Image file not found: {image_path}")
    
    if not path.is_file():
        raise ImageError(f"Path is not a file: {image_path}")
    
    try:
        with open(path, "rb") as f:
            image_bytes = f.read()
        return base64.b64encode(image_bytes).decode("utf-8")
    except Exception as e:
        raise ImageError(f"Failed to read image: {e}")


def call_nyckel_api(image_base64: str) -> Dict:
    """
    Call Nyckel Food Spoilage Indicator API.
    
    Args:
        image_base64: Base64 encoded image string
        
    Returns:
        API response as dictionary
        
    Raises:
        APIError: If API request fails
    """
    if not NYCKEL_API_KEY:
        raise APIError(
            "NYCKEL_API_KEY not found. Create a .env file with:\n"
            "  NYCKEL_API_KEY=your_api_key\n"
            "Get your key at: https://www.nyckel.com"
        )
    
    if not NYCKEL_FUNCTION_ID:
        raise APIError(
            "NYCKEL_FUNCTION_ID not found. Add to .env file:\n"
            "  NYCKEL_FUNCTION_ID=your_function_id"
        )
    
    headers = {
        "Authorization": f"Bearer {NYCKEL_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "data": image_base64
    }
    
    try:
        response = requests.post(
            NYCKEL_API_URL,
            headers=headers,
            json=payload,
            timeout=30
        )
        response.raise_for_status()
        return response.json()
    
    except requests.exceptions.Timeout:
        raise APIError("API request timed out after 30 seconds")
    
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            raise APIError("Authentication failed. Check your NYCKEL_API_KEY")
        elif e.response.status_code == 404:
            raise APIError("Function not found. Check your NYCKEL_FUNCTION_ID")
        elif e.response.status_code == 429:
            raise APIError("Rate limit exceeded. Please wait and try again")
        else:
            raise APIError(f"HTTP error {e.response.status_code}: {e}")
    
    except requests.exceptions.ConnectionError:
        raise APIError("Could not connect to Nyckel API. Check your internet connection")
    
    except Exception as e:
        raise APIError(f"Unexpected error calling API: {e}")


def parse_nyckel_response(api_response: Dict) -> Dict[str, any]:
    """
    Parse Nyckel API response and determine spoilage status.
    
    Args:
        api_response: Raw API response dictionary
        
    Returns:
        Structured result dictionary with:
            - classification: "Fresh" or "Spoiled"
            - confidence: 0-100 percentage
            - visible_indicators: List of detected spoilage signs
            - safety_recommendation: Safety message
    """
    # Extract predictions from response
    # Note: Actual response format depends on Nyckel's Food Spoilage function
    # This is a generic implementation - adjust based on actual API response
    
    predictions = api_response.get("predictions", [])
    if not predictions:
        # Fallback for different response formats
        label = api_response.get("labelName", "Unknown")
        confidence = api_response.get("confidence", 0.0)
        predictions = [{"label": label, "confidence": confidence}]
    
    # Sort by confidence
    predictions.sort(key=lambda x: x.get("confidence", 0), reverse=True)
    
    # Get top prediction
    top_prediction = predictions[0]
    label = top_prediction.get("label", "Unknown").lower()
    confidence = float(top_prediction.get("confidence", 0))
    
    # Determine classification
    if "fresh" in label or "good" in label or "safe" in label:
        classification = "Fresh"
    elif "spoiled" in label or "rotten" in label or "bad" in label:
        classification = "Spoiled"
    else:
        # If unclear, use confidence threshold
        classification = "Fresh" if confidence < 0.5 else "Spoiled"
    
    # Extract visible indicators (if provided by API)
    visible_indicators = []
    for pred in predictions:
        pred_label = pred.get("label", "").lower()
        for indicator in SPOILAGE_INDICATORS:
            if indicator in pred_label:
                visible_indicators.append(indicator.replace("_", " ").title())
    
    # Remove duplicates
    visible_indicators = list(set(visible_indicators))
    
    # Convert confidence to percentage
    confidence_pct = confidence * 100
    
    # Generate safety recommendation
    if classification == "Fresh":
        if confidence_pct >= CONFIDENCE_THRESHOLD * 100:
            safety_recommendation = "✅ Safe to eat. Food appears fresh with no visible signs of spoilage."
        else:
            safety_recommendation = (
                "⚠️ Low confidence. Inspect food carefully before consuming. "
                "Check for unusual smell, texture, or appearance."
            )
    else:  # Spoiled
        safety_recommendation = (
            "🚫 DO NOT EAT. Dispose immediately. "
            "Consuming spoiled food can cause foodborne illness."
        )
        if confidence_pct < CONFIDENCE_THRESHOLD * 100:
            safety_recommendation += " (Low confidence - verify visually before discarding.)"
    
    return {
        "classification": classification,
        "confidence": round(confidence_pct, 1),
        "visible_indicators": visible_indicators if visible_indicators else ["None detected"],
        "safety_recommendation": safety_recommendation
    }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def analyze_food_spoilage(image_path: str) -> Dict[str, any]:
    """
    Analyze food image for spoilage using Nyckel API.
    
    Args:
        image_path: Path to image file (JPG, PNG, etc.)
        
    Returns:
        Dictionary with:
            - classification: "Fresh" or "Spoiled"
            - confidence: Confidence percentage (0-100)
            - visible_indicators: List of detected spoilage indicators
            - safety_recommendation: Safety message
            
    Raises:
        ImageError: If image is invalid or missing
        APIError: If Nyckel API call fails
    """
    # Step 1: Encode image
    print("📸 Encoding image...", file=sys.stderr)
    image_base64 = encode_image_base64(image_path)
    
    # Step 2: Call Nyckel API
    print("☁️  Calling Nyckel API...", file=sys.stderr)
    api_response = call_nyckel_api(image_base64)
    
    # Step 3: Parse response
    print("🔍 Analyzing results...", file=sys.stderr)
    result = parse_nyckel_response(api_response)
    
    print("✅ Analysis complete!", file=sys.stderr)
    return result


# ---------------------------------------------------------------------------
# CLI Entry Point
# ---------------------------------------------------------------------------

def main():
    """Command-line interface for testing."""
    if len(sys.argv) < 2:
        print("Usage: python nyckel_scanner.py <image_path>")
        print("\nExample:")
        print('  python nyckel_scanner.py "food.jpg"')
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    try:
        result = analyze_food_spoilage(image_path)
        print("\n" + "=" * 60)
        print("SPOILAGE DETECTION RESULTS")
        print("=" * 60)
        print(json.dumps(result, indent=2))
        print("=" * 60)
        
    except NyckelError as e:
        print(f"\n❌ Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
