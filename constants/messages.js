export const MESSAGES = {
  INTERNAL_SERVER_ERROR: "Internal server error",
  ACCESS_DENIED: "Access denied. No token provided.",
  INVALID_TOKEN: "Invalid token.",
  INVALID_TOKEN_USER_NOT_FOUND: "Invalid token. User not found.",

  // Auth
  LOGIN_SUCCESS: "Login successful",
  LOGIN_INVALID: "Invalid username or password",
  LOGIN_REQUIRED: "Username and password are required",
  LOGOUT_SUCCESS: "Logout successful",

  SIGNUP_SUCCESS: "Account created successfully",
  SIGNUP_CONFLICT: "Username or email already exists",
  SIGNUP_REQUIRED: "All fields are required",

  PROFILE_UPDATED: "Profile updated successfully",
  EMAIL_EXISTS: "Email already exists",

  PASSWORD_WEAK: "Password must be at least 6 characters",
  PASSWORD_CHANGED: "Password changed successfully",
  PASSWORD_RESET_DONE: "Password has been reset successfully",
  PASSWORD_RESET_TOKEN_INVALID: "Invalid or expired token",

  // Upload/import
  NO_FILE: "No file uploaded",
  IMPORT_TIMEOUT: "Import timeout - operation took too long",
  IMPORT_FAILED: "Failed to process file",

  // Product
  PRODUCT_NOT_FOUND: "Product not found",
  PRODUCT_UPDATED: "Product updated successfully",
  PRODUCT_DELETED: "Product deleted successfully",
  PRODUCT_CREATED: "Product created successfully",
  PRODUCT_UPDATE_FAILED: "Failed to update product",
  PRODUCT_DELETE_FAILED: "Failed to delete product",
  PRODUCT_FETCH_FAILED: "Failed to fetch product",
  PRODUCTS_FETCH_FAILED: "Failed to fetch products",

  // Category
  CATEGORIES_FETCH_FAILED: "Failed to fetch categories",
  CATEGORY_FETCH_FAILED: "Failed to fetch category",
  CATEGORY_NOT_FOUND: "Category not found",
  CATEGORY_CREATED: "Category created successfully",
  CATEGORY_UPDATED: "Category updated successfully",
  CATEGORY_DELETED: "Category deleted successfully",
  CATEGORY_IMPORT_COMPLETED: "Category import completed",
  CATEGORY_IMPORT_FAILED: "Failed to process file",
  CATEGORY_IMPORT_STARTED: "Category import started",
};
