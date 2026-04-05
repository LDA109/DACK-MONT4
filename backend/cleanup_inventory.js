const mongoose = require('mongoose');
require('dotenv').config();

const Inventory = require('./src/models/Inventory');

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔌 Connected to MongoDB');

    const result = await Inventory.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} inventory records`);

    await mongoose.disconnect();
    console.log('✅ Done!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

cleanup();
