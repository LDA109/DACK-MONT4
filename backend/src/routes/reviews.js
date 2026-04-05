const express = require('express');
const {
  getReviews,
  getReviewsByBook,
  createReview,
  updateReview,
  markHelpful,
  deleteReview,
  replyToReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');

const router = express.Router();

// Public routes
router.get('/', getReviews);
router.get('/book/:bookId', getReviewsByBook);

// Authenticated user routes
router.post('/', protect, createReview);
router.put('/:id', protect, updateReview);
router.post('/:id/helpful', protect, markHelpful);
router.delete('/:id', protect, deleteReview);

// Admin routes
router.put('/:id/reply', adminAuth, replyToReview);

module.exports = router;
