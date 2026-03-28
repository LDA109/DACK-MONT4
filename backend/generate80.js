const fs = require('fs');

const categories = [
  { slug: 'manga', keywords: ['manga', 'naruto', 'one piece', 'jujutsu kaisen', 'demon slayer', 'doraemon', 'spy x family', 'dragon ball', 'attack on titan'] },
  { slug: 'van-hoc', keywords: ['tiểu thuyết kinh điển', 'nhà giả kim', 'hai số phận', 'trăm năm cô đơn'] },
  { slug: 'tam-ly-ky-nang', keywords: ['kỹ năng sống', 'đắc nhân tâm', 'atomic habits', 'tuổi trẻ đáng giá bao nhiêu'] },
  { slug: 'kinh-te', keywords: ['kinh tế', 'kinh doanh', 'cha giàu cha nghèo', 'nghĩ giàu làm giàu'] },
  { slug: 'thieu-nhi', keywords: ['sách thiếu nhi', 'truyện cổ tích', 'những câu chuyện diệu kỳ'] },
  { slug: 'lich-su-dia-ly', keywords: ['lịch sử việt nam', 'đại việt sử ký', 'địa lý'] },
  { slug: 'khoa-hoc', keywords: ['khoa học vũ trụ', 'lược sử loài người', 'vũ trụ'] },
  { slug: 'ngoai-van', keywords: ['english book', 'oxford', 'cambridge', 'novel'] }
];

async function fetchFromTiki(keyword, limit) {
  try {
    const res = await fetch(`https://tiki.vn/api/v2/products?limit=${limit}&q=${encodeURIComponent(keyword)}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" }
    });
    const json = await res.json();
    return (json.data || []).map(b => ({
      title: b.name,
      author: b.authors ? b.authors.map(a => a.name).join(', ') : (b.brand_name || 'Nhiều tác giả'),
      description: b.short_description || `Cuốn sách ${b.name} với nội dung lôi cuốn, hấp dẫn.`,
      price: b.price > 0 ? b.price : Math.floor(Math.random() * 150000) + 50000,
      originalPrice: b.list_price > 0 ? b.list_price : Math.floor(Math.random() * 200000) + 100000,
      discount: b.discount_rate || Math.floor(Math.random() * 30),
      imageUrl: b.thumbnail_url?.replace('280x280', '750x750') || '',
      stock: Math.floor(Math.random() * 500) + 50,
      sold: b.quantity_sold?.value || Math.floor(Math.random() * 1000) + 10,
      rating: b.rating_average || Number((Math.random() * 1.5 + 3.5).toFixed(1)),
      ratingCount: b.review_count || Math.floor(Math.random() * 200) + 5,
      isFlashSale: Math.random() > 0.7,
      isBestseller: Math.random() > 0.5,
      isTrending: Math.random() > 0.4,
      isFeatured: Math.random() > 0.6
    }));
  } catch(e) { console.error(`Error fetching ${keyword}:`, e.message); return []; }
}

async function run() {
  const allBooks = [];
  for (const cat of categories) {
    let catBooks = [];
    for (const kw of cat.keywords) {
      if (catBooks.length >= 10) break;
      const items = await fetchFromTiki(kw, 10 - catBooks.length);
      catBooks = catBooks.concat(items.filter(i => i.imageUrl && i.title));
    }
    
    // Fill up if less than 10
    if (catBooks.length < 10) {
      const extra = await fetchFromTiki('sách hay', 10 - catBooks.length);
      catBooks = catBooks.concat(extra.filter(i => i.imageUrl));
    }
    
    catBooks = catBooks.slice(0, 10);
    catBooks.forEach(b => { 
      b.categorySlug = cat.slug; 
      b.type = cat.slug === 'manga' ? 'manga' : 'book'; 
      b.title = b.title.replace(/^Sách - /i, '').trim(); 
    });
    console.log(`✅ Loaded ${catBooks.length} books for ${cat.slug}`);
    allBooks.push(...catBooks);
  }
  fs.writeFileSync('src/seed/books80.json', JSON.stringify(allBooks, null, 2));
  console.log(`✅ File saved with ${allBooks.length} books.`);
}
run();
