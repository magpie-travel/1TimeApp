# Dashboard-Based Deployment Guide for 1time.ai

Deploy your memory app using web dashboards without any command line work.

## Recommended Platform: Vercel (Easiest Dashboard Experience)

### Step 1: Prepare Your GitHub Repository

1. **Create GitHub Account** (if you don't have one):
   - Go to [github.com](https://github.com)
   - Sign up for a free account

2. **Create New Repository**:
   - Click "New" repository
   - Name it `1time-ai` or similar
   - Make it public or private (your choice)
   - Don't initialize with README (we'll upload existing code)

3. **Upload Your Code**:
   - Download your current project as a ZIP file
   - Extract it locally
   - Use GitHub's web interface to upload files:
     - Click "uploading an existing file"
     - Drag and drop all your project files
     - Commit the changes

### Step 2: Deploy to Vercel Dashboard

1. **Go to Vercel**:
   - Visit [vercel.com](https://vercel.com)
   - Click "Sign Up" and use your GitHub account

2. **Import Your Project**:
   - Click "New Project"
   - Select "Import Git Repository"
   - Choose your `1time-ai` repository
   - Click "Import"

3. **Configure Build Settings**:
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm install`
   - Click "Deploy"

4. **Add Environment Variables**:
   - Go to your project dashboard
   - Click "Settings" → "Environment Variables"
   - Add these variables:

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | Your PostgreSQL connection string |
   | `OPENAI_API_KEY` | Your OpenAI API key |
   | `VITE_FIREBASE_API_KEY` | Your Firebase API key |
   | `VITE_FIREBASE_PROJECT_ID` | Your Firebase project ID |
   | `VITE_FIREBASE_APP_ID` | Your Firebase app ID |
   | `SESSION_SECRET` | Generate a random 32-character string |
   | `NODE_ENV` | `production` |

5. **Add Custom Domain**:
   - Go to "Settings" → "Domains"
   - Add your domain name
   - Follow the DNS configuration instructions

## Alternative: Railway Dashboard

### Step 1: Deploy to Railway

1. **Go to Railway**:
   - Visit [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `1time-ai` repository

3. **Configure Deployment**:
   - Railway will auto-detect your Node.js app
   - Build Command: `npm run build`
   - Start Command: `npm start`

4. **Add Environment Variables**:
   - Go to your project → "Variables" tab
   - Add the same environment variables as above

5. **Add Custom Domain**:
   - Go to "Settings" → "Domains"
   - Add your custom domain
   - Follow DNS setup instructions

## Alternative: Render Dashboard

### Step 1: Deploy to Render

1. **Go to Render**:
   - Visit [render.com](https://render.com)
   - Sign up with GitHub

2. **Create Web Service**:
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select your `1time-ai` repo

3. **Configure Service**:
   - **Name**: `1time-ai`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

4. **Add Environment Variables**:
   - In the "Environment" section
   - Add all the environment variables listed above

5. **Add Custom Domain**:
   - Go to "Settings" → "Custom Domains"
   - Add your domain and follow DNS instructions

## Alternative: Netlify (For Static Sites)

### Step 1: Deploy to Netlify

1. **Go to Netlify**:
   - Visit [netlify.com](https://netlify.com)
   - Sign up with GitHub

2. **Deploy Site**:
   - Click "New site from Git"
   - Choose GitHub and select your repository
   - **Build command**: `npm run build:client`
   - **Publish directory**: `dist/public`

3. **Add Environment Variables**:
   - Go to "Site settings" → "Environment variables"
   - Add your frontend environment variables (VITE_* ones)

4. **Add Custom Domain**:
   - Go to "Domain settings"
   - Add your custom domain

*Note: Netlify is for static sites, so you'll need a separate backend solution*

## DNS Configuration (For All Platforms)

### If Your Domain is on GoDaddy:
1. Log into GoDaddy DNS management
2. Add these records:
   - **Type**: CNAME, **Name**: www, **Value**: [your-app-url]
   - **Type**: CNAME, **Name**: @, **Value**: [your-app-url]

### If Your Domain is on Namecheap:
1. Go to Domain List → Manage → Advanced DNS
2. Add these records:
   - **Type**: CNAME, **Host**: www, **Value**: [your-app-url]
   - **Type**: CNAME, **Host**: @, **Value**: [your-app-url]

### If Your Domain is on Cloudflare:
1. Go to DNS settings
2. Add these records:
   - **Type**: CNAME, **Name**: www, **Target**: [your-app-url]
   - **Type**: CNAME, **Name**: @, **Target**: [your-app-url]

## Environment Variables Guide

### Where to Get Each Variable:

**DATABASE_URL**: 
- Already configured in your current setup
- Copy from your current environment or Replit secrets

**OPENAI_API_KEY**:
- Go to [platform.openai.com](https://platform.openai.com)
- API Keys → Create new secret key
- Copy the key (starts with `sk-`)

**Firebase Variables**:
- Go to [Firebase Console](https://console.firebase.google.com)
- Select your project
- Project Settings → General → Your apps
- Copy the config values

**SESSION_SECRET**:
- Generate a random 32+ character string
- Use a password generator or random string generator

## Post-Deployment Steps

### 1. Update Firebase Authorized Domains
1. Go to Firebase Console
2. Authentication → Settings → Authorized domains
3. Add your new domain (both www and non-www versions)

### 2. Test Your Deployment
1. Visit your new domain
2. Test user registration/login
3. Create a test memory
4. Test semantic search
5. Verify file uploads work

### 3. Set Up Monitoring
1. Most platforms provide built-in monitoring
2. Check your dashboard for:
   - Uptime status
   - Error rates
   - Performance metrics

## Troubleshooting Common Issues

### Build Failures:
- Check build logs in your platform dashboard
- Verify all environment variables are set
- Ensure your GitHub repository has all files

### Database Connection Issues:
- Verify DATABASE_URL is correct
- Check if your database allows connections from your hosting platform
- Test database connectivity

### Authentication Issues:
- Verify Firebase configuration
- Check authorized domains include your new domain
- Ensure all Firebase environment variables are set

### Domain Issues:
- DNS changes can take up to 24 hours
- Use DNS checker tools to verify propagation
- Ensure SSL certificates are properly configured

## Support Resources

### Platform-Specific Help:
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Railway**: [docs.railway.app](https://docs.railway.app)
- **Render**: [render.com/docs](https://render.com/docs)
- **Netlify**: [docs.netlify.com](https://docs.netlify.com)

### Community Support:
- Platform Discord servers
- GitHub Issues
- Stack Overflow

All these platforms offer excellent dashboard experiences and don't require any command line work. Vercel is recommended for the best full-stack deployment experience.