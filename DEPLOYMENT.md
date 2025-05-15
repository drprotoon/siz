# Deployment Instructions for SIZ Cosméticos

This document provides instructions for deploying the SIZ Cosméticos application to GitHub and Vercel.

## Changes Made

1. Simplified the `package.json` scripts:
   - Removed unnecessary scripts
   - Created a dedicated vercel-build script
   - Ensured CSS and HTML files are properly copied during build

2. Updated `vercel.json` configuration:
   - Added buildCommand to use the vercel-build script
   - Maintained proper routing configuration

3. Simplified `api/index.js` for Vercel deployment:
   - Improved error handling
   - Ensured proper static file serving
   - Integrated with server routes

4. Simplified `server/vercel.ts` for better compatibility

5. Removed Replit-specific dependencies:
   - Removed Replit plugins from vite.config.ts
   - Removed Replit dependencies from package.json

6. Fixed TypeScript issues in vite.config.ts

## Deployment Steps

### GitHub Deployment

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

### Vercel Deployment

1. Install the Vercel CLI (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. Deploy to Vercel:
   ```bash
   vercel
   ```

3. Follow the prompts to link your project to Vercel.

4. Configure environment variables in the Vercel dashboard:
   - DATABASE_URL
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - SESSION_SECRET

5. Alternatively, deploy directly from GitHub:
   - Connect your GitHub repository to Vercel
   - Configure the environment variables in the Vercel dashboard
   - Vercel will automatically deploy your application

## Troubleshooting

If you encounter issues during deployment:

1. Check the Vercel build logs for errors
2. Ensure all environment variables are properly set
3. Verify that the build command is working correctly
4. Make sure the static files are being served from the correct directory

### Common Issues and Solutions

1. **Missing dependencies**: If you see errors about missing dependencies, make sure they are properly listed in package.json.

2. **Build errors with Replit plugins**: We've removed Replit-specific plugins that were causing issues with Vercel deployment.

3. **CSS not loading**: The build process now includes scripts to ensure CSS files are properly included in the build.

4. **API routes not working**: Make sure the vercel.json file is properly configured to route API requests to the correct handler.

## Local Testing

To test the production build locally:

```bash
npm run build
npm run start
```

This will build the application and start the server in production mode.
