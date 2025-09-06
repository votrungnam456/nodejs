class ImportManager {
  constructor() {
    this.currentFile = null;
    this.jsonData = null;
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.supportedTypes = ["application/json", "text/json"];

    this.init();
  }

  init() {
    this.bindEvents();
    this.setupDragAndDrop();
  }

  bindEvents() {
    // File input change
    const fileInput = document.getElementById("fileInput");
    fileInput.addEventListener("change", (e) => {
      this.handleFileSelect(e.target.files[0]);
    });

    // Remove file button
    const removeFileBtn = document.getElementById("removeFile");
    removeFileBtn.addEventListener("click", () => {
      this.removeFile();
    });

    // Import button
    const importBtn = document.getElementById("importBtn");
    importBtn.addEventListener("click", () => {
      this.importData();
    });

    // Preview button
    const previewBtn = document.getElementById("previewBtn");
    previewBtn.addEventListener("click", () => {
      this.previewImport();
    });

    // Clear button
    const clearBtn = document.getElementById("clearBtn");
    clearBtn.addEventListener("click", () => {
      this.clearAll();
    });

    // Close results
    const closeResultsBtn = document.getElementById("closeResults");
    closeResultsBtn.addEventListener("click", () => {
      this.closeResults();
    });

    // Error modal close
    const closeModalBtn = document.querySelector(".close-modal");
    closeModalBtn.addEventListener("click", () => {
      this.closeErrorModal();
    });

    // Close modal with Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeErrorModal();
        this.closeResults();
      }
    });
  }

  setupDragAndDrop() {
    const uploadArea = document.getElementById("uploadArea");
    const fileInput = document.getElementById("fileInput");

    // Prevent default drag behaviors
    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      uploadArea.addEventListener(eventName, preventDefaults, false);
      document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop area when item is dragged over it
    ["dragenter", "dragover"].forEach((eventName) => {
      uploadArea.addEventListener(eventName, highlight, false);
    });

    ["dragleave", "drop"].forEach((eventName) => {
      uploadArea.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    uploadArea.addEventListener("drop", (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      this.handleFileSelect(files[0]);
    });

    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }

    function highlight(e) {
      uploadArea.classList.add("dragover");
    }

    function unhighlight(e) {
      uploadArea.classList.remove("dragover");
    }
  }

  async handleFileSelect(file) {
    if (!file) return;

    // Validate file type
    if (
      !this.supportedTypes.includes(file.type) &&
      !file.name.endsWith(".json")
    ) {
      this.showError("Invalid file type. Please select a JSON file.");
      return;
    }

    // Validate file size
    if (file.size > this.maxFileSize) {
      this.showError(
        `File size exceeds the maximum limit of ${this.formatFileSize(
          this.maxFileSize
        )}.`
      );
      return;
    }

    this.currentFile = file;
    this.displayFileInfo(file);

    try {
      this.jsonData = await this.readFile(file);
      this.validateJsonData(this.jsonData);
      this.displayJsonPreview(this.jsonData);
      this.enableButtons();
    } catch (error) {
      this.showError("Failed to read file: " + error.message);
      this.removeFile();
    }
  }

  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          resolve(jsonData);
        } catch (error) {
          reject(new Error("Invalid JSON format"));
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      reader.readAsText(file);
    });
  }

  validateJsonData(data) {
    if (!data || typeof data !== "object") {
      throw new Error("JSON data must be an object or array");
    }

    // Additional validation can be added here based on data structure
    if (Array.isArray(data) && data.length === 0) {
      throw new Error("JSON array cannot be empty");
    }
  }

  displayFileInfo(file) {
    const fileName = document.getElementById("fileName");
    const fileSize = document.getElementById("fileSize");

    fileName.textContent = file.name;
    fileSize.textContent = this.formatFileSize(file.size);

    document.getElementById("filePreview").classList.remove("hidden");
  }

  displayJsonPreview(data) {
    const jsonContent = document.getElementById("jsonContent");
    const formattedJson = JSON.stringify(data, null, 2);

    // Limit preview to first 1000 characters
    const preview =
      formattedJson.length > 1000
        ? formattedJson.substring(0, 1000) + "\n... (truncated)"
        : formattedJson;

    jsonContent.textContent = preview;
  }

  enableButtons() {
    document.getElementById("importBtn").disabled = false;
    document.getElementById("previewBtn").disabled = false;
  }

  removeFile() {
    this.currentFile = null;
    this.jsonData = null;

    document.getElementById("fileInput").value = "";
    document.getElementById("filePreview").classList.add("hidden");
    document.getElementById("importBtn").disabled = true;
    document.getElementById("previewBtn").disabled = true;
  }

  clearAll() {
    this.removeFile();
    this.closeResults();

    // Reset form options
    document.getElementById("dataType").value = "auto";
    document.getElementById("importMode").value = "append";
    document.getElementById("validateData").checked = true;
    document.getElementById("skipDuplicates").checked = true;
  }

  async importData() {
    if (!this.jsonData) {
      this.showError("No file selected for import.");
      return;
    }

    this.showLoading(true, "Uploading file to server...");

    try {
      const formData = new FormData();
      formData.append("file", this.currentFile);

      console.log("Uploading file:", this.currentFile.name);
      console.log("File size:", this.currentFile.size);

      // Determine the API endpoint based on data type
      const dataType = document.getElementById("dataType").value;
      let apiEndpoint = "/api/products"; // default

      if (dataType === "categories") {
        apiEndpoint = "/api/categories/import";
      } else if (dataType === "products") {
        apiEndpoint = "/api/products";
      } else if (dataType === "auto") {
        // Auto-detect based on file content
        const detectedType = this.detectDataType(this.jsonData);
        if (detectedType === "categories") {
          apiEndpoint = "/api/categories/import";
        } else {
          apiEndpoint = "/api/products";
        }
      }

      const res = await fetch(apiEndpoint, {
        method: "POST",
        body: formData,
        // Add timeout and better error handling
        signal: AbortSignal.timeout(300000), // 5 minutes timeout
      });

      if (res.status === 200) {
        const data = await res.json();
        console.log("Server response:", data);

        this.showLoading(false);

        // Display success results
        const results = {
          success: true,
          totalItems:
            (data.data.successCount || 0) + (data.data.failedCount || 0),
          processedItems: data.data.successCount || 0,
          skippedItems: data.data.failedCount || 0,
          errors: [],
          dataType:
            dataType === "auto" ? this.detectDataType(this.jsonData) : dataType,
          importMode: "upload",
          timestamp: new Date().toISOString(),
          fileName: this.currentFile.name,
          fileSize: this.formatFileSize(this.currentFile.size),
        };
        this.displayResults(results);
      } else if (res.status === 408) {
        throw new Error(
          "Request timeout - the operation took too long. Please try with a smaller file."
        );
      } else {
        const errorData = await res.json();
        console.log(errorData);
        throw new Error(errorData.message || "Upload failed");
      }
    } catch (error) {
      this.showLoading(false);
      if (error.name === "AbortError") {
        this.showError(
          "Upload timeout: The operation took too long. Please try with a smaller file or check your connection."
        );
      } else if (
        error.name === "TypeError" &&
        error.message.includes("fetch")
      ) {
        this.showError(
          "Connection refused: Server might be down or overloaded. Please try again later."
        );
      } else {
        this.showError("Upload failed: " + error.message);
      }
      console.error("Upload error details:", error);
    }
  }

  async previewImport() {
    if (!this.jsonData) {
      this.showError("No file selected for preview.");
      return;
    }

    this.showLoading(true, "Generating preview...");

    try {
      await this.delay(1000);

      const options = this.getImportOptions();
      const preview = this.generatePreview(this.jsonData, options);

      this.showLoading(false);
      this.displayPreview(preview);
    } catch (error) {
      this.showLoading(false);
      this.showError("Preview failed: " + error.message);
    }
  }

  getImportOptions() {
    return {
      dataType: document.getElementById("dataType").value,
      importMode: document.getElementById("importMode").value,
      validateData: document.getElementById("validateData").checked,
      skipDuplicates: document.getElementById("skipDuplicates").checked,
    };
  }

  processImport(data, options) {
    // const results = {
    //   success: true,
    //   totalItems: 0,
    //   processedItems: 0,
    //   skippedItems: 0,
    //   errors: [],
    //   dataType: this.detectDataType(data),
    //   importMode: options.importMode,
    //   timestamp: new Date().toISOString(),
    // };
    const results = [];
    console.log(data);
    console.log(results);
    for (const item of data) {
      if (item._source) {
        // const product = new Product(item.source);
        // await product.save();
        results.push(item._source);
      }
    }
    console.log(results);
    // if (Array.isArray(data)) {
    //   results.totalItems = data.length;
    //   results.processedItems = Math.floor(data.length * 0.85); // Simulate processing
    //   results.skippedItems = data.length - results.processedItems;
    // } else if (typeof data === "object") {
    //   results.totalItems = Object.keys(data).length;
    //   results.processedItems = Math.floor(results.totalItems * 0.9);
    //   results.skippedItems = results.totalItems - results.processedItems;
    // }

    // Simulate some errors
    // if (Math.random() < 0.1) {
    //   results.errors.push("Some items had invalid data format");
    // }

    return results;
  }

  generatePreview(data, options) {
    const preview = {
      dataType: this.detectDataType(data),
      structure: this.analyzeStructure(data),
      estimatedItems: this.countItems(data),
      sampleData: this.getSampleData(data),
      warnings: [],
    };

    if (preview.estimatedItems > 1000) {
      preview.warnings.push(
        "Large dataset detected. Import may take longer than usual."
      );
    }

    return preview;
  }

  detectDataType(data) {
    if (Array.isArray(data)) {
      if (data.length > 0) {
        const firstItem = data[0];

        // Check for category structure (has _source with name and slug)
        if (
          firstItem._source &&
          firstItem._source.name &&
          firstItem._source.slug
        ) {
          return "categories";
        }

        // Check for product structure
        if (firstItem.name && firstItem.price) {
          return "products";
        }

        // Check for user structure
        if (firstItem.username && firstItem.email) {
          return "users";
        }

        // Check for product structure with _source
        if (
          firstItem._source &&
          (firstItem._source.title || firstItem._source.name) &&
          firstItem._source.sku
        ) {
          return "products";
        }
      }
      return "array";
    } else if (typeof data === "object") {
      if (data.products) return "products";
      if (data.categories) return "categories";
      if (data.users) return "users";
      return "object";
    }
    return "unknown";
  }

  analyzeStructure(data) {
    if (Array.isArray(data) && data.length > 0) {
      return {
        type: "array",
        length: data.length,
        sampleKeys: Object.keys(data[0] || {}),
      };
    } else if (typeof data === "object") {
      return {
        type: "object",
        keys: Object.keys(data),
        hasNestedObjects: Object.values(data).some(
          (v) => typeof v === "object"
        ),
      };
    }
    return { type: "unknown" };
  }

  countItems(data) {
    if (Array.isArray(data)) {
      return data.length;
    } else if (typeof data === "object") {
      return Object.keys(data).length;
    }
    return 0;
  }

  getSampleData(data) {
    if (Array.isArray(data) && data.length > 0) {
      return data.slice(0, 3);
    } else if (typeof data === "object") {
      const keys = Object.keys(data);
      const sample = {};
      keys.slice(0, 3).forEach((key) => {
        sample[key] = data[key];
      });
      return sample;
    }
    return null;
  }

  displayResults(results) {
    const resultsSection = document.getElementById("resultsSection");
    const resultsContent = document.getElementById("resultsContent");

    const successIcon = results.success ? "✅" : "❌";
    const statusClass = results.success ? "success" : "error";

    resultsContent.innerHTML = `
      <div class="result-summary ${statusClass}">
        <h4>${successIcon} File Upload ${
      results.success ? "Completed" : "Failed"
    }</h4>
        <div class="result-stats">
          <div class="stat-item">
            <span class="stat-label">File Name:</span>
            <span class="stat-value">${results.fileName || "N/A"}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">File Size:</span>
            <span class="stat-value">${results.fileSize || "N/A"}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total Items:</span>
            <span class="stat-value">${results.totalItems}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Processed:</span>
            <span class="stat-value success">${results.processedItems}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Skipped:</span>
            <span class="stat-value warning">${results.skippedItems}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Data Type:</span>
            <span class="stat-value">${results.dataType}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Upload Mode:</span>
            <span class="stat-value">${results.importMode}</span>
          </div>
        </div>
        ${
          results.errors.length > 0
            ? `
          <div class="result-errors">
            <h5>⚠️ Errors/Warnings:</h5>
            <ul>
              ${results.errors.map((error) => `<li>${error}</li>`).join("")}
            </ul>
          </div>
        `
            : ""
        }
        <div class="result-timestamp">
          <small>Uploaded at: ${new Date(
            results.timestamp
          ).toLocaleString()}</small>
        </div>
      </div>
    `;

    resultsSection.classList.remove("hidden");
  }

  displayPreview(preview) {
    const resultsSection = document.getElementById("resultsSection");
    const resultsContent = document.getElementById("resultsContent");

    resultsContent.innerHTML = `
      <div class="preview-summary">
        <h4>📊 Import Preview</h4>
        <div class="preview-stats">
          <div class="stat-item">
            <span class="stat-label">Data Type:</span>
            <span class="stat-value">${preview.dataType}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Structure:</span>
            <span class="stat-value">${preview.structure.type}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Estimated Items:</span>
            <span class="stat-value">${preview.estimatedItems}</span>
          </div>
        </div>
        ${
          preview.warnings.length > 0
            ? `
          <div class="preview-warnings">
            <h5>⚠️ Warnings:</h5>
            <ul>
              ${preview.warnings
                .map((warning) => `<li>${warning}</li>`)
                .join("")}
            </ul>
          </div>
        `
            : ""
        }
        <div class="preview-sample">
          <h5>📋 Sample Data:</h5>
          <pre class="sample-json">${JSON.stringify(
            preview.sampleData,
            null,
            2
          )}</pre>
        </div>
      </div>
    `;

    resultsSection.classList.remove("hidden");
  }

  closeResults() {
    document.getElementById("resultsSection").classList.add("hidden");
  }

  showLoading(show, message = "Processing...") {
    const overlay = document.getElementById("loadingOverlay");
    const loadingMessage = document.getElementById("loadingMessage");

    if (show) {
      loadingMessage.textContent = message;
      overlay.classList.remove("hidden");
    } else {
      overlay.classList.add("hidden");
    }
  }

  showError(message) {
    const modal = document.getElementById("errorModal");
    const errorContent = document.getElementById("errorContent");

    errorContent.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle" style="color: #dc3545; font-size: 2rem; margin-bottom: 1rem;"></i>
        <p>${message}</p>
      </div>
    `;

    modal.classList.remove("hidden");
  }

  closeErrorModal() {
    document.getElementById("errorModal").classList.add("hidden");
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Initialize the import manager when the page loads
let importManager;
document.addEventListener("DOMContentLoaded", () => {
  importManager = new ImportManager();
});

// Add some CSS for the results display
const style = document.createElement("style");
style.textContent = `
  .result-summary, .preview-summary {
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }
  
  .result-summary.success {
    background: #d4edda;
    border: 1px solid #c3e6cb;
    color: #155724;
  }
  
  .result-summary.error {
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    color: #721c24;
  }
  
  .result-stats, .preview-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin: 1rem 0;
  }
  
  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background: rgba(255,255,255,0.5);
    border-radius: 5px;
  }
  
  .stat-label {
    font-weight: bold;
  }
  
  .stat-value.success {
    color: #28a745;
    font-weight: bold;
  }
  
  .stat-value.warning {
    color: #ffc107;
    font-weight: bold;
  }
  
  .result-errors, .preview-warnings {
    margin: 1rem 0;
    padding: 1rem;
    background: rgba(255,193,7,0.1);
    border: 1px solid #ffeaa7;
    border-radius: 5px;
  }
  
  .result-errors h5, .preview-warnings h5 {
    margin-bottom: 0.5rem;
    color: #856404;
  }
  
  .result-errors ul, .preview-warnings ul {
    margin: 0;
    padding-left: 1.5rem;
  }
  
  .result-timestamp {
    text-align: center;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(0,0,0,0.1);
  }
  
  .preview-sample {
    margin: 1rem 0;
  }
  
  .preview-sample h5 {
    margin-bottom: 0.5rem;
  }
  
  .sample-json {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 5px;
    font-size: 0.8rem;
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #e9ecef;
  }
  
  .error-message {
    text-align: center;
  }
  
  .error-message p {
    margin: 0;
    font-size: 1.1rem;
  }
`;
document.head.appendChild(style);
