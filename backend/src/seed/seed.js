const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: 'e:\\Study\\IT\\Môn T4\\DO AN\\backend\\.env' });


const Book = require('../models/Book');
const Category = require('../models/Category');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bookstore';

const imgs = [
  "https://salt.tikicdn.com/cache/750x750/ts/product/84/bb/a9/18a25cd550d32e6de7e2d09c85458b15.jpg",
  "https://salt.tikicdn.com/cache/750x750/ts/product/0a/02/05/16a86b995ce76bdaa6326388bafe41d1.jpg",
  "https://salt.tikicdn.com/cache/750x750/ts/product/50/9b/6e/58f555687eb4adcd01b93fd61177aaf1.jpg",
  "https://salt.tikicdn.com/cache/750x750/ts/product/2c/d6/28/b69548f34844f9c457f69cfd27112222.jpg",
  "https://salt.tikicdn.com/cache/750x750/ts/product/05/83/66/42ed0361d105e143684508112813be86.jpg",
  "https://salt.tikicdn.com/cache/750x750/ts/product/d8/db/13/59f27f3a78a3b93d1553b93988fb9d6b.jpg",
  "https://salt.tikicdn.com/cache/750x750/ts/product/10/01/7a/d7d57affcfba13e7f75d74d1e858e41e.jpg",
  "https://salt.tikicdn.com/cache/750x750/ts/product/b4/92/39/6166e003d4a9d4b697596f1743b41b95.jpg",
  "https://salt.tikicdn.com/cache/750x750/ts/product/45/3b/fc/aa81d0a534b45706ae1eee1e344e80d9.jpg",
  "https://salt.tikicdn.com/cache/750x750/ts/product/56/ce/23/64b2eaa5b859d8ba1412f1b350c3e128.jpg",
  "https://salt.tikicdn.com/cache/750x750/ts/product/31/de/51/f41cc9ce23de5579fa5b3adc06409e37.jpg",
  "https://salt.tikicdn.com/cache/750x750/ts/product/17/02/d1/52dde080f00d414a2d441c544c76d9c9.jpg",
  "https://salt.tikicdn.com/cache/750x750/ts/product/76/f3/03/c0ba0a5b7d1b3d0df993efbdd068cb47.png",
  "https://salt.tikicdn.com/cache/750x750/ts/product/71/4d/fd/6b78e4a1728c2d9b09d79207dce94768.jpg",
  "https://salt.tikicdn.com/cache/750x750/ts/product/54/44/ec/20755ddad37cc1e7477f9a98aed12c77.jpg",
  "https://salt.tikicdn.com/cache/750x750/ts/product/40/e8/43/e3f4b1f6651ef3814d79e8e0d8f5ddba.jpg",
  "https://salt.tikicdn.com/cache/750x750/ts/product/d0/25/df/f2bc900fdfbbfebf32dd7520e53186ac.jpg",
  "https://salt.tikicdn.com/cache/750x750/ts/product/0e/d0/5b/53b0c4426f762f49b38ac591e7414ba8.jpg",
  "https://salt.tikicdn.com/cache/750x750/ts/product/7d/01/00/a848a1d41073080b70553a83440ea96b.jpg"
];

const seedData = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear
  await Book.deleteMany({});
  await Category.deleteMany({});
  await User.deleteMany({ email: 'admin@bookstore.com' });

  // Categories
  const categories = await Category.insertMany([
    { name: 'Manga', slug: 'manga', icon: '🎌', order: 1, description: 'Truyện tranh Nhật Bản' },
    { name: 'Văn học', slug: 'van-hoc', icon: '📖', order: 2, description: 'Tiểu thuyết, truyện ngắn' },
    { name: 'Tâm lý - Kỹ năng sống', slug: 'tam-ly-ky-nang', icon: '🧠', order: 3, description: 'Phát triển bản thân' },
    { name: 'Kinh tế', slug: 'kinh-te', icon: '💼', order: 4, description: 'Kinh doanh, tài chính' },
    { name: 'Thiếu nhi', slug: 'thieu-nhi', icon: '🧒', order: 5, description: 'Sách dành cho trẻ em' },
    { name: 'Lịch sử - Địa lý', slug: 'lich-su-dia-ly', icon: '🌍', order: 6, description: 'Lịch sử, địa lý Việt Nam và thế giới' },
    { name: 'Khoa học', slug: 'khoa-hoc', icon: '🔬', order: 7, description: 'Khoa học tự nhiên, công nghệ' },
    { name: 'Ngoại văn', slug: 'ngoai-van', icon: '🌐', order: 8, description: 'Sách tiếng Anh và nước ngoài' },
  ]);

  const [manga, vanHoc, tamLy, kinhTe, thieuNhi, lichSu, khoaHoc, ngoaiVan] = categories;

  // Admin user
  await User.create({
    name: 'Admin',
    email: 'admin@bookstore.com',
    password: 'admin123',
    role: 'admin',
    avatar: 'https://ui-avatars.com/api/?name=Admin&background=e53935&color=fff',
  });
  console.log('✅ Admin created: admin@bookstore.com / admin123');

  // Load 200 books
  const booksData = JSON.parse(fs.readFileSync(path.join(__dirname, 'books200.json'), 'utf-8'));
  
  const books = booksData.map(b => {
    const cat = categories.find(c => c.slug === b.categorySlug);
    let extraTags = [];
    if (b.categorySlug === 'manga') {
      const title = (b.title || '').toLowerCase();
      if (title.includes('nana') || title.includes('shoujo')) extraTags.push('shoujo');
      else if (title.includes('slime') || title.includes('chuyển sinh') || title.includes('tái sinh')) extraTags.push('isekai');
      else if (title.includes('doraemon') || title.includes('spy x family')) extraTags.push('sliceoflife');
      else if (title.includes('conan') || title.includes('kinh dị')) extraTags.push('mystery');
      else extraTags.push('shounen');
    }
    return {
      ...b,
      tags: [...(b.tags || []), ...extraTags],
      category: cat ? cat._id : categories[0]._id,
      categoryName: cat ? cat.name : categories[0].name
    };
  });

  await Book.insertMany(books);
  console.log(`✅ Seeded ${books.length} books`);
  console.log('✅ Seeded categories and admin user');
  process.exit(0);
};

seedData().catch(err => {
  console.error(err);
  process.exit(1);
});
