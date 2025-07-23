# Câu lệnh chạy Production Build ở Local

## 1. Build ứng dụng
```bash
# Build với script tự động (recommended)
node build-production.js

# Hoặc build thủ công
npm run build
```

## 2. Chạy production server

### Cách 1: Từ thư mục gốc
```bash
NODE_ENV=production node dist/start.js
```

### Cách 2: Từ thư mục dist  
```bash
cd dist
NODE_ENV=production node start.js
```

## 3. Test ứng dụng
- Website: http://localhost:5000
- API Health: http://localhost:5000/api/health

## 4. Dừng server
```bash
# Dừng production server
pkill -f "node start.js"

# Hoặc dừng tất cả node processes
pkill -f "node dist"
```

## 5. Quy trình hoàn chỉnh
```bash
# Bước 1: Build
node build-production.js

# Bước 2: Chạy
NODE_ENV=production node dist/start.js

# Bước 3: Test trình duyệt tại http://localhost:5000
```

## Lưu ý
- Production server chạy trên port 5000
- Build script tự động fix tất cả ES module issues
- Embedded vite config để tránh import errors