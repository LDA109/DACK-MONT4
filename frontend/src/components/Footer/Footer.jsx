import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ background: 'var(--gray-900)', color: 'rgba(255,255,255,.75)', padding: '48px 0 24px', marginTop: 48 }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, marginBottom: 40 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'white', marginBottom: 12 }}>📚 BookStore</div>
            <p style={{ fontSize: 14, lineHeight: 1.7 }}>Nền tảng mua sắm sách trực tuyến hàng đầu Việt Nam. Hàng ngàn đầu sách chính hãng với giá tốt nhất.</p>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'white', marginBottom: 12, fontSize: 15 }}>Danh mục</div>
            {['Văn học', 'Manga', 'Tâm lý - Kỹ năng', 'Kinh tế', 'Thiếu nhi', 'Ngoại văn'].map(c => (
              <Link key={c} to="/books" style={{ display: 'block', fontSize: 14, marginBottom: 6, color: 'rgba(255,255,255,.65)', textDecoration: 'none', transition: 'color .2s' }} onMouseEnter={(e) => e.target.style.color = 'white'} onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,.65)'}>{c}</Link>
            ))}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'white', marginBottom: 12, fontSize: 15 }}>Hỗ trợ</div>
            {['Chính sách đổi trả', 'Hướng dẫn mua hàng', 'Câu hỏi thường gặp', 'Liên hệ hỗ trợ'].map(t => (
              <div key={t} style={{ fontSize: 14, marginBottom: 6, color: 'rgba(255,255,255,.65)', cursor: 'pointer' }}>{t}</div>
            ))}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'white', marginBottom: 12, fontSize: 15 }}>Liên hệ</div>
            <div style={{ fontSize: 14, lineHeight: 1.8 }}>
              <div>📧 support@bookstore.vn</div>
              <div>📞 1800-1234</div>
              <div>🕐 8:00 - 22:00 (T2-CN)</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                {['Facebook', 'Zalo', 'TikTok'].map(s => (
                  <span key={s} style={{ background: 'rgba(255,255,255,.1)', padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,.1)', marginBottom: 20 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
          <div>© 2024 BookStore. All rights reserved.</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Visa', 'MasterCard', 'MoMo', 'ZaloPay', 'VNPay'].map(p => (
              <span key={p} style={{ background: 'rgba(255,255,255,.1)', padding: '3px 8px', borderRadius: 4, fontSize: 11 }}>{p}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
