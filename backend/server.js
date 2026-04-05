const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");

dotenv.config();
connectDB();

const app = express();

// Log environment on startup
console.log("═══════════════════════════════════════════════════════");
console.log("📋 ENVIRONMENT CONFIGURATION");
console.log("═══════════════════════════════════════════════════════");
console.log("PORT:", process.env.PORT || 8081);
console.log("MONGO_URI:", process.env.MONGO_URI ? "✅ SET" : "❌ NOT SET");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "✅ SET" : "❌ NOT SET");
console.log("CLIENT_URL:", process.env.CLIENT_URL || "http://localhost:5173");
console.log(
  "VNP_TMN_CODE:",
  process.env.VNP_TMN_CODE ? "✅ SET" : "❌ NOT SET",
);
console.log(
  "VNP_HASH_SECRET:",
  process.env.VNP_HASH_SECRET ? "✅ SET" : "❌ NOT SET",
);
console.log(
  "VNPAY_URL:",
  process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
);
console.log(
  "FRONTEND_URL:",
  process.env.FRONTEND_URL || "http://localhost:5173",
);
console.log("═══════════════════════════════════════════════════════\n");

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));

// File upload middleware
const fileUpload = require("express-fileupload");
app.use(
  fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 },
    useTempFiles: false,
  }),
);

// Serve uploaded files statically
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 🚀 Routes configuration
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/books', require('./src/routes/books'));
app.use('/api/categories', require('./src/routes/categories'));
app.use('/api/cart', require('./src/routes/cart'));
app.use('/api/orders', require('./src/routes/orders'));
app.use('/api/payment', require('./src/routes/payment'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/coupon', require('./src/routes/couponRoutes'));
app.use('/api/ai', require('./src/routes/aiRoutes'));
app.use('/api/upload', require('./src/routes/upload'));
app.use('/api/inventory', require('./src/routes/inventory'));
app.use('/api/reviews', require('./src/routes/reviews'));
app.use('/api/notifications', require('./src/routes/notification'));
app.use('/api/wishlist', require('./src/routes/wishlist'));
app.use('/api/search-history', require('./src/routes/searchHistory'));
app.use('/api/user-preferences', require('./src/routes/userPreferences'));

app.get('/api/health', (req, res) =>
  res.json({ status: 'OK', message: 'BookStore API v1.0' }),
);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || "Internal Server Error" });
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});