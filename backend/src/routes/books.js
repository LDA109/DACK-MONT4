const express = require('express');
const router = express.Router();
const { getBooks, getFlashSale, getBestsellers, getTrending, getFeatured, getBook } = require('../controllers/bookController');

router.get('/', getBooks);
router.get('/flash-sale', getFlashSale);
router.get('/bestsellers', getBestsellers);
router.get('/trending', getTrending);
router.get('/featured', getFeatured);
router.get('/:id', getBook);

module.exports = router;
