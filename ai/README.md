# NourishNet — Food Spoilage Detection (Nyckel API)

Production-ready food spoilage detection using **Nyckel Food Spoilage Indicator API**.

## Features

✅ **100% Cloud-Based** — No local ML required  
✅ **Free Tier** — Nyckel free plan  
✅ **Structured JSON Output** — Easy integration  
✅ **Safety Warnings** — Confidence thresholds  
✅ **Error Handling** — Production-ready  

---

## Setup

### 1. Get Nyckel API Credentials

1. Go to [nyckel.com](https://www.nyckel.com)
2. Sign up for a free account
3. Create a new "Food Spoilage Indicator" function
4. Get your **API Key** and **Function ID**

### 2. Configure Environment

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
NYCKEL_API_KEY=your_api_key_here
NYCKEL_FUNCTION_ID=your_function_id_here
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Usage

### Python Backend

```python
from nyckel_scanner import analyze_food_spoilage

result = analyze_food_spoilage("path/to/food.jpg")
print(result)
```

**Output:**
```json
{
  "classification": "Fresh",
  "confidence": 92.5,
  "visible_indicators": ["None detected"],
  "safety_recommendation": "✅ Safe to eat. Food appears fresh..."
}
```

### Command Line

```bash
python nyckel_scanner.py food.jpg
```

### JavaScript Frontend

```javascript
const result = await NyckelScanner.analyzeFoodImage(imageFile);
console.log(result);
```

### Demo Interface

Open `demo.html` in your browser to test with a visual interface.

---

## Integration with NourishNet

### Backend (Flask Example)

```python
from flask import Flask, request, jsonify
from nyckel_scanner import analyze_food_spoilage
import base64
import io
from PIL import Image

app = Flask(__name__)

@app.route('/api/analyze-spoilage', methods=['POST'])
def analyze():
    try:
        data = request.json
        image_base64 = data.get('image')
        
        # Decode base64 to file
        image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data))
        
        # Save temporarily
        temp_path = 'temp_image.jpg'
        image.save(temp_path)
        
        # Analyze
        result = analyze_food_spoilage(temp_path)
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
```

### Frontend Integration

1. Include `nyckel_web.js` in your HTML
2. Set `NyckelScanner.apiEndpoint` to your backend URL
3. Use `NyckelScanner.analyzeFoodImage(file)` to analyze

---

## JSON Response Format

```json
{
  "classification": "Fresh" | "Spoiled",
  "confidence": 0-100,
  "visible_indicators": ["mold", "discoloration", ...],
  "safety_recommendation": "Safety message..."
}
```

### Safety Logic

- **Fresh** + High Confidence (≥70%): "✅ Safe to eat"
- **Fresh** + Low Confidence (<70%): "⚠️ Inspect carefully"
- **Spoiled**: "🚫 DO NOT EAT. Dispose immediately"

---

## Error Handling

All errors inherit from `NyckelError`:

- `ImageError` — Invalid/missing image
- `APIError` — Nyckel API failures

```python
try:
    result = analyze_food_spoilage("food.jpg")
except ImageError as e:
    print(f"Image error: {e}")
except APIError as e:
    print(f"API error: {e}")
```

---

## Files

| File | Purpose |
|------|---------|
| `nyckel_scanner.py` | Python backend integration |
| `nyckel_web.js` | JavaScript frontend module |
| `demo.html` | Demo interface |
| `requirements.txt` | Python dependencies |
| `.env.example` | Environment template |

---

## Production Deployment

1. **Backend**: Deploy Flask/FastAPI app with `nyckel_scanner.py`
2. **Frontend**: Use `nyckel_web.js` in your React/Vue/Vanilla app
3. **Security**: Keep `.env` out of version control (add to `.gitignore`)

---

## Troubleshooting

**"NYCKEL_API_KEY not found"**  
→ Create `.env` file with your API key

**"Authentication failed"**  
→ Verify your API key is correct

**"Function not found"**  
→ Check your `NYCKEL_FUNCTION_ID`

**"Rate limit exceeded"**  
→ Wait a few minutes (free tier limits)

---

## Support

- Nyckel Docs: [nyckel.com/docs](https://www.nyckel.com/docs)
- Issues: Check API response format and adjust parsing in `parse_nyckel_response()`
