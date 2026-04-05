const Review = require('../models/Review');
const Book = require('../models/Book');

// @GET /api/reviews - Get all reviews (with pagination and filters)
const getReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, book, user, rating, verified } = req.query;
    const query = { isActive: true };

    if (book) query.book = book;
    if (user) query.user = user;
    if (rating) query.rating = Number(rating);
    if (verified === 'true') query.verified = true;

    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .populate('book', 'title')
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/reviews/book/:bookId - Get reviews for a book
const getReviewsByBook = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'helpful' } = req.query;

    const sortObj = {
      newest: { createdAt: -1 },
      helpful: { helpful: -1 },
      rating_high: { rating: -1 },
      rating_low: { rating: 1 },
    };

    const reviews = await Review.find({ book: req.params.bookId, isActive: true })
      .populate('user', 'name avatar')
      .sort(sortObj[sortBy] || { createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await Review.countDocuments({ book: req.params.bookId, isActive: true });

    // Calculate average rating
    const allReviews = await Review.find({ book: req.params.bookId, isActive: true });
    const avgRating = allReviews.length > 0
      ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: reviews,
      stats: {
        averageRating: avgRating,
        totalReviews: total,
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/reviews - Create a review
const createReview = async (req, res) => {
  try {
    const { book, bookId, rating, title, comment, images, isVerifiedPurchase } = req.body;
    const userId = req.user._id;
    const bookRef = book || bookId; // Accept both 'book' and 'bookId'

    // Validation
    if (!bookRef) {
      return res.status(400).json({ success: false, message: 'Book ID is required' });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (!comment || !comment.trim()) {
      return res.status(400).json({ success: false, message: 'Comment is required' });
    }

    // Check if book exists
    const bookExists = await Book.findById(bookRef);
    if (!bookExists) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    // Check for duplicate review
    const existingReview = await Review.findOne({ book: bookRef, user: userId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You already reviewed this book' });
    }

    const review = await Review.create({
      book: bookRef,
      user: userId,
      rating: Number(rating),
      title: title.trim(),
      comment: comment.trim(),
      images: images || [],
      verified: isVerifiedPurchase || false,
    });

    await review.populate('user', 'name avatar');

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    console.error('[REVIEW] Create error:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// @PUT /api/reviews/:id - Update own review
const updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Check ownership
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this review' });
    }

    const { rating, title, comment, images } = req.body;

    if (rating) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (comment !== undefined) review.comment = comment;
    if (images) review.images = images;

    await review.save();
    await review.populate('user', 'name avatar');

    res.json({ success: true, data: review });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @PUT /api/reviews/:id/helpful - Mark review as helpful
const markHelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const { isHelpful } = req.body;

    if (isHelpful) {
      review.helpful += 1;
    } else {
      review.unhelpful += 1;
    }

    await review.save();
    res.json({ success: true, data: review });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @DELETE /api/reviews/:id - Delete review (soft delete)
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Check ownership
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
    }

    review.isActive = false;
    await review.save();

    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/reviews/:id/reply (Admin) - Reply to review
const replyToReview = async (req, res) => {
  try {
    const { comment } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admin can reply' });
    }

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      {
        replied: true,
        adminReply: {
          comment,
          date: Date.now(),
        },
      },
      { new: true }
    ).populate('user', 'name avatar');

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    res.json({ success: true, data: review });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  getReviews,
  getReviewsByBook,
  createReview,
  updateReview,
  markHelpful,
  deleteReview,
  replyToReview,
};
