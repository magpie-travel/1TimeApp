# Vercel Deployment Debug Guide

## Kiểm tra lỗi Vercel

### 1. Xem Function Logs
- Vào Vercel Dashboard → Project → Functions tab
- Click vào function bị lỗi → View Function Logs
- Copy error message để debug

### 2. Common Vercel Errors

#### Error: Cannot find module '/var/task/vite.config'
- **Vấn đề**: ES module import trong serverless environment
- **Giải pháp**: Embed config trực tiếp thay vì import

#### Error: ENOENT: no such file or directory
- **Vấn đề**: File path resolution khác với local
- **Giải pháp**: Sử dụng relative paths từ function root

#### Error: Function timeout
- **Vấn đề**: Cold start hoặc initialization quá lâu
- **Giải pháp**: Optimize imports và caching

### 3. Debug Commands

```bash
# Test local build giống Vercel
NODE_ENV=production node dist/server/server/index.js

# Check file structure
ls -la dist/
ls -la dist/server/server/

# Test API endpoint
curl -v https://your-app.vercel.app/api/health
```

### 4. Vercel-specific Fixes

- Use serverless functions pattern
- Avoid top-level await in modules
- Use proper ES module exports
- Handle cold starts properly

### 5. Next Steps
1. Copy paste error message từ Vercel
2. Check Function Logs trong dashboard
3. Test với production build locally trước