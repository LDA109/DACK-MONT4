# 🧪 TEST INVENTORY & UPLOAD - Step by Step

## ✅ Prerequisites
- Backend running: http://localhost:8081
- Frontend running: http://localhost:5173

---

## 📝 QUICK TEST (Copy-Paste Commands)

### Step 1: Register User & Get Token
```powershell
$body = @{name="TestUser$(Get-Random)"; email="test$(Get-Random)@test.com"; password="123456"} | ConvertTo-Json
$resp = Invoke-WebRequest -Uri "http://localhost:8081/api/auth/register" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body -UseBasicParsing
$data = $resp.Content | ConvertFrom-Json
$TOKEN = $data.token
Write-Host "✅ Token: $($TOKEN.Substring(0,25))..."
```

### Step 2: Get Book ID
```powershell
$books = Invoke-WebRequest -Uri "http://localhost:8081/api/books?page=1&limit=1" -UseBasicParsing
$result = $books.Content | ConvertFrom-Json
$BOOK_ID = $result.books[0]._id
$BOOK_TITLE = $result.books[0].title
Write-Host "✅ Book: $BOOK_TITLE ($BOOK_ID)"
```

### Step 3: Test GET INVENTORY (Public)
```powershell
$inv = Invoke-WebRequest -Uri "http://localhost:8081/api/inventory?page=1&limit=5" -UseBasicParsing
$inv.Content | ConvertFrom-Json | ConvertTo-Json
```

**Expected Response:** Array of inventory records
```json
[
  {
    "_id": "...",
    "bookId": "...",
    "availableStock": 100,
    "reservedStock": 5,
    "trackingHistory": [...]
  }
]
```

---

### Step 4: Test CREATE REVIEW (Authenticated)
```powershell
$review = @{
  bookId = $BOOK_ID
  rating = 5
  title = "Amazing Book!"
  comment = "Highly recommend this book. Very good content."
  isVerifiedPurchase = $true
} | ConvertTo-Json

$rev = Invoke-WebRequest -Uri "http://localhost:8081/api/reviews" `
  -Method POST `
  -Headers @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $TOKEN"
  } `
  -Body $review `
  -UseBasicParsing

$revData = $rev.Content | ConvertFrom-Json
$REVIEW_ID = $revData._id
Write-Host "✅ Review Created: $REVIEW_ID"
```

**Expected Response:**
```json
{
  "success": true,
  "_id": "...",
  "bookId": "...",
  "userId": "...",
  "rating": 5,
  "title": "Amazing Book!",
  "comment": "Highly recommend this book...",
  "isVerifiedPurchase": true,
  "helpful": 0,
  "createdAt": "2026-04-05T..."
}
```

---

### Step 5: Test GET REVIEWS FOR BOOK
```powershell
$reviews = Invoke-WebRequest -Uri "http://localhost:8081/api/reviews/book/$BOOK_ID" -UseBasicParsing
$reviews.Content | ConvertFrom-Json | ConvertTo-Json
```

**Expected:** Array containing your review

---

### Step 6: Test MARK REVIEW HELPFUL (Authenticated)
```powershell
$helpful = @{isHelpful = $true} | ConvertTo-Json

$mark = Invoke-WebRequest -Uri "http://localhost:8081/api/reviews/$REVIEW_ID/helpful" `
  -Method POST `
  -Headers @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $TOKEN"
  } `
  -Body $helpful `
  -UseBasicParsing

$mark.Content | ConvertFrom-Json | ConvertTo-Json
```

---

### Step 7: Test FILE UPLOAD (Authenticated)
```powershell
# Create a test image
Add-Type -AssemblyName System.Drawing
$img = New-Object System.Drawing.Bitmap(100, 100)
$img.SavePng("test-image.png")

# Upload file
$file = Get-Item "test-image.png"
$form = @{file = $file}

$upload = Invoke-WebRequest -Uri "http://localhost:8081/api/upload" `
  -Method POST `
  -Headers @{"Authorization" = "Bearer $TOKEN"} `
  -Form $form `
  -UseBasicParsing

$uploadData = $upload.Content | ConvertFrom-Json
Write-Host "✅ Uploaded: $($uploadData.file.filename)"
Write-Host "✅ URL: http://localhost:8081$($uploadData.file.url)"
```

**Expected Response:**
```json
{
  "success": true,
  "file": {
    "filename": "file-1712282400000.png",
    "url": "/uploads/file-1712282400000.png",
    "size": 2048,
    "mimetype": "image/png"
  }
}
```

---

### Step 8: Test DELETE REVIEW (Authenticated)
```powershell
$delete = Invoke-WebRequest -Uri "http://localhost:8081/api/reviews/$REVIEW_ID" `
  -Method DELETE `
  -Headers @{"Authorization" = "Bearer $TOKEN"} `
  -UseBasicParsing

$delete.Content | ConvertFrom-Json | ConvertTo-Json
```

---

## 📂 Test via Browser (Frontend)

1. Open http://localhost:5173
2. **Register/Login** → Credential passed via JWT
3. **Browse Books** → Test API integration
4. **View Reviews** → See reviews section for each book
5. **Write Review** → Test review creation
6. **Upload Avatar** → Test file upload feature

---

## 🔍 Admin Tests (If you have admin credentials)

### Create Inventory (Admin only)
```powershell
$inventory = @{
  bookId = $BOOK_ID
  availableStock = 150
  reservedStock = 10
  restockThreshold = 30
  warehouseLocation = "A-101"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8081/api/inventory" `
  -Method POST `
  -Headers @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $ADMIN_TOKEN"
  } `
  -Body $inventory `
  -UseBasicParsing
```

### Adjust Stock (Admin only)
```powershell
$adjust = @{
  action = "sold"
  quantity = 5
  reason = "Customer order #123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8081/api/inventory/$INVENTORY_ID/adjust" `
  -Method PUT `
  -Headers @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $ADMIN_TOKEN"
  } `
  -Body $adjust `
  -UseBasicParsing
```

---

## ✅ Test Checklist

- [ ] Register new user
- [ ] Login and get JWT token
- [ ] Get books list
- [ ] View inventory (GET /api/inventory)
- [ ] Create review (POST /api/reviews)
- [ ] Get reviews for book
- [ ] Mark review helpful
- [ ] Upload file (image/pdf)
- [ ] Delete review
- [ ] (Admin) Create inventory
- [ ] (Admin) Adjust stock

---

## 🐛 Troubleshooting

**"Cannot connect to localhost:8081"**
- Backend not running. Run `npm start` in backend folder

**"Invalid token"**
- Token expired or invalid. Register/login again

**"File upload failed"**
- Check file size (max 10MB)
- Check file type (JPEG, PNG, GIF, WebP, PDF)

**"Need admin role"**
- Create an admin user or use existing admin account
