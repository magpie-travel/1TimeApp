# Deployment Guide for 1time.ai

This guide covers deploying your memory app to various hosting platforms with your own domain.

## Prerequisites

Before deploying, ensure you have:
- Domain name registered and DNS access
- OpenAI API key
- Firebase project configured (if using Firebase auth)
- PostgreSQL database (recommended: Neon, Supabase, or PlanetScale)

## Environment Variables

Create a `.env` file in your project root with:

```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# Firebase (if using Firebase auth)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_APP_ID=your-firebase-app-id

# Session Secret (generate a secure random string)
SESSION_SECRET=your-secure-session-secret
```

## Database Setup

✅ **Your database is already configured and ready!**

You have a PostgreSQL database set up with the following configuration:
- Database connection via `DATABASE_URL` environment variable
- Drizzle ORM configured for PostgreSQL
- All tables and schemas ready for production

**For deployment, you just need to:**
1. Ensure your `DATABASE_URL` is added to your hosting platform's environment variables
2. Your database is already production-ready - no additional setup needed!

## Deployment Options

### 1. Vercel (Recommended for Full-Stack Apps)

#### Setup Steps:
1. Install Vercel CLI: `npm install -g vercel`
2. Create `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist/public"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "dist/public/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

3. Add build script to `package.json`:

```json
{
  "scripts": {
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build",
    "build:server": "tsc --project tsconfig.server.json",
    "vercel-build": "npm run build"
  }
}
```

4. Deploy:
```bash
vercel --prod
```

5. Add environment variables in Vercel dashboard
6. Configure your domain in Vercel settings

### 2. Railway

#### Setup Steps:
1. Create `railway.json`:

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run build && npm start",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

2. Add production script to `package.json`:

```json
{
  "scripts": {
    "start": "NODE_ENV=production node dist/server/index.js"
  }
}
```

3. Deploy:
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

4. Add environment variables in Railway dashboard
5. Configure custom domain in Railway settings

### 3. Render

#### Setup Steps:
1. Create `render.yaml`:

```yaml
services:
  - type: web
    name: 1time-ai
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: postgres
          property: connectionString
      - key: OPENAI_API_KEY
        sync: false
      - key: VITE_FIREBASE_API_KEY
        sync: false
      - key: VITE_FIREBASE_PROJECT_ID
        sync: false
      - key: VITE_FIREBASE_APP_ID
        sync: false
      - key: SESSION_SECRET
        generateValue: true

databases:
  - name: postgres
    databaseName: memories
    user: admin
```

2. Connect your GitHub repository to Render
3. Add environment variables in Render dashboard
4. Configure custom domain in Render settings

### 4. DigitalOcean App Platform

#### Setup Steps:
1. Create `.do/app.yaml`:

```yaml
name: 1time-ai
services:
- name: web
  source_dir: /
  github:
    repo: your-username/your-repo
    branch: main
  run_command: npm start
  build_command: npm run build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  routes:
  - path: /
  env:
  - key: NODE_ENV
    value: production
  - key: DATABASE_URL
    scope: RUN_AND_BUILD_TIME
    type: SECRET
  - key: OPENAI_API_KEY
    scope: RUN_AND_BUILD_TIME
    type: SECRET
```

2. Deploy via DigitalOcean control panel
3. Add environment variables
4. Configure custom domain

## Domain Configuration

### DNS Setup
After deploying, configure your domain's DNS:

1. **For Vercel:**
   - Add CNAME record: `www` → `cname.vercel-dns.com`
   - Add A record: `@` → `76.76.19.19`

2. **For Railway:**
   - Add CNAME record: `www` → `your-app.railway.app`
   - Add CNAME record: `@` → `your-app.railway.app`

3. **For Render:**
   - Add CNAME record: `www` → `your-app.onrender.com`
   - Add CNAME record: `@` → `your-app.onrender.com`

### SSL Certificate
Most platforms automatically provide SSL certificates for custom domains. If not:
- Use Cloudflare for free SSL
- Let's Encrypt for manual setup

## Post-Deployment Setup

### 1. Database Migrations
Run database migrations after deployment:
```bash
npm run db:push
```

### 2. Firebase Configuration
Update Firebase authorized domains:
1. Go to Firebase Console
2. Authentication > Settings > Authorized domains
3. Add your custom domain
4. Add both `www.yourdomain.com` and `yourdomain.com`

### 3. Environment Variables
Ensure all environment variables are properly set in your hosting platform:
- Database connection string
- OpenAI API key
- Firebase configuration
- Session secret

### 4. Domain Verification
- Test your app at your custom domain
- Verify HTTPS is working
- Check that authentication flows work
- Test file uploads and AI features

## Monitoring and Maintenance

### 1. Health Checks
Most platforms provide built-in health checks. Monitor:
- Response times
- Database connections
- API usage
- Error rates

### 2. Database Management
- Monitor database performance
- Set up automated backups
- Monitor storage usage
- Optimize queries if needed

### 3. Cost Optimization
- Monitor OpenAI API usage
- Optimize database queries
- Use CDN for static assets
- Monitor hosting costs

## Troubleshooting

### Common Issues:

1. **Database Connection Errors**
   - Verify DATABASE_URL format
   - Check database is accessible from hosting platform
   - Ensure connection limits aren't exceeded

2. **OpenAI API Errors**
   - Verify API key is valid
   - Check API usage limits
   - Monitor rate limits

3. **Authentication Issues**
   - Verify Firebase configuration
   - Check authorized domains
   - Ensure session secret is set

4. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check TypeScript compilation

## Security Considerations

1. **Environment Variables**
   - Never commit secrets to version control
   - Use platform-specific secret management
   - Rotate secrets regularly

2. **Database Security**
   - Use strong passwords
   - Enable SSL connections
   - Restrict database access

3. **API Security**
   - Implement rate limiting
   - Validate all inputs
   - Use HTTPS everywhere

## Performance Optimization

1. **Database**
   - Add indexes for frequently queried fields
   - Use connection pooling
   - Monitor query performance

2. **Frontend**
   - Enable gzip compression
   - Use CDN for static assets
   - Implement caching strategies

3. **API**
   - Cache OpenAI responses where appropriate
   - Implement request deduplication
   - Monitor API response times

Choose the deployment option that best fits your needs and budget. Vercel is recommended for its simplicity and excellent Next.js support, while Railway and Render offer good alternatives with built-in database options.