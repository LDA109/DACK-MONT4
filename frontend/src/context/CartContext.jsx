import { createContext, useContext, useState, useEffect } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], totalPrice: 0, totalItems: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) fetchCart();
    else setCart({ items: [], totalPrice: 0, totalItems: 0 });
  }, [user]);

  const fetchCart = async () => {
    try {
      const res = await cartAPI.getCart();
      setCart(res.data.data || { items: [], totalPrice: 0, totalItems: 0 });
    } catch {}
  };

  const addToCart = async (bookId, quantity = 1) => {
    if (!user) { toast.error('Vui lòng đăng nhập để thêm vào giỏ!'); return; }
    setLoading(true);
    try {
      const res = await cartAPI.addToCart(bookId, quantity);
      setCart(res.data.data);
      toast.success('Đã thêm vào giỏ hàng! 🛒');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi thêm vào giỏ hàng');
    } finally { setLoading(false); }
  };

  const updateCart = async (bookId, quantity) => {
    setLoading(true);
    try {
      const res = await cartAPI.updateCart(bookId, quantity);
      setCart(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật giỏ');
    } finally { setLoading(false); }
  };

  const removeFromCart = async (bookId) => {
    setLoading(true);
    try {
      const res = await cartAPI.removeFromCart(bookId);
      setCart(res.data.data);
      toast.success('Đã xóa khỏi giỏ hàng');
    } catch (err) {
      toast.error('Lỗi xóa khỏi giỏ');
    } finally { setLoading(false); }
  };

  const clearCart = async () => {
    await cartAPI.clearCart();
    setCart({ items: [], totalPrice: 0, totalItems: 0 });
  };

  return (
    <CartContext.Provider value={{ cart, loading, addToCart, updateCart, removeFromCart, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
};
