const Book = require('../models/Book');

// @GET /api/books - List with filter + search + sort + paginate
const getBooks = async (req, res) => {
  try {
    const {
      page = 1, limit = 12,
      search, category, type, minPrice, maxPrice, tags,
      sort = 'createdAt',
      order = 'desc',
      isFlashSale, isBestseller, isTrending,
    } = req.query;

    const query = { isActive: true };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { publisher: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) query.category = category;
    if (type) query.type = type;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (isFlashSale === 'true') query.isFlashSale = true;
    if (isBestseller === 'true') query.isBestseller = true;
    if (isTrending === 'true') query.isTrending = true;

    // Smart sort
    const sortMap = {
      'price-asc': { price: 1 },
      'price-desc': { price: -1 },
      'newest': { createdAt: -1 },
      'bestselling': { sold: -1 },
      'rating': { rating: -1 },
      'discount': { discount: -1 },
      'name-asc': { title: 1 },
      'name-desc': { title: -1 },
    };
    const sortObj = sortMap[sort] || { [sort]: order === 'asc' ? 1 : -1 };

    const total = await Book.countDocuments(query);
    const books = await Book.find(query)
      .populate('category', 'name slug icon')
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    // Auto-log search history nếu user đã login
    if (req.user) {
      require('../models/SearchHistory').create({
        user: req.user._id,
        keyword: search || '',
        filters: { category, minPrice, maxPrice },
        resultsCount: books.length
      }).catch(err => console.log('SearchHistory error:', err));
    }

    res.json({
      success: true,
      data: books,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/books/flash-sale
const getFlashSale = async (req, res) => {
  try {
    const books = await Book.find({ isFlashSale: true, isActive: true })
      .populate('category', 'name slug')
      .sort({ discount: -1 }).limit(10).lean();
    res.json({ success: true, data: books });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/books/bestsellers
const getBestsellers = async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;
    const query = { isBestseller: true, isActive: true };
    if (category) query.category = category;
    const books = await Book.find(query)
      .populate('category', 'name slug')
      .sort({ sold: -1 }).limit(Number(limit)).lean();
    res.json({ success: true, data: books });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/books/trending
const getTrending = async (req, res) => {
  try {
    const books = await Book.find({ isTrending: true, isActive: true })
      .populate('category', 'name slug')
      .sort({ sold: -1 }).limit(10).lean();
    res.json({ success: true, data: books });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/books/featured
const getFeatured = async (req, res) => {
  try {
    const books = await Book.find({ isFeatured: true, isActive: true })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 }).limit(8).lean();
    res.json({ success: true, data: books });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/books/:id
const getBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate('category', 'name slug icon').lean();
    if (!book) return res.status(404).json({ message: 'Không tìm thấy sách.' });
    // Related books
    const related = await Book.find({
      category: book.category._id,
      _id: { $ne: book._id },
      isActive: true,
    }).limit(6).lean();
    res.json({ success: true, data: book, related });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getBooks, getFlashSale, getBestsellers, getTrending, getFeatured, getBook };
