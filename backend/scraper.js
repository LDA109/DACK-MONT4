const fs = require('fs');


const books = [
  "Naruto - Tập 1",
  "One Piece - Tập 1",
  "Attack on Titan - Tập 1",
  "Demon Slayer - Tập 1",
  "Dragon Ball - Tập 1",
  "Hồ Điệp Và Kình Ngư",
  "Atomic Habits",
  "Đắc Nhân Tâm",
  "Nhà Giả Kim",
  "Tuổi Trẻ Đáng Giá Bao Nhiêu",
  "Nghĩ Giàu Làm Giàu",
  "Cha Giàu Cha Nghèo",
  "Doraemon Tập 1",
  "Lịch Sử Việt Nam Bằng Hình",
  "Lược Sử Loài Người",
  "Harry Potter Sorcerer's Stone",
  "Chú thuật hồi chiến tập 1",
  "Spy x Family - Tập 1",
  "Kimetsu No Yaiba - Tập 23"
];

async function searchCover(title) {
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(title)}`);
    const json = await res.json();
    if (json.items && json.items.length > 0) {
      const img = json.items[0].volumeInfo?.imageLinks?.thumbnail;
      if (img) return img.replace('http:', 'https:').replace('&zoom=1', '&zoom=0');
    }
    return null;
  } catch(e) {
    return null;
  }
}

async function run() {
  const results = {};
  for (const b of books) {
    const url = await searchCover(b);
    results[b] = url || "https://placehold.co/400x600/e53935/white?text=" + encodeURIComponent(b);
  }
  fs.writeFileSync('covers.json', JSON.stringify(results, null, 2));
}

run();
