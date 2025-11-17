export const API = {
  AUTH: {
    BASE: "/auth",
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    SIGNUP: "/auth/signup",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    CHANGE_PASSWORD: "/auth/change-password",
  },
  USER: {
    ME: "/user/me",
  },
  PRODUCTS: {
    BASE: "/products",
    BY_ID: (id) => `/products/${id}`,
    NEW: "/products/new",
    CATEGORIES: "/products/categories",
  },
  CATEGORIES: {
    BASE: "/categories",
    BY_ID: (id) => `/categories/${id}`,
    BY_SLUG: (slug) => `/categories/slug/${slug}`,
    ACTIVE: "/categories/active",
    IMPORT: "/categories/import",
  },
};
