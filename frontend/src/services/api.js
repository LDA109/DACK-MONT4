import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleLogin: (credential) => api.post('/auth/google', { credential }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Books
export const bookAPI = {
  getBooks: (params) => api.get('/books', { params }),
  getBook: (id) => api.get(`/books/${id}`),
  getFlashSale: () => api.get('/books/flash-sale'),
  getBestsellers: (params) => api.get('/books/bestsellers', { params }),
  getTrending: () => api.get('/books/trending'),
  getFeatured: () => api.get('/books/featured'),
};

// Categories
export const categoryAPI = {
  getCategories: () => api.get('/categories'),
  getCategory: (slug) => api.get(`/categories/${slug}`),
};

// Cart
export const cartAPI = {
  getCart: () => api.get('/cart'),
  addToCart: (bookId, quantity = 1) => api.post('/cart/add', { bookId, quantity }),
  updateCart: (bookId, quantity) => api.put('/cart/update', { bookId, quantity }),
  removeFromCart: (bookId) => api.delete(`/cart/remove/${bookId}`),
  clearCart: () => api.delete('/cart/clear'),
};

// Orders
export const orderAPI = {
  createOrder: (data) => api.post('/orders', data),
  getMyOrders: () => api.get('/orders/my'),
  getOrder: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id) => api.put(`/orders/${id}/cancel`),
};

// Admin
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  // Books
  getBooks: (params) => api.get('/admin/books', { params }),
  createBook: (data) => api.post('/admin/books', data),
  updateBook: (id, data) => api.put(`/admin/books/${id}`, data),
  deleteBook: (id) => api.delete(`/admin/books/${id}`),
  // Categories
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
  // Orders
  getOrders: (params) => api.get('/admin/orders', { params }),
  updateOrderStatus: (id, status) => api.put(`/admin/orders/${id}/status`, { status }),
  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  toggleUser: (id) => api.put(`/admin/users/${id}/toggle`),
};

// Inventory
export const inventoryAPI = {
  getInventory: (params) => api.get('/inventory', { params }),
  getInventoryByBook: (bookId) => api.get(`/inventory/book/${bookId}`),
  createInventory: (data) => api.post('/inventory', data),
  updateInventory: (id, data) => api.put(`/inventory/${id}`, data),
  adjustStock: (id, data) => api.put(`/inventory/${id}/adjust`, data),
  deleteInventory: (id) => api.delete(`/inventory/${id}`),
  seedInventory: () => api.post('/inventory/seed/auto'),
};

// Reviews
export const reviewAPI = {
  getReviews: (params) => api.get('/reviews', { params }),
  getReviewsByBook: (bookId, params) => api.get(`/reviews/book/${bookId}`, { params }),
  createReview: (data) => api.post('/reviews', data),
  updateReview: (id, data) => api.put(`/reviews/${id}`, data),
  markHelpful: (id, data) => api.post(`/reviews/${id}/helpful`, data),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
  replyToReview: (id, data) => api.put(`/reviews/${id}/reply`, data),
};

// Coupons
export const couponAPI = {
  getCoupons: () => api.get('/coupon'),
  createCoupon: (data) => api.post('/coupon', data),
  updateCoupon: (id, data) => api.put(`/coupon/${id}`, data),
  deleteCoupon: (id) => api.delete(`/coupon/${id}`),
  checkCoupon: (code, totalPrice) => api.post('/coupon/check', { code, totalPrice }),
};

// Payment
export const paymentAPI = {
  createVNPayPayment: (orderId) => api.post('/payment/vnpay-create', { orderId }),
  vnpayReturn: (queryParams) => {
    // Build query string from params object
    const queryString = new URLSearchParams(queryParams).toString();
    return api.get(`/payment/vnpay-return?${queryString}`);
  },
};

// Upload
export const uploadAPI = {
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': undefined,
      }
    });
  },
};

// Notifications
export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  getUnreadCount: () => api.get('/notifications/unread/count'),
};

// AI Chat
export const aiAPI = {
  chat: (message, history) => api.post('/ai/chat', { message, history }),
};

// Search History
export const searchHistoryAPI = {
  getSearchHistory: (params) => api.get('/search-history', { params }),
  addSearchHistory: (data) => api.post('/search-history', data),
  deleteSearchHistory: (id) => api.delete(`/search-history/${id}`),
  clearSearchHistory: () => api.delete('/search-history'),
};

// Wishlist
export const wishlistAPI = {
  getWishlist: () => api.get('/wishlist'),
  addToWishlist: (bookId) => api.post('/wishlist/add', { bookId }),
  removeFromWishlist: (bookId) => api.delete(`/wishlist/remove/${bookId}`),
};

// User Preferences (Settings)
export const userPreferencesAPI = {
  getPreferences: () => api.get('/user-preferences'),
  updatePreferences: (data) => api.put('/user-preferences', data),
};

export default api;
