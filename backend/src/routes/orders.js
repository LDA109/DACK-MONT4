const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getOrder, cancelOrder } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/', (req, res, next) => {
  console.log('[ROUTE] POST /orders received');
  next();
}, createOrder);
router.get('/my', getMyOrders);
router.get('/:id', getOrder);
router.put('/:id/cancel', cancelOrder);

module.exports = router;
