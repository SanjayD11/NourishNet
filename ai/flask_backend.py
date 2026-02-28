"""
Flask Backend for NourishNet Food Safety AI Scanner
====================================================
API server integrating Pollinations.ai Vision scanner.

Usage:
    python flask_backend.py

Then open http://localhost:5000 in browser.
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import base64
import io
import os
from PIL import Image
from pollinations_scanner import scan_food_base64, scan_food_image, ScannerError

app = Flask(__name__, static_folder=".")
CORS(app)

# Temporary directory for uploaded images
TEMP_DIR = "temp_uploads"
os.makedirs(TEMP_DIR, exist_ok=True)


@app.route("/")
def index():
    """Serve the demo page."""
    return send_from_directory(".", "demo.html")


@app.route("/<path:filename>")
def serve_static(filename):
    """Serve static files (JS, CSS, etc.)."""
    return send_from_directory(".", filename)


@app.route("/api/scan-food", methods=["POST"])
def scan_food():
    """
    API endpoint to analyze food image for safety.

    Expects JSON:
        {"image": "base64_encoded_image_string"}

    Returns JSON:
        {
          "food_identified": "...",
          "expiry_date_visible": "Yes / No",
          "detected_expiry_text": "...",
          "visible_issues": [...],
          "risk_level": "LOW / MEDIUM / HIGH",
          "confidence": "Low / Medium / High",
          "user_message": "..."
        }
    """
    try:
        data = request.json
        if not data or "image" not in data:
            return jsonify({"error": "No image data provided"}), 400

        image_base64 = data["image"]

        # Strip data URI prefix if present
        if "," in image_base64 and image_base64.startswith("data:"):
            image_base64 = image_base64.split(",", 1)[1]

        # Validate the base64 data
        try:
            image_data = base64.b64decode(image_base64)
            img = Image.open(io.BytesIO(image_data))
            mime_type = Image.MIME.get(img.format, "image/jpeg")
        except Exception as e:
            return jsonify({"error": f"Invalid image data: {e}"}), 400

        # Analyze with Pollinations AI
        result = scan_food_base64(image_base64, mime_type)

        return jsonify(result)

    except ScannerError as e:
        return jsonify({"error": str(e)}), 500

    except Exception as e:
        return jsonify({"error": f"Unexpected error: {e}"}), 500


@app.route("/api/analyze-spoilage", methods=["POST"])
def analyze_spoilage_legacy():
    """Legacy endpoint — redirects to new scanner."""
    return scan_food()


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok", "service": "NourishNet Food Safety AI Scanner"})


if __name__ == "__main__":
    print("=" * 60)
    print("🍎 NourishNet Food Safety AI Scanner")
    print("=" * 60)
    print("\n  Server:   http://localhost:5000")
    print("  API:      http://localhost:5000/api/scan-food")
    print("  Health:   http://localhost:5000/health")
    print("\n  Open http://localhost:5000 in your browser to test!")
    print("\n  Press Ctrl+C to stop")
    print("=" * 60)

    app.run(debug=True, port=5000)
