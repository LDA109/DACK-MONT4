const Inventory = require('../models/Inventory');
const Book = require('../models/Book');

// @GET /api/inventory - Get all inventory
const getInventory = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, needsRestock } = req.query;
    const query = {};

    if (search) {
      const book = await Book.findOne({
        title: { $regex: search, $options: 'i' },
      });
      if (book) query.book = book._id;
    }

    let inventories = await Inventory.find(query)
      .populate('book', 'title author price stock')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    if (needsRestock === 'true') {
      inventories = inventories.filter(inv => inv.availableStock <= inv.restockThreshold);
    }

    const total = await Inventory.countDocuments(query);
    res.json({
      success: true,
      data: inventories,
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

// @GET /api/inventory/:id - Get inventory by book ID
const getInventoryByBook = async (req, res) => {
  try {
    const inventory = await Inventory.findOne({ book: req.params.id })
      .populate('book', 'title author price');
    
    if (!inventory) {
      return res.status(404).json({ success: false, message: 'Inventory not found' });
    }

    res.json({ success: true, data: inventory });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/inventory - Create inventory for a book
const createInventory = async (req, res) => {
  try {
    const { book, bookId, totalStock, availableStock, restockThreshold, supplier, unitCost, warehouseLocation } = req.body;
    const bookRef = book || bookId; // Accept both 'book' and 'bookId'

    if (!bookRef) {
      return res.status(400).json({ success: false, message: 'bookId is required' });
    }

    const existingInventory = await Inventory.findOne({ book: bookRef });
    if (existingInventory) {
      return res.status(400).json({ success: false, message: 'Inventory already exists for this book' });
    }

    const inventory = await Inventory.create({
      book: bookRef,
      totalStock: totalStock || 0,
      availableStock: availableStock || 0,
      restockThreshold: restockThreshold || 20,
      supplier: supplier || '',
      unitCost: unitCost || 0,
      warehouseLocation: warehouseLocation || 'A-101',
    });

    await inventory.populate('book', 'title author price stock');
    res.status(201).json({ success: true, data: inventory });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @PUT /api/inventory/:id - Update inventory
const updateInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('book', 'title author price stock');

    if (!inventory) {
      return res.status(404).json({ success: false, message: 'Inventory not found' });
    }

    res.json({ success: true, data: inventory });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @PUT /api/inventory/:id/adjust - Adjust stock with tracking
const adjustStock = async (req, res) => {
  try {
    const { quantity, action, reason, reference } = req.body;

    if (!quantity || !action) {
      return res.status(400).json({ success: false, message: 'Quantity and action are required' });
    }

    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ success: false, message: 'Inventory not found' });
    }

    // Add to tracking history
    inventory.trackingHistory.push({
      action,
      quantity,
      reason: reason || '',
      reference: reference || '',
    });

    // Update stock based on action
    if (action === 'restock') {
      inventory.totalStock += quantity;
      inventory.availableStock += quantity;
      inventory.lastRestockDate = Date.now();
    } else if (action === 'sold') {
      inventory.availableStock = Math.max(0, inventory.availableStock - quantity);
    } else if (action === 'reserved') {
      inventory.reservedStock += quantity;
      inventory.availableStock = Math.max(0, inventory.availableStock - quantity);
    } else if (action === 'returned') {
      inventory.totalStock += quantity;
      inventory.availableStock += quantity;
      inventory.reservedStock = Math.max(0, inventory.reservedStock - quantity);
    } else if (action === 'adjustment') {
      inventory.availableStock = Math.max(0, inventory.availableStock + quantity);
    }

    await inventory.save();
    res.json({ success: true, data: inventory });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @DELETE /api/inventory/:id - Delete inventory
const deleteInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndDelete(req.params.id);

    if (!inventory) {
      return res.status(404).json({ success: false, message: 'Inventory not found' });
    }

    res.json({ success: true, message: 'Inventory deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/inventory/seed/auto - Auto create inventory for all books without inventory
const seedInventory = async (req, res) => {
  try {
    const books = await Book.find({}).select('_id stock title price');
    const existingInventories = await Inventory.find({}).select('book');
    const existingBookIds = new Set(existingInventories.map(inv => inv.book?.toString()));

    const booksWithoutInventory = books.filter(book => !existingBookIds.has(book._id.toString()));

    if (booksWithoutInventory.length === 0) {
      return res.json({ success: true, message: 'All books already have inventory', created: 0 });
    }

    // Generate random warehouse locations (A-Z, 101-110)
    const generateLocation = (index) => {
      const zone = String.fromCharCode(65 + (index % 26)); // A-Z
      const bay = 101 + Math.floor(index / 26) % 10; // 101-110
      return `${zone}-${bay}`;
    };

    const newInventories = booksWithoutInventory.map((book, index) => ({
      book: book._id,
      availableStock: Math.max(book.stock || 100, 50), // Min 50 items
      reservedStock: 0,
      restockThreshold: 20,
      warehouseLocation: generateLocation(index),
      trackingHistory: [
        {
          action: 'restock',
          quantity: Math.max(book.stock || 100, 50),
          reason: `Auto seed - ${book.title}`,
          date: new Date(),
        },
      ],
    }));

    const created = await Inventory.insertMany(newInventories);
    res.status(201).json({ 
      success: true, 
      message: `Created ${created.length} inventory entries`,
      created: created.length,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  getInventory,
  getInventoryByBook,
  createInventory,
  updateInventory,
  adjustStock,
  deleteInventory,
  seedInventory,
};
