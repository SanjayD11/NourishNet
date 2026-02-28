/**
 * NourishNet Food Safety AI Scanner — Frontend Module
 * =====================================================
 * JavaScript module for image upload, API interaction,
 * and rich result display with risk-level indicators.
 */

const FoodScanner = {
    apiEndpoint: "/api/scan-food",

    /**
     * Convert image file to base64 string (without data URI prefix)
     */
    async encodeImageBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    /**
     * Scan a food image via the backend API
     * @param {File} imageFile
     * @returns {Promise<Object>} Structured food safety JSON
     */
    async scanFoodImage(imageFile) {
        if (!imageFile) throw new Error("No image file provided");
        if (!imageFile.type.startsWith("image/"))
            throw new Error("File must be an image (JPG, PNG, etc.)");

        const imageBase64 = await this.encodeImageBase64(imageFile);

        const response = await fetch(this.apiEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: imageBase64 }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || `Server error ${response.status}`);
        }

        return await response.json();
    },

    /**
     * Render the scan result into the UI
     * @param {Object} result — the structured JSON from the API
     * @param {HTMLElement} container
     */
    displayResults(result, container) {
        container.innerHTML = "";

        const riskConfig = {
            LOW: {
                icon: "✅",
                color: "#10b981",
                bg: "rgba(16,185,129,0.08)",
                border: "rgba(16,185,129,0.25)",
                label: "Low Risk",
            },
            MEDIUM: {
                icon: "⚠️",
                color: "#f59e0b",
                bg: "rgba(245,158,11,0.08)",
                border: "rgba(245,158,11,0.25)",
                label: "Medium Risk",
            },
            HIGH: {
                icon: "🚫",
                color: "#ef4444",
                bg: "rgba(239,68,68,0.08)",
                border: "rgba(239,68,68,0.25)",
                label: "High Risk",
            },
        };

        const risk = riskConfig[result.risk_level] || riskConfig.MEDIUM;

        const card = document.createElement("div");
        card.className = "result-card fade-in";
        card.innerHTML = `
      <!-- Risk Badge -->
      <div class="risk-badge" style="background:${risk.bg};border:1px solid ${risk.border};">
        <span class="risk-icon">${risk.icon}</span>
        <div>
          <div class="risk-label" style="color:${risk.color}">${risk.label}</div>
          <div class="risk-sublabel">Confidence: ${result.confidence}</div>
        </div>
      </div>

      <!-- Food Identified -->
      <div class="result-field">
        <div class="field-label">🍽️ Food Identified</div>
        <div class="field-value">${result.food_identified}</div>
      </div>

      <!-- Expiry Info -->
      <div class="result-field">
        <div class="field-label">📅 Expiry Date Visible</div>
        <div class="field-value">${result.expiry_date_visible}${result.expiry_date_visible === "Yes" ? " — " + result.detected_expiry_text : ""}</div>
      </div>

      <!-- Visible Issues -->
      <div class="result-field">
        <div class="field-label">🔍 Visible Issues</div>
        <div class="field-value issues-list">
          ${result.visible_issues.length === 0
                ? '<span class="no-issues">None detected</span>'
                : result.visible_issues
                    .map(
                        (issue) =>
                            `<span class="issue-tag" style="background:${risk.bg};color:${risk.color};border:1px solid ${risk.border}">${issue}</span>`
                    )
                    .join("")
            }
        </div>
      </div>

      <!-- User Message -->
      <div class="user-message" style="background:${risk.bg};border-left:4px solid ${risk.color}">
        <p>${result.user_message}</p>
      </div>

      <!-- Raw JSON Toggle -->
      <details class="json-toggle">
        <summary>View Raw JSON</summary>
        <pre><code>${JSON.stringify(result, null, 2)}</code></pre>
      </details>
    `;

        container.appendChild(card);
    },

    /**
     * Show error in the container
     */
    displayError(error, container) {
        container.innerHTML = `
      <div class="result-card error-card fade-in">
        <div class="risk-badge" style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);">
          <span class="risk-icon">❌</span>
          <div>
            <div class="risk-label" style="color:#ef4444">Error</div>
            <div class="risk-sublabel">Analysis failed</div>
          </div>
        </div>
        <p style="color:#fca5a5;margin-top:16px;line-height:1.6">${error.message}</p>
      </div>
    `;
    },
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = FoodScanner;
}
