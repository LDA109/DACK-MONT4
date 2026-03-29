import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import { paymentAPI } from '../services/api';
import toast from 'react-hot-toast';

const VNPayReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [orderInfo, setOrderInfo] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Convert searchParams to object
        const params = Object.fromEntries(searchParams);
        
        // Check if we have VNPay params
        if (!params.vnp_Amount || !params.vnp_TxnRef) {
          setStatus('error');
          toast.error('Không tìm thấy thông tin thanh toán');
          return;
        }

        // Call backend to verify payment
        const res = await paymentAPI.vnpayReturn(params);
        
        if (res.data.success) {
          setStatus('success');
          setOrderInfo(res.data.data);
          setTimeout(() => navigate('/orders'), 3000);
        } else {
          setStatus('failed');
          setOrderInfo(res.data.data);
          toast.error(res.data.message);
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        setStatus('error');
        toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  return (
    <div>
      <Navbar />
      <div className="container page-wrapper" style={{ paddingTop: 48, paddingBottom: 48, textAlign: 'center' }}>
        {status === 'loading' && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>⏳ Đang xác nhận thanh toán...</h2>
            <p style={{ color: 'var(--gray-600)', marginBottom: 24 }}>Vui lòng đợi trong giây lát</p>
            <div style={{ display: 'inline-block', width: 40, height: 40, border: '4px solid var(--primary-light)', borderTop: '4px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {status === 'success' && (
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <div style={{ fontSize: 80, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8, color: 'var(--success)' }}>Thanh toán thành công!</h2>
            <p style={{ fontSize: 16, color: 'var(--gray-600)', marginBottom: 24 }}>Cảm ơn bạn đã mua hàng</p>
            
            {orderInfo && (
              <div style={{ background: 'var(--gray-50)', padding: 24, borderRadius: 'var(--radius-lg)', marginBottom: 24, textAlign: 'left' }}>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ color: 'var(--gray-600)' }}>Mã đơn hàng:</span>
                  <strong style={{ marginLeft: 8, fontSize: 18 }}>{orderInfo.orderCode}</strong>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ color: 'var(--gray-600)' }}>Số tiền thanh toán:</span>
                  <strong style={{ marginLeft: 8, fontSize: 18, color: 'var(--primary)' }}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(orderInfo.amount)}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--gray-600)' }}>Mã giao dịch VNPay:</span>
                  <strong style={{ marginLeft: 8, fontSize: 14 }}>{orderInfo.transactionNo}</strong>
                </div>
              </div>
            )}

            <p style={{ color: 'var(--gray-600)', marginBottom: 16 }}>Bạn sẽ được chuyển hướng đến trang đơn hàng sau 3 giây...</p>
            <button 
              onClick={() => navigate('/orders')} 
              className="btn btn-primary"
            >
              ➡️ Xem đơn hàng của tôi
            </button>
          </div>
        )}

        {status === 'failed' && (
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <div style={{ fontSize: 80, marginBottom: 16 }}>❌</div>
            <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8, color: 'var(--danger)' }}>Thanh toán thất bại!</h2>
            <p style={{ fontSize: 16, color: 'var(--gray-600)', marginBottom: 24 }}>Không thể hoàn tất giao dịch</p>
            
            {orderInfo && (
              <div style={{ background: 'var(--gray-50)', padding: 24, borderRadius: 'var(--radius-lg)', marginBottom: 24, textAlign: 'left' }}>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ color: 'var(--gray-600)' }}>Mã đơn hàng:</span>
                  <strong style={{ marginLeft: 8 }}>{orderInfo.orderCode}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--gray-600)' }}>Mã lỗi:</span>
                  <strong style={{ marginLeft: 8 }}>{orderInfo.responseCode}</strong>
                </div>
              </div>
            )}

            <button 
              onClick={() => navigate('/checkout')} 
              className="btn btn-primary"
            >
              🔄 Quay lại thanh toán
            </button>
          </div>
        )}

        {status === 'error' && (
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <div style={{ fontSize: 80, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8, color: 'var(--warning)' }}>Có lỗi xảy ra!</h2>
            <p style={{ fontSize: 16, color: 'var(--gray-600)', marginBottom: 24 }}>Vui lòng liên hệ với chúng tôi để được hỗ trợ</p>
            
            <button 
              onClick={() => navigate('/orders')} 
              className="btn btn-primary"
            >
              ↩️ Quay lại
            </button>
          </div>
        )}
      </div>
      <Footer />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default VNPayReturn;
