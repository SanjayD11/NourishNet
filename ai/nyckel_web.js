/**
 * Nyckel Food Spoilage Detection - Frontend Integration
 * ======================================================
 * JavaScript module for integrating Nyckel API with web apps.
 */

const NyckelScanner = {
    // Configuration
    apiEndpoint: '/api/analyze-spoilage', // Your backend endpoint

    /**
     * Convert image file to base64 string
     * @param {File} file - Image file from input
     * @returns {Promise<string>} Base64 encoded image
     */
    async encodeImageBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]); // Remove data:image/...;base64, prefix
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    /**
     * Analyze food image for spoilage
     * @param {File} imageFile - Image file to analyze
     * @returns {Promise<Object>} Result object with classification, confidence, etc.
     */
    async analyzeFoodImage(imageFile) {
        try {
            // Validate file
            if (!imageFile) {
                throw new Error('No image file provided');
            }

            // Check file type
            if (!imageFile.type.startsWith('image/')) {
                throw new Error('File must be an image (JPG, PNG, etc.)');
            }

            // Encode to base64
            const imageBase64 = await this.encodeImageBase64(imageFile);

            // Call backend API
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: imageBase64
                })
            });

            // Handle HTTP errors
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Authentication failed. Check API credentials');
                } else if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Please wait and try again');
                } else if (response.status === 500) {
                    throw new Error('Server error. Please try again later');
                } else {
                    throw new Error(`HTTP error ${response.status}`);
                }
            }

            // Parse JSON response
            const result = await response.json();

            // Validate response structure
            if (!result.classification || result.confidence === undefined) {
                throw new Error('Invalid response format from server');
            }

            return result;

        } catch (error) {
            console.error('Error analyzing image:', error);
            throw error;
        }
    },

    /**
     * Display results in UI
     * @param {Object} result - Analysis result
     * @param {HTMLElement} container - Container element to display results
     */
    displayResults(result, container) {
        // Clear previous results
        container.innerHTML = '';

        // Create result card
        const resultCard = document.createElement('div');
        resultCard.className = 'result-card';

        // Classification badge
        const classification = document.createElement('div');
        classification.className = `classification ${result.classification.toLowerCase()}`;
        classification.innerHTML = `
      <h2>${result.classification === 'Fresh' ? '✅' : '🚫'} ${result.classification}</h2>
    `;
        resultCard.appendChild(classification);

        // Confidence meter
        const confidence = document.createElement('div');
        confidence.className = 'confidence';
        confidence.innerHTML = `
      <p><strong>Confidence:</strong> ${result.confidence}%</p>
      <div class="confidence-bar">
        <div class="confidence-fill" style="width: ${result.confidence}%"></div>
      </div>
      ${result.confidence < 70 ? '<p class="warning">⚠️ Low confidence - verify manually</p>' : ''}
    `;
        resultCard.appendChild(confidence);

        // Visible indicators
        const indicators = document.createElement('div');
        indicators.className = 'indicators';
        indicators.innerHTML = `
      <p><strong>Detected Indicators:</strong></p>
      <ul>
        ${result.visible_indicators.map(ind => `<li>${ind}</li>`).join('')}
      </ul>
    `;
        resultCard.appendChild(indicators);

        // Safety recommendation
        const safety = document.createElement('div');
        safety.className = `safety ${result.classification.toLowerCase()}`;
        safety.innerHTML = `
      <p><strong>Safety Recommendation:</strong></p>
      <p>${result.safety_recommendation}</p>
    `;
        resultCard.appendChild(safety);

        container.appendChild(resultCard);
    },

    /**
     * Display error message
     * @param {Error} error - Error object
     * @param {HTMLElement} container - Container element
     */
    displayError(error, container) {
        container.innerHTML = `
      <div class="error-message">
        <h3>❌ Error</h3>
        <p>${error.message}</p>
      </div>
    `;
    }
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NyckelScanner;
}
