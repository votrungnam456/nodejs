class ProductManager {
  constructor() {
    this.currentPage = 1;
    this.productsPerPage = 20;
    this.currentFilters = {
      sortBy: "createdAt",
      sortOrder: "desc",
    };

    this.init();
  }

  init() {
    this.bindEvents();
    this.loadProducts();
  }

  bindEvents() {
    // Pagination
    const prevPageBtn = document.getElementById("prevPage");
    const nextPageBtn = document.getElementById("nextPage");

    if (prevPageBtn) {
      prevPageBtn.addEventListener("click", () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.loadProducts();
        }
      });
    }

    if (nextPageBtn) {
      nextPageBtn.addEventListener("click", () => {
        this.currentPage++;
        this.loadProducts();
      });
    }

    // Sorting
    const sortableHeaders = document.querySelectorAll(".sortable");
    sortableHeaders.forEach((header) => {
      header.addEventListener("click", () => {
        this.handleSort(header);
      });
    });

    // Modal functionality
    const modal = document.getElementById("productModal");
    const closeModal = document.querySelector(".close-modal");

    if (closeModal) {
      closeModal.addEventListener("click", () => {
        this.closeModal();
      });
    }

    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.closeModal();
        }
      });
    }

    // Close modal with Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeModal();
      }
    });
  }

  async loadProducts() {
    this.showLoading(true);

    try {
      const queryParams = new URLSearchParams({
        page: this.currentPage,
        limit: this.productsPerPage,
        ...this.currentFilters,
      });

      const response = await fetch(`/api/products?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        this.displayProducts(data.data);
        this.updatePagination(data.pagination);
        this.updateProductCount(data.pagination.totalProducts);
      } else {
        this.showError("Failed to load products");
      }
    } catch (error) {
      console.error("Error loading products:", error);
      this.showError("Failed to load products");
    } finally {
      this.showLoading(false);
    }
  }

  displayProducts(products) {
    const productsTableBody = document.getElementById("productsTableBody");
    const noProducts = document.getElementById("noProducts");

    if (products.length === 0) {
      productsTableBody.innerHTML = "";
      noProducts.classList.remove("hidden");
      return;
    }

    noProducts.classList.add("hidden");

    productsTableBody.innerHTML = products
      .map((product) => this.createProductRow(product))
      .join("");
  }

  createProductRow(product) {
    const imageHtml =
      product.image && product.image !== "/assets/images/default-product.png"
        ? `<img src="${product.image}" alt="${
            product.title || "Product"
          }" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
         <i class="fas fa-image" style="display: none;"></i>`
        : '<i class="fas fa-image"></i>';

    const statusClass = product.active ? "active" : "inactive";
    const statusText = product.active ? "Hoạt động" : "Không hoạt động";

    const stockClass = product.stock > 0 ? "in-stock" : "out-of-stock";
    const stockText = product.stock > 0 ? product.stock : "Hết hàng";

    const categoryText = product.categories?.main || "Chưa phân loại";
    const descriptionText =
      product.description || product.description_long || "Không có mô tả";
    const createdAt = new Date(product.createdAt).toLocaleDateString("vi-VN");

    return `
      <tr data-product-id="${product._id}">
        <td>
          <div class="table-image">
            ${imageHtml}
          </div>
        </td>
        <td>
          <div class="table-title" title="${
            product.title || "Không có tiêu đề"
          }">
            ${product.title || "Không có tiêu đề"}
          </div>
        </td>
        <td>
          <div class="table-category">${categoryText}</div>
        </td>
        <td>
          <div class="table-status ${statusClass}">${statusText}</div>
        </td>
        <td>
          <div class="table-stock ${stockClass}">${stockText}</div>
        </td>
        <td>
          <div class="table-description" title="${descriptionText}">
            ${descriptionText}
          </div>
        </td>
        <td>
          <div class="table-date">${createdAt}</div>
        </td>
        <td>
          <div class="table-actions">
            <button class="table-btn table-btn-primary" onclick="productManager.viewProduct('${
              product._id
            }')" title="Xem chi tiết">
              <i class="fas fa-eye"></i>
            </button>
            <button class="table-btn table-btn-secondary" onclick="productManager.editProduct('${
              product._id
            }')" title="Chỉnh sửa">
              <i class="fas fa-edit"></i>
            </button>
            <button class="table-btn table-btn-danger" onclick="productManager.deleteProduct('${
              product._id
            }')" title="Xóa">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let stars = "";
    for (let i = 0; i < fullStars; i++) {
      stars += '<i class="fas fa-star"></i>';
    }
    if (hasHalfStar) {
      stars += '<i class="fas fa-star-half-alt"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
      stars += '<i class="far fa-star"></i>';
    }
    return stars;
  }

  updatePagination(pagination) {
    const paginationElement = document.getElementById("pagination");
    const prevPageBtn = document.getElementById("prevPage");
    const nextPageBtn = document.getElementById("nextPage");
    const pageInfo = document.getElementById("pageInfo");

    if (pagination.totalPages <= 1) {
      paginationElement.classList.add("hidden");
      return;
    }

    paginationElement.classList.remove("hidden");
    prevPageBtn.disabled = !pagination.hasPrevPage;
    nextPageBtn.disabled = !pagination.hasNextPage;
    pageInfo.textContent = `Page ${pagination.currentPage} of ${pagination.totalPages}`;
  }

  updateProductCount(count) {
    const productsCount = document.getElementById("productsCount");
    productsCount.textContent = count;
  }

  handleSort(header) {
    const sortField = header.dataset.sort;
    const currentSortBy = this.currentFilters.sortBy;
    const currentSortOrder = this.currentFilters.sortOrder;

    // Determine new sort order
    let newSortOrder = "asc";
    if (currentSortBy === sortField && currentSortOrder === "asc") {
      newSortOrder = "desc";
    } else if (currentSortBy === sortField && currentSortOrder === "desc") {
      newSortOrder = "asc";
    }

    // Update filters
    this.currentFilters.sortBy = sortField;
    this.currentFilters.sortOrder = newSortOrder;

    // Update UI
    this.updateSortUI(header, newSortOrder);

    // Reset to first page and reload
    this.currentPage = 1;
    this.loadProducts();
  }

  updateSortUI(activeHeader, sortOrder) {
    // Remove active class and reset icons from all headers
    const allHeaders = document.querySelectorAll(".sortable");
    allHeaders.forEach((header) => {
      header.classList.remove("active");
      const icon = header.querySelector(".sort-icon");
      icon.className = "fas fa-sort sort-icon";
    });

    // Add active class and update icon for current header
    activeHeader.classList.add("active");
    const activeIcon = activeHeader.querySelector(".sort-icon");
    if (sortOrder === "asc") {
      activeIcon.className = "fas fa-sort-up sort-icon";
    } else {
      activeIcon.className = "fas fa-sort-down sort-icon";
    }
  }

  clearFilters() {
    this.currentFilters = {
      sortBy: "createdAt",
      sortOrder: "desc",
    };

    this.currentPage = 1;
    this.loadProducts();
  }

  showLoading(show) {
    const loadingSpinner = document.getElementById("loadingSpinner");
    const productsSection = document.querySelector(".products-section");

    if (show) {
      loadingSpinner.classList.remove("hidden");
      productsSection.style.opacity = "0.5";
    } else {
      loadingSpinner.classList.add("hidden");
      productsSection.style.opacity = "1";
    }
  }

  showError(message) {
    const productsTableBody = document.getElementById("productsTableBody");
    productsTableBody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; padding: 2rem; color: #dc3545;">
          <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
          <h3>Lỗi</h3>
          <p>${message}</p>
        </td>
      </tr>
    `;
  }

  async showProductModal(product) {
    const modal = document.getElementById("productModal");
    const modalContent = document.getElementById("modalContent");

    const imageHtml =
      product.image && product.image !== "/assets/images/default-product.png"
        ? `<img src="${product.image}" alt="${
            product.title || "Product"
          }" style="width: 100%; height: 100%; object-fit: cover;">`
        : '<i class="fas fa-image" style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 4rem; color: #ddd;"></i>';

    const statusText = product.active ? "Hoạt động" : "Không hoạt động";
    const stockText =
      product.stock > 0 ? `${product.stock} đơn vị` : "Hết hàng";
    const categoryText = product.categories?.main || "Chưa phân loại";
    const createdAt = new Date(product.createdAt).toLocaleString("vi-VN");
    const updatedAt = new Date(product.updatedAt).toLocaleString("vi-VN");

    modalContent.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: start;">
        <div class="product-image" style="height: 300px; border-radius: 10px; overflow: hidden;">
          ${imageHtml}
        </div>
        <div>
          <div class="table-category" style="margin-bottom: 0.5rem;">${categoryText}</div>
          <h2 class="product-name" style="font-size: 1.5rem; margin-bottom: 1rem;">
            ${product.title || "Không có tiêu đề"}
          </h2>
          
          <div style="margin-bottom: 1rem;">
            <strong>SKU:</strong> ${product.sku || "N/A"}<br>
            <strong>EAN:</strong> ${product.ean || "N/A"}<br>
            <strong>Trạng thái:</strong> ${statusText}<br>
            <strong>Tồn kho:</strong> ${stockText}
          </div>
          
          <p style="color: #666; margin-bottom: 1.5rem; line-height: 1.6;">
            ${
              product.description ||
              product.description_long ||
              "Không có mô tả"
            }
          </p>
          
          <div style="margin-bottom: 1.5rem; font-size: 0.9rem; color: #666;">
            <div><strong>Ngày tạo:</strong> ${createdAt}</div>
            <div><strong>Cập nhật lần cuối:</strong> ${updatedAt}</div>
          </div>
          
          <div style="display: flex; gap: 1rem;">
            <button class="btn btn-secondary" style="flex: 1;" onclick="productManager.closeModal()">
              Đóng
            </button>
          </div>
        </div>
      </div>
    `;

    modal.classList.remove("hidden");
  }

  closeModal() {
    const modal = document.getElementById("productModal");
    modal.classList.add("hidden");
  }

  async viewProduct(productId) {
    try {
      const response = await fetch(`/api/products/${productId}`);
      const data = await response.json();

      if (data.success) {
        this.showProductModal(data.data);
      } else {
        alert("Không thể tải thông tin sản phẩm");
      }
    } catch (error) {
      console.error("Error loading product:", error);
      alert("Lỗi khi tải thông tin sản phẩm");
    }
  }

  editProduct(productId) {
    // Navigate to edit product page
    window.location.href = `/products/edit/${productId}`;
  }

  async deleteProduct(productId) {
    if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      try {
        const response = await fetch(`/api/products/${productId}`, {
          method: "DELETE",
        });
        const data = await response.json();

        if (data.success) {
          alert("Xóa sản phẩm thành công");
          this.loadProducts(); // Reload the table
        } else {
          alert("Không thể xóa sản phẩm");
        }
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Lỗi khi xóa sản phẩm");
      }
    }
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Tab Management
class TabManager {
  constructor() {
    this.currentTab = "products";
    this.init();
  }

  init() {
    this.bindTabEvents();
    this.checkUrlParams();
  }

  checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("tab");

    if (tabParam === "import") {
      this.switchTab("import");
    }
  }

  bindTabEvents() {
    const productsTab = document.getElementById("productsTab");
    const importTab = document.getElementById("importTab");
    const productsContent = document.getElementById("productsContent");
    const importContent = document.getElementById("importContent");

    if (productsTab && importTab) {
      productsTab.addEventListener("click", () => {
        this.switchTab("products");
      });

      importTab.addEventListener("click", () => {
        this.switchTab("import");
      });
    }
  }

  switchTab(tabName) {
    const productsTab = document.getElementById("productsTab");
    const importTab = document.getElementById("importTab");
    const productsContent = document.getElementById("productsContent");
    const importContent = document.getElementById("importContent");

    // Remove active class from all tabs and content
    [productsTab, importTab].forEach((tab) => {
      if (tab) tab.classList.remove("active");
    });
    [productsContent, importContent].forEach((content) => {
      if (content) content.classList.remove("active");
    });

    // Add active class to selected tab and content
    if (tabName === "products") {
      if (productsTab) productsTab.classList.add("active");
      if (productsContent) productsContent.classList.add("active");
    } else if (tabName === "import") {
      if (importTab) importTab.classList.add("active");
      if (importContent) importContent.classList.add("active");
    }

    this.currentTab = tabName;
  }
}

// Initialize the product manager and tab manager when the page loads
let productManager;
let tabManager;
document.addEventListener("DOMContentLoaded", () => {
  productManager = new ProductManager();
  tabManager = new TabManager();
});
