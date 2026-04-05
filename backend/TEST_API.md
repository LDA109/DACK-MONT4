# 🧪 TEST INVENTORY & UPLOAD ENDPOINTS

## 1️⃣ SETUP - Lấy JWT Token

### Register User:
```bash
curl -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "123456"
  }'
```

### Login:
```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456"
  }' | jq -r '.token'
```

## 2️⃣ INVENTORY ENDPOINTS

### Get All Inventory (PUBLIC):
```bash
curl http://localhost:8081/api/inventory?page=1&limit=10
```

### Get Inventory by Book (PUBLIC):
```bash
# First, get a book ID from /api/books
curl http://localhost:8081/api/inventory/book/[BOOK_ID]
```

### Create Inventory (ADMIN):
```bash
TOKEN="YOUR_JWT_TOKEN_HERE"
curl -X POST http://localhost:8081/api/inventory \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookId": "BOOK_ID",
    "availableStock": 100,
    "reservedStock": 5,
    "restockThreshold": 20,
    "warehouseLocation": "A-101"
  }'
```

### Update Inventory (ADMIN):
```bash
curl -X PUT http://localhost:8081/api/inventory/[INVENTORY_ID] \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "restockThreshold": 25,
    "warehouseLocation": "A-102"
  }'
```

### Adjust Stock (ADMIN):
```bash
curl -X PUT http://localhost:8081/api/inventory/[INVENTORY_ID]/adjust \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "sold",
    "quantity": 5,
    "reason": "Customer order #123"
  }'
```
Actions: `restock`, `sold`, `reserved`, `returned`, `adjustment`

### Delete Inventory (ADMIN):
```bash
curl -X DELETE http://localhost:8081/api/inventory/[INVENTORY_ID] \
  -H "Authorization: Bearer $TOKEN"
```

## 3️⃣ UPLOAD ENDPOINTS

### Upload Single File (AUTHENTICATED):
```bash
curl -X POST http://localhost:8081/api/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/image.jpg"
```

Response example:
```json
{
  "success": true,
  "file": {
    "filename": "book-cover-1712282400000.jpg",
    "url": "/uploads/book-cover-1712282400000.jpg",
    "size": 245632,
    "mimetype": "image/jpeg"
  }
}
```

### Upload Multiple Files (AUTHENTICATED):
```bash
curl -X POST http://localhost:8081/api/upload/multiple \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@/path/to/image1.jpg" \
  -F "files=@/path/to/image2.png" \
  -F "files=@/path/to/document.pdf"
```

### Delete File (AUTHENTICATED):
```bash
curl -X DELETE http://localhost:8081/api/upload/[FILENAME] \
  -H "Authorization: Bearer $TOKEN"
```
Example: `book-cover-1712282400000.jpg`

## 4️⃣ REVIEW ENDPOINTS (BONUS TEST)

### Get All Reviews (PUBLIC):
```bash
curl "http://localhost:8081/api/reviews?page=1&limit=10&sort=-createdAt"
```

### Get Reviews by Book (PUBLIC):
```bash
curl "http://localhost:8081/api/reviews/book/[BOOK_ID]?sort=-createdAt"
```

### Create Review (AUTHENTICATED):
```bash
curl -X POST http://localhost:8081/api/reviews \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookId": "[BOOK_ID]",
    "rating": 5,
    "title": "Amazing book!",
    "comment": "Highly recommend this book.",
    "isVerifiedPurchase": true
  }'
```

### Update Review (OWN REVIEW):
```bash
curl -X PUT http://localhost:8081/api/reviews/[REVIEW_ID] \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 4,
    "title": "Great book",
    "comment": "Updated review comment"
  }'
```

### Mark Review as Helpful (AUTHENTICATED):
```bash
curl -X POST http://localhost:8081/api/reviews/[REVIEW_ID]/helpful \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isHelpful": true}'
```

### Admin Reply to Review:
```bash
curl -X PUT http://localhost:8081/api/reviews/[REVIEW_ID]/reply \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reply": "Thank you for your feedback! We appreciate it."
  }'
```

### Delete Review (OWN OR ADMIN):
```bash
curl -X DELETE http://localhost:8081/api/reviews/[REVIEW_ID] \
  -H "Authorization: Bearer $TOKEN"
```

## 🔑 QUICK TEST FLOW:

1. **Register**: Get a test account
2. **Login**: Grab JWT token from response
3. **Get Books**: `curl http://localhost:8081/api/books?page=1&limit=5`
4. **Test Upload**: Upload a test image
5. **Test Inventory**: Create/update/adjust inventory (need ADMIN token)
6. **Test Review**: Create a review for a book

## 📝 NOTES:

- Replace `$TOKEN` with actual JWT token from login response
- Replace `[BOOK_ID]`, `[INVENTORY_ID]`, etc. with actual IDs
- Allowed file types: JPEG, PNG, GIF, WebP, PDF (max 10MB)
- Inventory tracking history is recorded for all stock adjustments
- Reviews require verified purchase flag for credibility
