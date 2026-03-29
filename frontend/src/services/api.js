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

// Payment
export const paymentAPI = {
  createVNPayPayment: (orderId) => api.post('/payment/vnpay-create', { orderId }),
  vnpayReturn: (params) => api.get('/payment/vnpay-return', { params }),
};

export default api;
