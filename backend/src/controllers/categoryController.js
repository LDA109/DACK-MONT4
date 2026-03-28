const Category = require('../models/Category');

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1 }).lean();
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getCategory = async (req, res) => {
  try {
    const cat = await Category.findOne({ slug: req.params.slug });
    if (!cat) return res.status(404).json({ message: 'Không tìm thấy danh mục.' });
    res.json({ success: true, data: cat });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getCategories, getCategory };
