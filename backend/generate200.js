const fs = require('fs');

const categories = [
  { slug: 'manga', keywords: ['manga', 'naruto', 'one piece', 'jujutsu kaisen', 'demon slayer', 'doraemon', 'spy x family', 'dragon ball', 'conan', 'tokyo ghoul', 'thanh gươm diệt quỷ', 'chuyển sinh thành slime'] },
  { slug: 'van-hoc', keywords: ['tiểu thuyết kinh điển', 'nhà giả kim', 'hai số phận', 'trăm năm cô đơn', 'văn học việt nam', 'văn học nước ngoài'] },
  { slug: 'tam-ly-ky-nang', keywords: ['kỹ năng sống', 'đắc nhân tâm', 'atomic habits', 'tuổi trẻ đáng giá', 'tâm lý học', 'nghệ thuật giao tiếp'] },
  { slug: 'kinh-te', keywords: ['kinh tế', 'kinh doanh', 'cha giàu cha nghèo', 'nghĩ giàu làm giàu', 'chứng khoán', 'đầu tư', 'marketing'] },
  { slug: 'thieu-nhi', keywords: ['sách thiếu nhi', 'truyện cổ tích', 'những câu chuyện diệu kỳ', 'sách tranh', 'phát triển trí tuệ'] },
  { slug: 'lich-su-dia-ly', keywords: ['lịch sử việt nam', 'đại việt sử ký', 'địa lý', 'sử ký tư mã thiên', 'lịch sử thế giới'] },
  { slug: 'khoa-hoc', keywords: ['khoa học vũ trụ', 'lược sử loài người', 'vũ trụ', 'thế giới động vật', 'khoa học môi trường'] },
  { slug: 'ngoai-van', keywords: ['english book', 'oxford', 'cambridge', 'novel', 'penguin readers', 'ielts', 'toeic'] }
];

async function fetchFromTiki(keyword, limit) {
  try {
    const res = await fetch(`https://tiki.vn/api/v2/products?limit=${Math.max(limit, 10)}&q=${encodeURIComponent(keyword)}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" }
    });
    const json = await res.json();
    let data = (json.data || []).filter(b => b.thumbnail_url && b.name);
    
    // Take exactly what we need
    if (data.length > limit) data = data.slice(0, limit);
    
    return data.map(b => ({
      title: b.name.replace(/^Sách - /i, '').trim(),
      author: b.authors ? b.authors.map(a => a.name).join(', ') : (b.brand_name || 'Nhiều tác giả'),
      description: b.short_description || `Cuốn sách ${b.name} mang lại nội dung chất lượng cao và lôi cuốn người đọc.`,
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
  const TARGET_PER_CAT = 25;
  
  for (const cat of categories) {
    let catBooks = [];
    
    // Fetch specifically enough pages/keywords to reach TARGET_PER_CAT
    for (const kw of cat.keywords) {
      if (catBooks.length >= TARGET_PER_CAT) break;
      const items = await fetchFromTiki(kw, TARGET_PER_CAT - catBooks.length);
      
      // Prevent duplicates by title
      for (const item of items) {
        if (!catBooks.find(b => b.title === item.title) && item.imageUrl) {
          catBooks.push(item);
        }
      }
    }
    
    // Fill up if less than 25 using generic queries
    if (catBooks.length < TARGET_PER_CAT) {
      const extra = await fetchFromTiki('sách bán chạy', TARGET_PER_CAT - catBooks.length);
      for (const item of extra) {
        if (!catBooks.find(b => b.title === item.title) && item.imageUrl) {
          catBooks.push(item);
        }
      }
    }
    
    catBooks = catBooks.slice(0, TARGET_PER_CAT);
    catBooks.forEach(b => { 
      b.categorySlug = cat.slug; 
      b.type = cat.slug === 'manga' ? 'manga' : 'book'; 
    });
    console.log(`✅ Loaded ${catBooks.length} books for ${cat.slug}`);
    allBooks.push(...catBooks);
  }
  
  fs.writeFileSync('src/seed/books200.json', JSON.stringify(allBooks, null, 2));
  console.log(`✅ File saved with ${allBooks.length} books in src/seed/books200.json`);
}
run();
