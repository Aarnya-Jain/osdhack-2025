# Deployment Guide for The Coder's Dungeon

## Current Issue
Your frontend is deployed on Vercel, but the backend API is not deployed. This causes the `map`, `examine`, and other functions to fail because they can't reach the backend endpoints.

## Solution Options

### Option 1: Deploy Backend to Vercel (Recommended)

This is the easiest solution since you're already using Vercel.

#### Steps:

1. **Update your repository** with the new `vercel.json` file I created
2. **Set up environment variables** in Vercel:
   - Go to your Vercel project dashboard
   - Navigate to Settings → Environment Variables
   - Add these variables:
     - `GITHUB_TOKEN` - Your GitHub personal access token
     - `GEMINI_API_KEY` - Your Google Gemini API key
     - `NODE_ENV` - Set to `production`

3. **Redeploy** your project on Vercel

#### What this does:
- The `vercel.json` file tells Vercel to build both your frontend and backend
- API routes (`/api/*`) will be handled by your Node.js backend
- Static files will be served by the frontend build

### Option 2: Deploy Backend Separately

If you prefer to deploy the backend to a different platform:

#### Deploy to Railway:
1. Go to [Railway.app](https://railway.app)
2. Connect your GitHub repository
3. Select the `api` folder as the source
4. Set environment variables:
   - `GITHUB_TOKEN`
   - `GEMINI_API_KEY`
   - `PORT` (Railway will set this automatically)

#### Deploy to Render:
1. Go to [Render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Set the root directory to `api`
5. Set environment variables

#### Deploy to Heroku:
1. Create a new Heroku app
2. Set the buildpack to Node.js
3. Deploy the `api` folder
4. Set environment variables

#### After deploying the backend:
1. Get your backend URL (e.g., `https://your-app.railway.app`)
2. Set the environment variable in Vercel:
   - `REACT_APP_API_URL` = your backend URL
3. Redeploy your frontend

## Environment Variables Required

### Backend (API):
- `GITHUB_TOKEN` - GitHub personal access token with repo access
- `GEMINI_API_KEY` - Google Gemini API key
- `PORT` - Port number (usually set automatically by hosting platform)

### Frontend:
- `REACT_APP_API_URL` - Backend URL (only needed for Option 2)

## Testing Your Deployment

1. **Test the backend directly**:
   ```
   curl https://your-backend-url/api/repo/facebook/react
   ```

2. **Test the frontend**:
   - Visit your deployed frontend
   - Try entering a repository like `facebook/react`
   - Test the `map`, `examine`, and other commands

## Common Issues and Solutions

### Issue: "Failed to fetch" errors
**Solution**: Backend is not deployed or not accessible. Deploy the backend using one of the options above.

### Issue: "GitHub API rate limit exceeded"
**Solution**: Check your `GITHUB_TOKEN` is valid and has the necessary permissions.

### Issue: "AI description failed"
**Solution**: Verify your `GEMINI_API_KEY` is correct and has sufficient quota.

### Issue: CORS errors
**Solution**: The backend CORS configuration should handle this automatically, but if you're using Option 2, make sure the `FRONTEND_URL` environment variable is set correctly.

## Recommended Approach

I recommend **Option 1** (deploying both frontend and backend to Vercel) because:
- Simpler setup and management
- No additional hosting costs
- Better integration between frontend and backend
- Automatic deployments from your GitHub repository

## Next Steps

1. Choose your deployment option
2. Set up the required environment variables
3. Deploy your application
4. Test all functionality
5. Update your README with the working deployment URL

Let me know if you need help with any specific step! 