class EditProductManager {
  constructor() {
    this.productId = window.PRODUCT_ID;
    this.isCreate = !this.productId || this.productId === "new";
    this.originalData = null;
    this.isLoading = false;

    this.init();
  }

  async init() {
    this.bindEvents();
    await this.loadCategories();
    if (this.isCreate) {
      this.showLoading(false);
      this.prepareCreateUI();
    } else {
      await this.loadProduct();
    }
  }

  bindEvents() {
    // Form submission
    const form = document.getElementById("editProductForm");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }

    // Image preview
    const imageInput = document.getElementById("image");
    if (imageInput) {
      imageInput.addEventListener("input", () => {
        this.updateImagePreview();
      });
    }

    // Modal close events
    const closeButtons = document.querySelectorAll(".close-modal");
    closeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        this.closeModal();
      });
    });

    // Close modal on backdrop click
    const modals = document.querySelectorAll(".modal");
    modals.forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.closeModal();
        }
      });
    });

    // Close modal with Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeModal();
      }
    });

    // Form validation on input
    const inputs = document.querySelectorAll(
      ".form-input, .form-select, .form-textarea"
    );
    inputs.forEach((input) => {
      input.addEventListener("blur", () => {
        this.validateField(input);
      });
    });
  }

  async loadProduct() {
    if (!this.productId) {
      this.showError("Product ID not found");
      return;
    }

    this.showLoading(true);
    this.hideError();

    try {
      const response = await fetch(`${API.PRODUCTS.BASE}/${this.productId}`);
      const data = await response.json();

      if (data.success) {
        this.originalData = data.data;
        this.populateForm(data.data);
        this.updateProductId(data.data._id);
        this.showForm();
      } else {
        this.showError(data.message || "Failed to load product");
      }
    } catch (error) {
      console.error("Error loading product:", error);
      this.showError("Failed to load product information");
    } finally {
      this.showLoading(false);
    }
  }

  populateForm(product) {
    // Basic information
    this.setFieldValue("title", product.title || "");
    this.setFieldValue("sku", product.sku || "");
    this.setFieldValue("ean", product.ean || "");
    this.setFieldValue("categorySelect", product.categories?.main || "");
    this.setFieldValue("url", product.url || "");

    // Stock information
    this.setFieldValue("stock", product.stock || 999);
    this.setFieldValue("stockstatus", product.stockstatus || 1);
    this.setFieldValue("stock_flag", product.stock_flag || 1);

    // Product status
    const activeRadio = document.querySelector(
      `input[name="active"][value="${product.active}"]`
    );
    if (activeRadio) {
      activeRadio.checked = true;
    }

    this.setFieldValue("is_variant", product.is_variant || false, "checkbox");

    // Image
    this.setFieldValue("image", product.image || "");
    this.updateImagePreview();

    // Descriptions
    this.setFieldValue("description", product.description || "");
    this.setFieldValue("description_long", product.description_long || "");
  }

  setFieldValue(fieldName, value, type = "text") {
    const field = document.getElementById(fieldName);
    if (!field) return;

    if (type === "checkbox") {
      field.checked = Boolean(value);
    } else {
      field.value = value || "";
    }
  }

  updateProductId(productId) {
    const productIdElement = document.getElementById("productId");
    if (productIdElement) {
      productIdElement.textContent = productId;
    }
  }

  updateImagePreview() {
    const imageInput = document.getElementById("image");
    const previewContainer = document.getElementById("imagePreview");

    if (!imageInput || !previewContainer) return;

    const imageUrl = imageInput.value.trim();

    if (imageUrl) {
      previewContainer.innerHTML = `
        <img src="${imageUrl}" alt="Product preview" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div style="display: none; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
          <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #dc3545; margin-bottom: 0.5rem;"></i>
          <span style="color: #dc3545; font-size: 0.9rem;">Failed to load image</span>
        </div>
      `;
      previewContainer.classList.add("has-image");
    } else {
      previewContainer.innerHTML = `
        <i class="fas fa-image preview-placeholder"></i>
        <span class="preview-text">No image selected</span>
      `;
      previewContainer.classList.remove("has-image");
    }
  }

  validateField(field) {
    const fieldName = field.name;
    const value = field.value.trim();
    const errorElement = document.getElementById(`${fieldName}Error`);

    // Remove previous error states
    field.classList.remove("error", "success");
    if (errorElement) {
      errorElement.classList.remove("show");
      errorElement.textContent = "";
    }

    let isValid = true;
    let errorMessage = "";

    // Required field validation
    if (field.hasAttribute("required") && !value) {
      isValid = false;
      errorMessage = "This field is required";
    }

    // URL validation
    if (fieldName === "url" || fieldName === "image") {
      if (value && !this.isValidUrl(value)) {
        isValid = false;
        errorMessage = "Please enter a valid URL";
      }
    }

    // Number validation
    if (fieldName === "stock") {
      const numValue = parseInt(value);
      if (value && (isNaN(numValue) || numValue < 0)) {
        isValid = false;
        errorMessage = "Please enter a valid positive number";
      }
    }

    // Set validation state
    if (isValid) {
      field.classList.add("success");
    } else {
      field.classList.add("error");
      if (errorElement) {
        errorElement.textContent = errorMessage;
        errorElement.classList.add("show");
      }
    }

    return isValid;
  }

  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  validateForm() {
    const fields = document.querySelectorAll(
      ".form-input, .form-select, .form-textarea"
    );
    let isValid = true;

    fields.forEach((field) => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });

    return isValid;
  }

  async handleSubmit() {
    if (this.isLoading) return;

    if (!this.validateForm()) {
      this.showError("Please fix the errors in the form");
      return;
    }

    this.isLoading = true;
    this.setSaveButtonLoading(true);

    try {
      const formData = this.getFormData();
      const endpoint = this.isCreate
        ? API.PRODUCTS.NEW
        : `${API.PRODUCTS.BASE}/${this.productId}`;
      const method = this.isCreate ? "POST" : "PUT";
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        this.showSuccessModal();
      } else {
        this.showErrorModal(data.message || "Failed to update product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      this.showErrorModal("Failed to update product");
    } finally {
      this.isLoading = false;
      this.setSaveButtonLoading(false);
    }
  }

  getFormData() {
    const formData = {
      title: document.getElementById("title").value.trim(),
      sku: document.getElementById("sku").value.trim(),
      ean: document.getElementById("ean").value.trim(),
      url: document.getElementById("url").value.trim(),
      image: document.getElementById("image").value.trim(),
      description: document.getElementById("description").value.trim(),
      description_long: document
        .getElementById("description_long")
        .value.trim(),
      stock: parseInt(document.getElementById("stock").value) || 999,
      stockstatus: parseInt(document.getElementById("stockstatus").value) || 1,
      stock_flag: parseInt(document.getElementById("stock_flag").value) || 1,
      is_variant: document.getElementById("is_variant").checked,
      active:
        document.querySelector('input[name="active"]:checked')?.value ===
        "true",
      categories: {
        main: document.getElementById("categorySelect").value.trim(),
        all: document.getElementById("categorySelect").value.trim()
          ? [document.getElementById("categorySelect").value.trim()]
          : [],
      },
    };

    return formData;
  }

  async loadCategories() {
    try {
      const select = document.getElementById("categorySelect");
      if (!select) return;
      const res = await fetch(`${API.CATEGORIES.BASE}?limit=1000`);
      const data = await res.json();
      const categories = Array.isArray(data.data) ? data.data : [];
      // Clear keep placeholder
      select.innerHTML = '<option value="">Tất cả danh mục</option>';
      categories.forEach((c) => {
        const name = c.name || c.slug || "";
        if (!name) return;
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
      });
    } catch (_) {
      // ignore
    }
  }

  setSaveButtonLoading(loading) {
    const saveBtn = document.getElementById("saveBtn");
    if (saveBtn) {
      if (loading) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
      } else {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
      }
    }
  }

  resetForm() {
    if (this.originalData) {
      this.populateForm(this.originalData);
    }

    // Clear all validation states
    const fields = document.querySelectorAll(
      ".form-input, .form-select, .form-textarea"
    );
    fields.forEach((field) => {
      field.classList.remove("error", "success");
    });

    const errorElements = document.querySelectorAll(".form-error");
    errorElements.forEach((error) => {
      error.classList.remove("show");
      error.textContent = "";
    });

    this.hideError();
  }

  showLoading(show) {
    const loadingSpinner = document.getElementById("loadingSpinner");
    const editForm = document.getElementById("editProductForm");

    if (show) {
      loadingSpinner.classList.remove("hidden");
      if (editForm) editForm.classList.add("hidden");
    } else {
      loadingSpinner.classList.add("hidden");
    }
  }

  showForm() {
    const editForm = document.getElementById("editProductForm");
    if (editForm) {
      editForm.classList.remove("hidden");
    }
  }

  showError(message) {
    const errorMessage = document.getElementById("errorMessage");
    const errorText = document.getElementById("errorText");

    if (errorMessage && errorText) {
      errorText.textContent = message;
      errorMessage.classList.remove("hidden");
    }
  }

  hideError() {
    const errorMessage = document.getElementById("errorMessage");
    if (errorMessage) {
      errorMessage.classList.add("hidden");
    }
  }

  showSuccessModal() {
    const modal = document.getElementById("successModal");
    if (modal) {
      const body = modal.querySelector(".modal-body p");
      if (body && this.isCreate) {
        body.textContent = "Product created successfully!";
      }
      modal.classList.remove("hidden");
    }
  }

  prepareCreateUI() {
    // Adjust UI for create mode
    const titleEl = document.querySelector(".page-title");
    if (titleEl) {
      titleEl.innerHTML = '<i class="fas fa-plus-circle"></i> Create Product';
    }
    const productIdEl = document.getElementById("productId");
    if (productIdEl) productIdEl.textContent = "New";
    const saveBtn = document.getElementById("saveBtn");
    if (saveBtn)
      saveBtn.innerHTML = '<i class="fas fa-save"></i> Create Product';
    // Show form immediately
    this.showForm();
  }

  showErrorModal(message) {
    const modal = document.getElementById("errorModal");
    const errorText = document.getElementById("errorModalText");

    if (modal && errorText) {
      errorText.textContent = message;
      modal.classList.remove("hidden");
    }
  }

  closeModal() {
    const modals = document.querySelectorAll(".modal");
    modals.forEach((modal) => {
      modal.classList.add("hidden");
    });
  }

  closeErrorModal() {
    const modal = document.getElementById("errorModal");
    if (modal) {
      modal.classList.add("hidden");
    }
  }
}

// Global functions for inline event handlers
function goBack() {
  window.location.href = "/products";
}

function resetForm() {
  if (window.editProductManager) {
    window.editProductManager.resetForm();
  }
}

function closeErrorModal() {
  if (window.editProductManager) {
    window.editProductManager.closeErrorModal();
  }
}

// Initialize the edit product manager when the page loads
let editProductManager;
document.addEventListener("DOMContentLoaded", () => {
  editProductManager = new EditProductManager();
  window.editProductManager = editProductManager; // Make it globally accessible
});
