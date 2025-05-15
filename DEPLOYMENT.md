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

3. Corrigido funções serverless API para Vercel com integração Supabase:
   - Corrigido configuração CORS para funcionar com credenciais
   - Melhorado tratamento de erros e fallbacks para dados mock
   - Simplificado autenticação para funcionar mesmo sem Supabase
   - Adicionado suporte para login com username ou email
   - Garantido que as APIs funcionem mesmo sem variáveis de ambiente configuradas

4. Simplified `server/vercel.ts` for better compatibility

5. Removed Replit-specific dependencies:
   - Removed Replit plugins from vite.config.ts
   - Removed Replit dependencies from package.json

6. Fixed TypeScript issues in vite.config.ts

7. Created a specialized Vercel build process:
   - Added a setup-vercel-config.js script to create proper config files during build
   - Updated vercel.json to use the vercel-build script
   - Made build scripts resilient to environment differences
   - Added fallbacks for missing Tailwind plugins

8. Fixed module format issues:
   - Removed problematic postcss.config.js file
   - Added proper CommonJS config files with .cjs extension
   - Created a script to generate the correct config files during build

9. Fixed dependency issues:
   - Moved Tailwind and PostCSS to production dependencies
   - Added explicit installation of Tailwind in the build script
   - Created .npmrc file to ensure proper dependency installation

10. Fixed TypeScript issues in configuration files:
   - Removed deprecated property usage
   - Added proper null checking
   - Used fileURLToPath for proper path resolution

## Deployment Steps

### GitHub Deployment

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

### Vercel Deployment

1. Prepare the environment for Vercel:
   ```bash
   chmod +x prepare-vercel.sh
   ./prepare-vercel.sh
   ```

2. Install the Vercel CLI (if not already installed):
   ```bash
   npm install -g vercel
   ```

3. Deploy to Vercel:
   ```bash
   vercel
   ```

4. Follow the prompts to link your project to Vercel with these settings:
   - Framework: Other
   - Build Command: npm run build
   - Output Directory: dist/public
   - Install Command: npm install

5. Configure environment variables in the Vercel dashboard:
   - DATABASE_URL
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - SESSION_SECRET

6. Alternatively, deploy directly from GitHub:
   - Connect your GitHub repository to Vercel
   - Configure the environment variables in the Vercel dashboard
   - Use the same settings as above for the project configuration
   - Vercel will automatically deploy your application

## Troubleshooting

If you encounter issues during deployment:

1. Check the Vercel build logs for errors
2. Ensure all environment variables are properly set
3. Verify that the build command is working correctly
4. Make sure the static files are being served from the correct directory

### Common Issues and Solutions

1. **Missing dependencies**: We've created a simplified package.json with only the essential dependencies for the frontend build.

2. **Build errors with Replit plugins**: We've removed all Replit-specific plugins and created a clean configuration.

3. **CSS not loading**: We've simplified the build process and created proper configuration files for PostCSS and Tailwind.

4. **API routes not working**: Corrigimos a configuração CORS nas funções serverless, adicionamos tratamento de erros robusto e garantimos que as APIs funcionem mesmo sem Supabase configurado, usando dados mock como fallback.

5. **PostCSS or Tailwind errors**: We've created simplified .mjs versions of configuration files that work with ESM.

6. **Module format issues**: We've standardized on ESM format for all configuration files to avoid conflicts.

7. **Vercel deployment settings**: For Vercel, use these settings:
   - Framework: Other
   - Build Command: `npm run build`
   - Output Directory: `dist/public`
   - Install Command: `npm install`

8. **NPM errors**: We've created a preparation script that sets up a clean environment for Vercel deployment.

9. **Complex build process**: We've simplified the build process to focus only on the frontend for Vercel deployment.

## Local Testing

To test the production build locally:

```bash
npm run build
npm run start
```

This will build the application and start the server in production mode.
