import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import FloatingChat from './components/Chatbot/FloatingChat';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Books from './pages/Books';
import BookDetail from './pages/BookDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import CategoryPage from './pages/CategoryPage';
import VNPayReturn from './pages/VNPayReturn';
import Upload from './pages/Upload';
import Wishlist from './pages/Wishlist';
import SearchHistory from './pages/SearchHistory';

import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBooks from './pages/admin/AdminBooks';
import AdminCategories from './pages/admin/AdminCategories';
import AdminInventory from './pages/admin/AdminInventory';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCoupons from './pages/admin/AdminCoupons';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user } = useAuth();
  console.log('[ROUTE PROTECTION] Checking access - user:', user, 'adminOnly:', adminOnly);
  if (!user) {
    console.log('[ROUTE PROTECTION] No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  if (adminOnly && user.role !== 'admin') {
    console.log('[ROUTE PROTECTION] Admin required, user role:', user.role);
    return <Navigate to="/" replace />;
  }
  console.log('[ROUTE PROTECTION] Access granted');
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/books" element={<Books />} />
      <Route path="/books/:id" element={<BookDetail />} />
      <Route path="/category/:slug" element={<CategoryPage />} />
      <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
      <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
      <Route path="/vnpay-return" element={<VNPayReturn />} />
      <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
      <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
      <Route path="/search-history" element={<ProtectedRoute><SearchHistory /></ProtectedRoute>} />

      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="books" element={<AdminBooks />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="inventory" element={<AdminInventory />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
            <AppRoutes />
            <FloatingChat />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
