const express = require('express');
const { protect } = require('../middleware/auth');
const { getUserPreferences, updateUserPreferences } = require('../controllers/userPreferencesController');

const router = express.Router();

router.get('/', protect, getUserPreferences);
router.put('/', protect, updateUserPreferences);

module.exports = router;