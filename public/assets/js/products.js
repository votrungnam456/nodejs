class ProductManager {
  constructor() {
    this.currentPage = 1;
    this.productsPerPage = 12;
    this.currentFilters = {
      search: "",
      category: "all",
      minPrice: "",
      maxPrice: "",
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
    // Search functionality
    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");

    searchInput.addEventListener(
      "input",
      this.debounce(() => {
        this.currentFilters.search = searchInput.value;
        this.currentPage = 1;
        this.loadProducts();
      }, 500)
    );

    searchBtn.addEventListener("click", () => {
      this.currentFilters.search = searchInput.value;
      this.currentPage = 1;
      this.loadProducts();
    });

    // Filter functionality
    const categoryFilter = document.getElementById("categoryFilter");
    const minPriceInput = document.getElementById("minPrice");
    const maxPriceInput = document.getElementById("maxPrice");
    const sortBySelect = document.getElementById("sortBy");

    categoryFilter.addEventListener("change", () => {
      this.currentFilters.category = categoryFilter.value;
      this.currentPage = 1;
      this.loadProducts();
    });

    minPriceInput.addEventListener(
      "input",
      this.debounce(() => {
        this.currentFilters.minPrice = minPriceInput.value;
        this.currentPage = 1;
        this.loadProducts();
      }, 500)
    );

    maxPriceInput.addEventListener(
      "input",
      this.debounce(() => {
        this.currentFilters.maxPrice = maxPriceInput.value;
        this.currentPage = 1;
        this.loadProducts();
      }, 500)
    );

    sortBySelect.addEventListener("change", () => {
      const value = sortBySelect.value;
      if (value.startsWith("-")) {
        this.currentFilters.sortBy = value.substring(1);
        this.currentFilters.sortOrder = "desc";
      } else {
        this.currentFilters.sortBy = value;
        this.currentFilters.sortOrder = "asc";
      }
      this.currentPage = 1;
      this.loadProducts();
    });

    // Clear filters
    const clearFiltersBtn = document.getElementById("clearFilters");
    clearFiltersBtn.addEventListener("click", () => {
      this.clearFilters();
    });

    // Pagination
    const prevPageBtn = document.getElementById("prevPage");
    const nextPageBtn = document.getElementById("nextPage");

    prevPageBtn.addEventListener("click", () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.loadProducts();
      }
    });

    nextPageBtn.addEventListener("click", () => {
      this.currentPage++;
      this.loadProducts();
    });

    // Modal functionality
    const modal = document.getElementById("productModal");
    const closeModal = document.querySelector(".close-modal");

    closeModal.addEventListener("click", () => {
      this.closeModal();
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        this.closeModal();
      }
    });

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
    const productsGrid = document.getElementById("productsGrid");
    const noProducts = document.getElementById("noProducts");

    if (products.length === 0) {
      productsGrid.innerHTML = "";
      noProducts.classList.remove("hidden");
      return;
    }

    noProducts.classList.add("hidden");

    productsGrid.innerHTML = products
      .map((product) => this.createProductCard(product))
      .join("");

    // Add click event to product cards
    const productCards = productsGrid.querySelectorAll(".product-card");
    productCards.forEach((card, index) => {
      card.addEventListener("click", () => {
        this.showProductModal(products[index]);
      });
    });
  }

  createProductCard(product) {
    const stars = this.generateStars(product.rating);
    const stockStatus =
      product.stock > 0
        ? `<span class="product-stock">In Stock: ${product.stock}</span>`
        : '<span class="product-stock" style="color: #dc3545;">Out of Stock</span>';

    return `
            <div class="product-card" data-product-id="${product._id}">
                <div class="product-image">
                    ${
                      product.image &&
                      product.image !== "/assets/images/default-product.png"
                        ? `<img src="${product.image}" alt="${product.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                         <i class="fas fa-image" style="display: none;"></i>`
                        : '<i class="fas fa-image"></i>'
                    }
                </div>
                <div class="product-info">
                    <div class="product-category">${product.category}</div>
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-meta">
                        <div class="product-price">$${product.price.toFixed(
                          2
                        )}</div>
                        <div class="product-rating">
                            ${stars}
                            <span>(${product.reviews})</span>
                        </div>
                    </div>
                    ${stockStatus}
                    <div class="product-actions">
                        <button class="btn btn-primary" onclick="event.stopPropagation(); productManager.addToCart('${
                          product._id
                        }')">
                            <i class="fas fa-shopping-cart"></i> Add to Cart
                        </button>
                        <button class="btn btn-secondary" onclick="event.stopPropagation(); productManager.viewDetails('${
                          product._id
                        }')">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </div>
                </div>
            </div>
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

  clearFilters() {
    this.currentFilters = {
      search: "",
      category: "all",
      minPrice: "",
      maxPrice: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    };

    // Reset form elements
    document.getElementById("searchInput").value = "";
    document.getElementById("categoryFilter").value = "all";
    document.getElementById("minPrice").value = "";
    document.getElementById("maxPrice").value = "";
    document.getElementById("sortBy").value = "createdAt";

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
    const productsGrid = document.getElementById("productsGrid");
    productsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #dc3545;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        `;
  }

  async showProductModal(product) {
    const modal = document.getElementById("productModal");
    const modalContent = document.getElementById("modalContent");
    const stars = this.generateStars(product.rating);

    modalContent.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: start;">
                <div class="product-image" style="height: 300px; border-radius: 10px; overflow: hidden;">
                    ${
                      product.image &&
                      product.image !== "/assets/images/default-product.png"
                        ? `<img src="${product.image}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">`
                        : '<i class="fas fa-image" style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 4rem; color: #ddd;"></i>'
                    }
                </div>
                <div>
                    <div class="product-category">${product.category}</div>
                    <h2 class="product-name" style="font-size: 1.5rem; margin-bottom: 1rem;">${
                      product.name
                    }</h2>
                    <p style="color: #666; margin-bottom: 1.5rem; line-height: 1.6;">${
                      product.description
                    }</p>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <div style="font-size: 2rem; font-weight: bold; color: #28a745; margin-bottom: 0.5rem;">
                            $${product.price.toFixed(2)}
                        </div>
                        <div class="product-rating" style="margin-bottom: 0.5rem;">
                            ${stars}
                            <span style="color: #666;">(${
                              product.reviews
                            } reviews)</span>
                        </div>
                        <div style="color: #666; font-size: 0.9rem;">
                            ${
                              product.stock > 0
                                ? `In Stock: ${product.stock} units`
                                : "Out of Stock"
                            }
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 1rem;">
                        <button class="btn btn-primary" style="flex: 1;" onclick="productManager.addToCart('${
                          product._id
                        }')">
                            <i class="fas fa-shopping-cart"></i> Add to Cart
                        </button>
                        <button class="btn btn-secondary" style="flex: 1;" onclick="productManager.closeModal()">
                            Close
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

  addToCart(productId) {
    // This is a placeholder for cart functionality
    alert(`Product ${productId} added to cart!`);
  }

  viewDetails(productId) {
    // This could navigate to a detailed product page
    alert(`Viewing details for product ${productId}`);
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
