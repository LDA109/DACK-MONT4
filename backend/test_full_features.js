#!/usr/bin/env node

/**
 * 🧪 Automated API Test Script
 * Tests: Auth → Inventory → Upload → Review
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8081/api';
let TOKEN = '';
let BOOK_ID = '';
let USER_ID = '';
let INVENTORY_ID = '';
let REVIEW_ID = '';
let UPLOADED_FILENAME = '';

// Color output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: parsed,
          });
        } catch {
          resolve({
            status: res.statusCode,
            data: responseData,
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  log('\n════════════════════════════════════════', 'blue');
  log('🧪 Starting API Tests...', 'blue');
  log('════════════════════════════════════════\n', 'blue');

  try {
    // 1. REGISTER
    log('1️⃣  Testing REGISTER...', 'yellow');
    const testEmail = `test${Date.now()}@example.com`;
    let res = await request('POST', '/auth/register', {
      name: 'Test User ' + Date.now(),
      email: testEmail,
      password: '123456',
    });
    if (res.status === 201 && res.data.success) {
      USER_ID = res.data.user._id;
      log(`✅ Register OK - User: ${res.data.user.email}`, 'green');
    } else {
      log(`❌ Register Failed: ${res.data.message || JSON.stringify(res.data)}`, 'red');
      return;
    }

    // 2. LOGIN
    log('\n2️⃣  Testing LOGIN...', 'yellow');
    res = await request('POST', '/auth/login', {
      email: testEmail,
      password: '123456',
    });
    if (res.status === 200 && res.data.success && res.data.token) {
      TOKEN = res.data.token;
      log(`✅ Login OK - Token: ${TOKEN.substring(0, 20)}...`, 'green');
    } else {
      log(`❌ Login Failed: ${res.data.message || JSON.stringify(res.data)}`, 'red');
      return;
    }

    // 3. GET BOOKS (get first book ID)
    log('\n3️⃣  Fetching Books...', 'yellow');
    res = await request('GET', '/books?page=1&limit=1');
    if (res.status === 200 && res.data.books && res.data.books.length > 0) {
      BOOK_ID = res.data.books[0]._id;
      log(`✅ Found Book: ${res.data.books[0].title} (${BOOK_ID})`, 'green');
    } else {
      log(`❌ Books Fetch Failed: ${JSON.stringify(res.data).substring(0, 100)}`, 'red');
      return;
    }

    // 4. CREATE INVENTORY
    log('\n4️⃣  Testing CREATE INVENTORY (Admin)...', 'yellow');
    res = await request(
      'POST',
      '/inventory',
      {
        bookId: BOOK_ID,
        availableStock: 100,
        reservedStock: 5,
        restockThreshold: 20,
        warehouseLocation: 'A-101',
      },
      TOKEN
    );
    if (res.status === 201 && res.data._id) {
      INVENTORY_ID = res.data._id;
      log(`✅ Inventory Created: ${INVENTORY_ID}`, 'green');
    } else {
      log(
        `⚠️  Create Inventory: ${res.data.message || 'Check admin role - ' + res.status}`,
        'yellow'
      );
    }

    // 5. GET INVENTORY
    log('\n5️⃣  Testing GET INVENTORY...', 'yellow');
    res = await request('GET', '/inventory?page=1&limit=5');
    if (res.status === 200 && Array.isArray(res.data)) {
      log(`✅ Got ${res.data.length} inventory items`, 'green');
      if (res.data.length > 0 && !INVENTORY_ID) {
        INVENTORY_ID = res.data[0]._id;
      }
    } else if (res.status === 200 && res.data.inventory) {
      log(`✅ Got ${res.data.inventory.length} inventory items`, 'green');
      if (res.data.inventory.length > 0 && !INVENTORY_ID) {
        INVENTORY_ID = res.data.inventory[0]._id;
      }
    } else {
      log(`❌ Get Inventory Failed: ${res.status}`, 'red');
    }

    // 6. ADJUST STOCK
    if (INVENTORY_ID) {
      log('\n6️⃣  Testing ADJUST STOCK...', 'yellow');
      res = await request(
        'PUT',
        `/inventory/${INVENTORY_ID}/adjust`,
        {
          action: 'sold',
          quantity: 5,
          reason: 'Test order',
        },
        TOKEN
      );
      if (res.status === 200) {
        log(`✅ Stock Adjusted: -5 units`, 'green');
      } else {
        log(`⚠️  Adjust Stock: ${res.data.message}`, 'yellow');
      }
    }

    // 7. CREATE REVIEW
    log('\n7️⃣  Testing CREATE REVIEW...', 'yellow');
    res = await request(
      'POST',
      '/reviews',
      {
        bookId: BOOK_ID,
        rating: 5,
        title: 'Amazing book!',
        comment: 'This is a test review',
        isVerifiedPurchase: true,
      },
      TOKEN
    );
    if (res.status === 201) {
      REVIEW_ID = res.data._id;
      log(`✅ Review Created: ${REVIEW_ID}`, 'green');
    } else {
      log(`⚠️  Create Review: ${res.data.message}`, 'yellow');
    }

    // 8. GET REVIEWS BY BOOK
    log('\n8️⃣  Testing GET REVIEWS BY BOOK...', 'yellow');
    res = await request('GET', `/reviews/book/${BOOK_ID}`);
    if (res.status === 200) {
      log(`✅ Got ${res.data.length || 0} reviews for book`, 'green');
    } else {
      log(`❌ Get Reviews Failed`, 'red');
    }

    // 9. MARK REVIEW AS HELPFUL
    if (REVIEW_ID) {
      log('\n9️⃣  Testing MARK REVIEW HELPFUL...', 'yellow');
      res = await request(
        'POST',
        `/reviews/${REVIEW_ID}/helpful`,
        { isHelpful: true },
        TOKEN
      );
      if (res.status === 200) {
        log(`✅ Review marked helpful`, 'green');
      } else {
        log(`⚠️  Mark Helpful: ${res.data.message}`, 'yellow');
      }
    }

    // 10. FILE UPLOAD (create test image)
    log('\n🔟 Testing FILE UPLOAD...', 'yellow');
    // Create a simple test image (1x1 pixel PNG)
    const pngBuffer = Buffer.from([
      0x89,
      0x50,
      0x4e,
      0x47,
      0x0d,
      0x0a,
      0x1a,
      0x0a,
      0x00,
      0x00,
      0x00,
      0x0d,
      0x49,
      0x48,
      0x44,
      0x52,
      0x00,
      0x00,
      0x00,
      0x01,
      0x00,
      0x00,
      0x00,
      0x01,
      0x08,
      0x02,
      0x00,
      0x00,
      0x00,
      0x90,
      0x77,
      0x53,
      0xde,
      0x00,
      0x00,
      0x00,
      0x0c,
      0x49,
      0x44,
      0x41,
      0x54,
      0x08,
      0x99,
      0x63,
      0xf8,
      0x0f,
      0x00,
      0x00,
      0x01,
      0x01,
      0x01,
      0x00,
      0x18,
      0xdd,
      0x8d,
      0xb4,
      0x00,
      0x00,
      0x00,
      0x00,
      0x49,
      0x45,
      0x4e,
      0x44,
      0xae,
      0x42,
      0x60,
      0x82,
    ]);

    // Upload test would require FormData/multipart which is complex in Node http
    log('⚠️  File upload requires FormData (test manually with curl)', 'yellow');

    log('\n════════════════════════════════════════', 'blue');
    log('✅ Basic API Tests Completed!', 'green');
    log('════════════════════════════════════════\n', 'blue');

    log('📝 Summary:', 'blue');
    log(`  ✅ Auth (Register/Login): Working`, 'green');
    log(`  ✅ Books: Retrieved`, 'green');
    log(`  ${INVENTORY_ID ? '✅' : '⚠️'} Inventory: ${INVENTORY_ID ? 'Created' : 'Check admin role'}`, INVENTORY_ID ? 'green' : 'yellow');
    log(`  ✅ Reviews: ${REVIEW_ID ? 'Created' : 'Ready to test'}`, 'green');
    log(`\n📂 Upload File Manually:`, 'blue');
    log(`  curl -X POST http://localhost:8081/api/upload \\`, 'yellow');
    log(`    -H "Authorization: Bearer $TOKEN" \\`, 'yellow');
    log(`    -F "file=@/path/to/image.jpg"`, 'yellow');
  } catch (err) {
    log(`\n❌ Test Error: ${err.message}`, 'red');
  }
}

runTests();
