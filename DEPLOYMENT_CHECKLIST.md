# 1time.ai Deployment Checklist

## Pre-Deployment Setup

### 1. Environment Setup
- [x] ✅ PostgreSQL database already configured and ready
- [ ] Obtain OpenAI API key with sufficient credits
- [ ] Configure Firebase project and get credentials
- [ ] Generate secure session secret (32+ characters)

### 2. Domain & DNS
- [ ] Register domain name
- [ ] Access to DNS management (Namecheap, GoDaddy, Cloudflare, etc.)
- [ ] Choose deployment platform (Vercel, Railway, Render, etc.)

### 3. Database Migration
- [x] ✅ Production database already created and configured
- [ ] Ensure `DATABASE_URL` is set in deployment environment
- [x] ✅ Database schema already correct and ready
- [x] ✅ Database connectivity already tested and working

## Platform-Specific Deployment

### For Vercel (Recommended)
- [ ] Install Vercel CLI: `npm install -g vercel`
- [ ] Login to Vercel: `vercel login`
- [ ] Deploy: `vercel --prod`
- [ ] Configure environment variables in Vercel dashboard
- [ ] Add custom domain in Vercel settings
- [ ] Verify deployment at temporary Vercel URL

### For Railway
- [ ] Install Railway CLI: `npm install -g @railway/cli`
- [ ] Login: `railway login`
- [ ] Initialize project: `railway init`
- [ ] Deploy: `railway up`
- [ ] Configure environment variables in Railway dashboard
- [ ] Add custom domain in Railway settings

### For Render
- [ ] Connect GitHub repository to Render
- [ ] Create new web service
- [ ] Configure build and start commands
- [ ] Set environment variables
- [ ] Deploy and verify

## Environment Variables Configuration

### Required Variables
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `OPENAI_API_KEY` - OpenAI API key
- [ ] `SESSION_SECRET` - Random secure string
- [ ] `NODE_ENV` - Set to "production"

### Firebase Variables (Frontend)
- [ ] `VITE_FIREBASE_API_KEY`
- [ ] `VITE_FIREBASE_PROJECT_ID` 
- [ ] `VITE_FIREBASE_APP_ID`

## Domain Configuration

### DNS Setup
- [ ] Point domain to hosting platform
- [ ] Add A record or CNAME record
- [ ] Wait for DNS propagation (up to 24 hours)
- [ ] Verify domain points to correct IP/hostname

### SSL Certificate
- [ ] Enable HTTPS/SSL on hosting platform
- [ ] Verify SSL certificate is valid
- [ ] Test HTTPS redirect works
- [ ] Update Firebase authorized domains

## Firebase Configuration

### Authentication Setup
- [ ] Add production domain to Firebase authorized domains
- [ ] Add both `www.yourdomain.com` and `yourdomain.com`
- [ ] Enable Google sign-in method
- [ ] Test authentication flow on production

### Security Rules
- [ ] Review Firebase security rules
- [ ] Ensure production-ready configuration
- [ ] Test authentication with production domain

## Post-Deployment Testing

### Core Functionality
- [ ] Test user registration and login
- [ ] Create a test memory (text and audio)
- [ ] Test file uploads (images/videos)
- [ ] Verify memory timeline displays correctly
- [ ] Test memory search (keyword and semantic)

### AI Features
- [ ] Test OpenAI transcription
- [ ] Verify semantic search works
- [ ] Test memory prompts generation
- [ ] Check sentiment analysis

### Performance
- [ ] Test page load times
- [ ] Verify mobile responsiveness
- [ ] Check API response times
- [ ] Monitor memory usage

### Security
- [ ] Verify HTTPS is enforced
- [ ] Test authentication flows
- [ ] Check session management
- [ ] Verify environment variables are secure

## Monitoring & Maintenance

### Health Checks
- [ ] Verify `/api/health` endpoint works
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure alerts for downtime
- [ ] Monitor error rates

### Database
- [ ] Set up database backups
- [ ] Monitor database performance
- [ ] Check connection limits
- [ ] Monitor storage usage

### API Usage
- [ ] Monitor OpenAI API usage
- [ ] Set up usage alerts
- [ ] Track costs
- [ ] Optimize API calls if needed

## Troubleshooting

### Common Issues
- [ ] Database connection failures
- [ ] Firebase authentication errors
- [ ] OpenAI API rate limits
- [ ] SSL certificate issues
- [ ] DNS propagation delays

### Logs and Debugging
- [ ] Check deployment logs
- [ ] Monitor application logs
- [ ] Set up error tracking (Sentry, LogRocket)
- [ ] Configure performance monitoring

## Launch Preparation

### Final Testing
- [ ] Test all features end-to-end
- [ ] Verify performance is acceptable
- [ ] Check mobile experience
- [ ] Test with multiple user accounts

### Documentation
- [ ] Update README with deployment info
- [ ] Document environment variables
- [ ] Create user onboarding guide
- [ ] Prepare support documentation

### Go-Live
- [ ] Announce launch
- [ ] Monitor for issues
- [ ] Gather user feedback
- [ ] Plan post-launch improvements

## Post-Launch Checklist

### Week 1
- [ ] Monitor uptime and performance
- [ ] Check error logs daily
- [ ] Gather user feedback
- [ ] Fix any critical issues

### Month 1
- [ ] Analyze usage patterns
- [ ] Optimize performance bottlenecks
- [ ] Plan feature improvements
- [ ] Review and optimize costs

### Ongoing
- [ ] Regular security updates
- [ ] Database maintenance
- [ ] Feature enhancements
- [ ] User support

---

**Note**: This checklist should be completed in order. Each section depends on the previous ones being successfully completed.