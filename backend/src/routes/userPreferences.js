const express = require('express');
const { auth } = require('../middleware/auth');
const { getUserPreferences, updateUserPreferences } = require('../controllers/userPreferencesController');

const router = express.Router();

router.get('/', auth, getUserPreferences);
router.put('/', auth, updateUserPreferences);

module.exports = router;