# 1time.ai - Vercel Deployment Guide

## Overview
This guide walks you through deploying your memory app to Vercel. The app includes a React frontend, Express.js backend, and AI-powered memory features.

## Prerequisites
- GitHub account with your project repository
- Vercel account (free tier is sufficient)
- PostgreSQL database (Neon, Supabase, or similar)
- OpenAI API key

## Step 1: Prepare Your Repository

Your project is already configured for Vercel deployment with:
- ✅ `vercel.json` configuration file
- ✅ `api/index.ts` serverless function entry point
- ✅ Build scripts properly configured
- ✅ Static files output to `dist/public`

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel CLI (Recommended)
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from project root:
   ```bash
   vercel
   ```

4. Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Choose your account
   - Link to existing project? **N**
   - Project name: `1time-ai` (or your preferred name)
   - Directory: **./** (current directory)

### Option B: Deploy via Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Vercel will auto-detect the configuration

## Step 3: Configure Environment Variables

In your Vercel project dashboard, add these environment variables:

### Required Variables:
```
DATABASE_URL=postgresql://your-database-connection-string
OPENAI_API_KEY=sk-your-openai-api-key
```

### Optional Variables (if using Firebase):
```
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_APP_ID=your-firebase-app-id
```

## Step 4: Database Setup

If you don't have a PostgreSQL database yet:

### Option A: Neon (Recommended for Vercel)
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Add it as `DATABASE_URL` in Vercel

### Option B: Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the URI connection string
5. Replace `[YOUR-PASSWORD]` with your database password
6. Add it as `DATABASE_URL` in Vercel

## Step 5: Verify Deployment

After deployment, test these URLs:
- `https://your-app.vercel.app/` - Main timeline page
- `https://your-app.vercel.app/create` - Memory creation page  
- `https://your-app.vercel.app/api/health` - API health check

## Common Issues & Solutions

### Build Failures
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `dependencies` (not `devDependencies`)
- Verify TypeScript compilation with `npm run build`

### API Not Working
- Check environment variables are set correctly
- Verify database connection string format
- Check function logs in Vercel dashboard

### Frontend Not Loading
- Ensure `dist/public` contains built files
- Check if build completed successfully
- Verify Vercel routing in `vercel.json`

## Project Structure
```
├── api/
│   └── index.ts          # Vercel serverless function
├── client/               # React frontend
├── server/               # Express backend (used by API)
├── dist/public/          # Built frontend files
├── vercel.json           # Vercel configuration
└── package.json          # Dependencies and scripts
```

## Support

If you encounter issues:
1. Check Vercel function logs
2. Verify environment variables
3. Test API endpoints individually
4. Check database connectivity

Your app's UI and functionality remain exactly the same as the local version.