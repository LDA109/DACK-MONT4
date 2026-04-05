#!/usr/bin/env node

/**
 * 🧪 INVENTORY + UPLOAD TEST GUIDE
 * Copy-paste these PowerShell commands one by one
 */

console.log(`
╔═══════════════════════════════════════════════════════════╗
║           INVENTORY & UPLOAD TEST GUIDE                  ║
║  Run these commands one by one in PowerShell             ║
╚═══════════════════════════════════════════════════════════╝

🔴 FIRST: Make sure backend is running:
   http://localhost:8081/api/books

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 STEP 1: Register & Get Token
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

\$body = @{
  name="Test User $(Get-Random)"
  email="user$(Get-Random)@test.com"
  password="123456"
} | ConvertTo-Json

\$resp = Invoke-WebRequest -Uri "http://localhost:8081/api/auth/register" \
  -Method POST -Headers @{"Content-Type"="application/json"} \
  -Body \$body -UseBasicParsing

\$result = \$resp.Content | ConvertFrom-Json
\$TOKEN = \$result.token
\$EMAIL = \$result.user.email

Write-Host "✅ Created user: \$EMAIL" -ForegroundColor Green
Write-Host "✅ Token: \$(\$TOKEN.Substring(0,30))..." -ForegroundColor Green

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 STEP 2: Get Book ID
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

\$books = Invoke-WebRequest -Uri "http://localhost:8081/api/books?page=1&limit=1" \
  -UseBasicParsing

\$bookData = \$books.Content | ConvertFrom-Json
\$BOOK_ID = \$bookData.books[0]._id
\$BOOK_TITLE = \$bookData.books[0].title

Write-Host "✅ Book: \$BOOK_TITLE (\$BOOK_ID)" -ForegroundColor Green

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ STEP 3: Test GET INVENTORY (PUBLIC)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Invoke-WebRequest -Uri "http://localhost:8081/api/inventory?page=1&limit=5" \
  -UseBasicParsing | % { \$_.Content | ConvertFrom-Json } | ConvertTo-Json

Expected: Array of inventory items

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ STEP 4: Test CREATE REVIEW (AUTHENTICATED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

\$review = @{
  bookId="\$BOOK_ID"
  rating=5
  title="Excellent Book!"
  comment="This book is amazing. Highly recommend it."
  isVerifiedPurchase=\$true
} | ConvertTo-Json

\$rev = Invoke-WebRequest -Uri "http://localhost:8081/api/reviews" \
  -Method POST \
  -Headers @{
    "Content-Type"="application/json"
    "Authorization"="Bearer \$TOKEN"
  } \
  -Body \$review \
  -UseBasicParsing

\$revData = \$rev.Content | ConvertFrom-Json
\$REVIEW_ID = \$revData._id

Write-Host "✅ Review Created: \$REVIEW_ID" -ForegroundColor Green

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ STEP 5: Test GET REVIEWS FOR BOOK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Invoke-WebRequest -Uri "http://localhost:8081/api/reviews/book/\$BOOK_ID" \
  -UseBasicParsing | % { \$_.Content | ConvertFrom-Json } | ConvertTo-Json

Expected: Array with your review

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ STEP 6: Test UPLOAD FILE (AUTHENTICATED)  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Create a test image file
Add-Type -AssemblyName System.Drawing
\$img = New-Object System.Drawing.Bitmap(100, 100)
\$img.Save("test-image.png")

# Upload it
\$file = Get-Item "test-image.png"
\$form = @{file = \$file}

\$upload = Invoke-WebRequest -Uri "http://localhost:8081/api/upload" \
  -Method POST \
  -Headers @{"Authorization"="Bearer \$TOKEN"} \
  -Form \$form \
  -UseBasicParsing

\$uploadData = \$upload.Content | ConvertFrom-Json
\$FILENAME = \$uploadData.file.filename
\$FILE_URL = \$uploadData.file.url

Write-Host "✅ File Uploaded: \$FILENAME" -ForegroundColor Green
Write-Host "✅ URL: http://localhost:8081\$FILE_URL" -ForegroundColor Green

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 NOTES:
  • Replace \$TOKEN, \$BOOK_ID with actual values from previous steps
  • All Review endpoints are available (GET, POST, PUT, DELETE)
  • Upload supports: JPEG, PNG, GIF, WebP, PDF (max 10MB)
  • Inventory requires ADMIN role to create/update/delete
  • Store \$TOKEN in variable to reuse across commands

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
