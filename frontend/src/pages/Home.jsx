import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import ProductCard from '../components/ProductCard/ProductCard';
import Footer from '../components/Footer/Footer';
import { bookAPI, categoryAPI } from '../services/api';

const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

// Flash Sale Countdown
function Countdown({ endTime }) {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, endTime - Date.now());
      setTime({ h: Math.floor(diff / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [endTime]);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    <div className="countdown">
      <div className="countdown-block">{pad(time.h)}</div>
      <span className="countdown-sep">:</span>
      <div className="countdown-block">{pad(time.m)}</div>
      <span className="countdown-sep">:</span>
      <div className="countdown-block">{pad(time.s)}</div>
    </div>
  );
}

// Hero Banner
const BANNERS = [
  { bg: 'linear-gradient(135deg, #e53935 0%, #6a1a1a 100%)', title: '⚡ Flash Sale Hàng Ngày', sub: 'Giảm đến 50% - Số lượng có hạn!', cta: 'Mua Ngay', to: '/books?isFlashSale=true' },
  { bg: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)', title: '🎌 Manga Mới Nhất', sub: 'Hàng ngàn đầu manga cập nhật liên tục', cta: 'Khám Phá', to: '/books?type=manga' },
  { bg: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)', title: '🏆 Sách Bán Chạy', sub: 'Top những cuốn sách được yêu thích nhất', cta: 'Xem Ngay', to: '/books?isBestseller=true' },
];

function HeroBanner() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % BANNERS.length), 4000);
    return () => clearInterval(t);
  }, []);
  const b = BANNERS[idx];
  return (
    <div style={{
      background: b.bg, borderRadius: 'var(--radius-xl)', padding: '60px 48px',
      minHeight: 240, display: 'flex', flexDirection: 'column', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', transition: 'all .5s ease', marginBottom: 24,
    }}>
      {/* Decorative */}
      <div style={{
        position: 'absolute', right: -40, top: -40, width: 300, height: 300, borderRadius: '50%',
        background: 'rgba(255,255,255,.05)',
      }} />
      <div style={{
        position: 'absolute', right: 60, bottom: -60, width: 200, height: 200, borderRadius: '50%',
        background: 'rgba(255,255,255,.05)',
      }} />
      <h1 style={{ color: 'white', fontSize: 36, fontWeight: 900, marginBottom: 12, textShadow: '0 2px 8px rgba(0,0,0,.2)' }}>{b.title}</h1>
      <p style={{ color: 'rgba(255,255,255,.9)', fontSize: 18, marginBottom: 24 }}>{b.sub}</p>
      <Link to={b.to} className="btn" style={{
        background: 'white', color: '#e53935', fontWeight: 800, width: 'fit-content',
        fontSize: 16, padding: '12px 28px', borderRadius: 99,
      }}>{b.cta} →</Link>
      {/* Dots */}
      <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
        {BANNERS.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} style={{
            width: i === idx ? 24 : 8, height: 8, borderRadius: 99,
            background: i === idx ? 'white' : 'rgba(255,255,255,.4)',
            border: 'none', cursor: 'pointer', transition: 'all .3s',
          }} />
        ))}
      </div>
    </div>
  );
}

// Trending Section with tabs
function TrendingSection() {
  const [tab, setTab] = useState('trending');
  const [books, setBooks] = useState([]);
  const tabs = [
    { key: 'trending', label: '🔥 Xu Hướng Theo Ngày' },
    { key: 'hot', label: '📈 Sách HOT - Giảm Sốc' },
    { key: 'bestseller', label: '🏆 Bestseller' },
  ];
  useEffect(() => {
    const load = async () => {
      let res;
      if (tab === 'trending') res = await bookAPI.getTrending();
      else if (tab === 'hot') res = await bookAPI.getBooks({ sort: 'discount', limit: 10 });
      else res = await bookAPI.getBestsellers({ limit: 10 });
      setBooks(res.data.data || []);
    };
    load();
  }, [tab]);
  return (
    <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '24px', boxShadow: 'var(--shadow-sm)', margin: '24px 0' }}>
      <div className="section-header">
        <div className="section-title"><span className="icon">📊</span>Xu Hướng Mua Sắm</div>
      </div>
      <div className="tabs">
        {tabs.map(t => (
          <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>
      <div className="books-grid-wide">
        {books.slice(0, 10).map(b => <ProductCard key={b._id} book={b} />)}
      </div>
    </div>
  );
}

// Bestseller Ranking
function BestsellerRanking({ categories }) {
  const [tab, setTab] = useState(0);
  const [books, setBooks] = useState([]);
  const [selected, setSelected] = useState(null);
  const catTabs = [{ name: 'Tất cả' }, ...categories.slice(0, 7)];

  useEffect(() => {
    const load = async () => {
      const params = { limit: 5 };
      if (tab > 0 && catTabs[tab]?._id) params.category = catTabs[tab]._id;
      const res = await bookAPI.getBestsellers(params);
      const data = res.data.data || [];
      setBooks(data);
      setSelected(data[0] || null);
    };
    load();
  }, [tab]);

  return (
    <div style={{ background: 'var(--gray-900)', borderRadius: 'var(--radius-xl)', padding: '24px', margin: '24px 0' }}>
      <div className="section-title" style={{ color: 'white', marginBottom: 16 }}><span>🏆</span>Bảng Xếp Hạng Bán Chạy</div>
      <div className="tabs" style={{ borderBottomColor: 'rgba(255,255,255,.15)', overflowX: 'auto' }}>
        {catTabs.map((c, i) => (
          <button key={i} className={`tab-btn ${tab === i ? 'active' : ''}`}
            onClick={() => setTab(i)}
            style={{ color: tab === i ? 'var(--gold)' : 'rgba(255,255,255,.6)', borderBottomColor: tab === i ? 'var(--gold)' : 'transparent' }}
          >{c.name}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="bestseller-list" style={{ maxHeight: 340, overflowY: 'auto' }}>
          {books.map((b, i) => (
            <div key={b._id} className="bestseller-item" onClick={() => setSelected(b)} style={{ background: selected?._id === b._id ? 'rgba(255,255,255,.08)' : '' }}>
              <div className={`bestseller-rank ${i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'rank-other'}`}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <img src={b.imageUrl} alt={b.title} className="bestseller-img" />
              <div className="bestseller-info">
                <div className="bestseller-title" style={{ color: 'white' }}>{b.title}</div>
                <div className="bestseller-author" style={{ color: 'rgba(255,255,255,.6)' }}>{b.author}</div>
                <div className="bestseller-sold">{b.sold?.toLocaleString()} điểm</div>
              </div>
            </div>
          ))}
        </div>
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 16 }}>
            <img src={selected.imageUrl} alt={selected.title} style={{ maxHeight: 220, borderRadius: 10, boxShadow: 'var(--shadow-xl)', marginBottom: 16 }} />
            <div style={{ color: 'white', fontWeight: 800, fontSize: 16, textAlign: 'center', marginBottom: 8 }}>{selected.title}</div>
            <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 13, marginBottom: 12 }}>{selected.author}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--gold)', marginBottom: 8 }}>{formatPrice(selected.price)}</div>
            {selected.discount > 0 && <span style={{ color: 'rgba(255,255,255,.5)', textDecoration: 'line-through', fontSize: 13, marginBottom: 12 }}>{formatPrice(selected.originalPrice)}</span>}
            <Link to={`/books/${selected._id}`} className="btn btn-primary" style={{ width: '100%' }}>Xem chi tiết →</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [flashSale, setFlashSale] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const flashEnd = useRef(Date.now() + 8 * 3600 * 1000);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const [fs, feat, cats] = await Promise.all([
        bookAPI.getFlashSale(),
        bookAPI.getFeatured(),
        categoryAPI.getCategories(),
      ]);
      setFlashSale(fs.data.data || []);
      setFeatured(feat.data.data || []);
      setCategories(cats.data.data || []);
    };
    load();
  }, []);

  return (
    <div>
      <Navbar />
      <div className="container page-wrapper" style={{ paddingTop: 24, paddingBottom: 48 }}>
        {/* Hero */}
        <HeroBanner />

        {/* Quick Categories */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '20px 24px', boxShadow: 'var(--shadow-sm)', marginBottom: 24 }}>
          <div className="section-header">
            <div className="section-title"><span className="icon">🗂️</span>Danh Mục Sản Phẩm</div>
            <Link to="/books" className="section-link">Xem tất cả →</Link>
          </div>
          <div className="category-grid">
            {categories.map(c => (
              <div key={c._id} className="category-item" onClick={() => navigate(`/category/${c.slug}`)}>
                <div className="category-icon-wrap">{c.icon}</div>
                <span className="category-name">{c.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Flash Sale */}
        <div className="flash-sale-section">
          <div className="flash-sale-header">
            <div className="flash-sale-title">⚡ FLASH SALE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'rgba(255,255,255,.8)', fontSize: 14 }}>Kết thúc trong</span>
              <Countdown endTime={flashEnd.current} />
            </div>
            <Link to="/books?isFlashSale=true" style={{ color: 'white', fontWeight: 600, fontSize: 14, marginLeft: 'auto', opacity: .8 }}>Xem tất cả →</Link>
          </div>
          <div className="flash-sale-scroll">
            {flashSale.map(b => <ProductCard key={b._id} book={b} />)}
          </div>
        </div>

        {/* Trending */}
        <TrendingSection />

        {/* Featured */}
        {featured.length > 0 && (
          <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '24px', boxShadow: 'var(--shadow-sm)', margin: '24px 0' }}>
            <div className="section-header">
              <div className="section-title"><span className="icon">⭐</span>Sách Nổi Bật</div>
              <Link to="/books?isFeatured=true" className="section-link">Xem thêm →</Link>
            </div>
            <div className="books-grid-wide">
              {featured.map(b => <ProductCard key={b._id} book={b} />)}
            </div>
          </div>
        )}

        {/* Bestseller Ranking */}
        <BestsellerRanking categories={categories} />

        {/* Manga Section */}
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          borderRadius: 'var(--radius-xl)', padding: '24px', margin: '24px 0',
        }}>
          <div className="section-header">
            <div className="section-title" style={{ color: 'white' }}><span>🎌</span>Khu Vực Manga</div>
            <Link to="/books?type=manga" style={{ color: 'var(--gold)', fontWeight: 600, fontSize: 14 }}>Xem tất cả →</Link>
          </div>
          <MangaSection />
        </div>
      </div>
      <Footer />
    </div>
  );
}

function MangaSection() {
  const [mangas, setMangas] = useState([]);
  useEffect(() => {
    bookAPI.getBooks({ type: 'manga', limit: 6, sort: 'bestselling' })
      .then(r => setMangas(r.data.data || []));
  }, []);
  return (
    <div className="books-grid-wide">
      {mangas.map(b => (
        <div key={b._id} className="product-card" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
          <Link to={`/books/${b._id}`}>
            <div className="img-wrapper">
              <img src={b.imageUrl} alt={b.title} loading="lazy" />
              {b.discount > 0 && <div className="badge badge-gold">-{b.discount}%</div>}
              {b.volume && <div className="badge" style={{ bottom: 8, top: 'auto', background: 'rgba(0,0,0,.7)' }}>Tập {b.volume}</div>}
            </div>
          </Link>
          <div className="info">
            <Link to={`/books/${b._id}`}><p className="title" style={{ color: 'white' }}>{b.title}</p></Link>
            <p className="author" style={{ color: 'rgba(255,255,255,.6)' }}>{b.author}</p>
            <div className="price-row">
              <span className="price" style={{ color: 'var(--gold)' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(b.price)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
