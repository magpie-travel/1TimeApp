# Deploy to Railway - Simple Dashboard Solution

Railway is much better at handling complex project structures like yours. Here's how to deploy:

## Step 1: Go to Railway
1. Visit [railway.app](https://railway.app)
2. Click "Sign up" and use your GitHub account
3. Authorize Railway to access your repositories

## Step 2: Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `1time-ai` repository
4. Click "Deploy"

## Step 3: Railway Will Auto-Detect
Railway will automatically:
- Detect your Node.js application
- Install dependencies with `npm install`
- Use the custom build command in `railway.json`
- Start your app with `npm start`

**Note:** The project uses a custom build configuration to handle the complex frontend/backend structure.

## Step 4: Add Environment Variables
1. In your Railway project dashboard, click "Variables" tab
2. Add these environment variables:

| Variable Name | Value |
|---------------|-------|
| `DATABASE_URL` | Your PostgreSQL connection string |
| `OPENAI_API_KEY` | Your OpenAI API key |
| `VITE_FIREBASE_API_KEY` | Your Firebase API key |
| `VITE_FIREBASE_PROJECT_ID` | Your Firebase project ID |
| `VITE_FIREBASE_APP_ID` | Your Firebase app ID |
| `SESSION_SECRET` | Generate a random 32+ character string |
| `NODE_ENV` | `production` |

## Step 5: Add Custom Domain
1. Go to "Settings" → "Domains"
2. Click "Add Domain"
3. Enter your domain name
4. Follow the DNS configuration instructions

## Step 6: Configure DNS
In your domain provider (GoDaddy, Namecheap, etc.):
- Add CNAME record: `www` → `your-app.railway.app`
- Add CNAME record: `@` → `your-app.railway.app`

## Step 7: Update Firebase
1. Go to Firebase Console
2. Authentication → Settings → Authorized domains
3. Add your Railway domain and your custom domain

## Why Railway is Better for Your Project:
- Handles complex project structures automatically
- No need for custom build configurations
- Built-in database support
- Automatic deployments from GitHub
- Better error handling and logs
- Retries failed builds automatically

## Files to Delete Before Railway Deployment:
1. `vercel.json` - Vercel configuration file
2. `api/[...proxy].ts` - Vercel serverless function
3. `build-for-vercel.js` - Custom Vercel build script
4. `vite.config.minimal.js` - Minimal Vite config for Vercel
5. `client/vite.config.ts` - Client-specific config (conflicts with root config)
6. `client/tailwind.config.ts` - Client-specific config (conflicts with root config)
7. `client/postcss.config.js` - Client-specific config (conflicts with root config)

Keep the `railway.json` file - it tells Railway how to build your project properly.

Railway should deploy your app successfully without the build configuration issues you're experiencing with Vercel.