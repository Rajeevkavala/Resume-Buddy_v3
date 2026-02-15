# ResumeBuddy Deployment Guide

This guide covers multiple deployment options for the ResumeBuddy Next.js application, from local development to production deployment on various platforms.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Local Development](#local-development)
- [Production Deployment Options](#production-deployment-options)
  - [Vercel (Recommended)](#vercel-recommended)
  - [Firebase App Hosting](#firebase-app-hosting)
  - [Netlify](#netlify)
  - [Docker](#docker)
  - [Traditional VPS/Server](#traditional-vpsserver)
- [Post-Deployment Configuration](#post-deployment-configuration)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- **Node.js**: Version 18.x or later
- **npm**: Version 8.x or later (comes with Node.js)
- **Git**: For version control
- **Firebase Account**: For authentication and data storage
- **Google AI Account**: For Genkit AI flows

### Required Services
1. **Firebase Project** with:
   - Authentication enabled (Email/Password and Google providers)
   - Firestore Database
   - Storage Bucket
2. **Google AI API Key** for Genkit integration

## Environment Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repository-url>
cd Resume-Buddy_Nextjs

# Install dependencies
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Firebase Configuration (Public - client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google AI Configuration (Private - server-side only)
GOOGLE_GENAI_API_KEY=your_google_genai_api_key_here

# Optional: Security Configuration
NEXT_PUBLIC_PRIVACY_MODE=true
NEXT_PUBLIC_DISABLE_INDEXEDDB_PERSISTENCE=false
```

### 3. Firebase Setup

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication with Email/Password and Google providers

2. **Configure Firestore**:
   - Create a Firestore database in production mode
   - Set up security rules (see [SECURITY.md](./SECURITY.md))

3. **Configure Storage**:
   - Enable Firebase Storage
   - Configure storage security rules

### 4. Google AI Setup

1. Get your Google AI API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add the key to your environment variables

## Local Development

```bash
# Start development server
npm run dev

# In a separate terminal, start Genkit development server
npm run genkit:dev

# For watching AI flows during development
npm run genkit:watch
```

The application will be available at:
- **Main App**: http://localhost:3000
- **Genkit UI**: http://localhost:4000

## Production Deployment Options

### Vercel (Recommended)

Vercel is the recommended platform for Next.js applications and offers the best performance and developer experience.

#### Automatic Deployment

1. **Connect Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Import your Git repository
   - Vercel will auto-detect Next.js configuration

2. **Environment Variables**:
   - In Vercel dashboard, go to Project Settings → Environment Variables
   - Add all variables from your `.env.local` file
   - Make sure to set the correct environment (Production, Preview, Development)

3. **Build Settings**:
   ```bash
   # Build Command (default is fine)
   npm run build
   
   # Output Directory (default is fine)
   .next
   
   # Install Command (default is fine)
   npm install
   ```

4. **Deploy**:
   - Push to your main branch
   - Vercel will automatically build and deploy

#### Manual Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Or deploy for preview
vercel
```

#### Configuration

Create `vercel.json` in root directory for advanced configuration:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_FIREBASE_API_KEY": "@firebase-api-key",
    "GOOGLE_GENAI_API_KEY": "@google-genai-api-key"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_FIREBASE_API_KEY": "@firebase-api-key",
      "GOOGLE_GENAI_API_KEY": "@google-genai-api-key"
    }
  }
}
```

### Firebase App Hosting

Firebase App Hosting is specifically designed for Next.js applications and provides seamless integration with other Firebase services.

#### Setup

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Initialize Firebase Hosting**:
   ```bash
   firebase init hosting
   ```

3. **Configure `apphosting.yaml`** (already included):
   ```yaml
   runConfig:
     maxInstances: 10
     minInstances: 0
     concurrency: 1000
     cpu: 1
     memoryMiB: 512
     maxRequestTimeout: 3600s
   
   env:
     - variable: GOOGLE_GENAI_API_KEY
       secret: google-genai-api-key
   ```

4. **Deploy**:
   ```bash
   # Build the application
   npm run build
   
   # Deploy to Firebase
   firebase deploy --only hosting
   ```

#### GitHub Actions for Firebase

Create `.github/workflows/firebase-hosting.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches: [ main ]

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.NEXT_PUBLIC_FIREBASE_API_KEY }}
          NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${{ secrets.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN }}
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_PROJECT_ID }}
          NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${{ secrets.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET }}
          NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID }}
          NEXT_PUBLIC_FIREBASE_APP_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_APP_ID }}
          GOOGLE_GENAI_API_KEY: ${{ secrets.GOOGLE_GENAI_API_KEY }}
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-firebase-project-id
```

### Netlify

#### Direct Deployment

1. **Connect Repository**:
   - Go to [Netlify Dashboard](https://app.netlify.com/)
   - Click "New site from Git"
   - Connect your repository

2. **Build Settings**:
   ```bash
   # Build command
   npm run build
   
   # Publish directory
   .next
   ```

3. **Environment Variables**:
   - Go to Site Settings → Environment Variables
   - Add all your environment variables

#### Netlify CLI Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Build and deploy
npm run build
netlify deploy --prod --dir=.next
```

### Docker

#### Dockerfile

Create `Dockerfile` in root directory:

```dockerfile
# Use the official Node.js 18 Alpine image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG GOOGLE_GENAI_API_KEY

ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID
ENV GOOGLE_GENAI_API_KEY=$GOOGLE_GENAI_API_KEY

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  resumebuddy:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY}
        - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}
        - NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID}
        - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}
        - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}
        - NEXT_PUBLIC_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID}
        - GOOGLE_GENAI_API_KEY=${GOOGLE_GENAI_API_KEY}
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

#### Build and Run

```bash
# Build the Docker image
docker build -t resumebuddy .

# Run the container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_FIREBASE_API_KEY="your_api_key" \
  -e NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_domain" \
  -e NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id" \
  -e NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_bucket" \
  -e NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_sender_id" \
  -e NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id" \
  -e GOOGLE_GENAI_API_KEY="your_genai_key" \
  resumebuddy

# Or use docker-compose
docker-compose up -d
```

### Traditional VPS/Server

#### Server Requirements
- **Ubuntu 20.04+ / CentOS 8+ / Debian 11+**
- **2GB RAM minimum (4GB recommended)**
- **20GB disk space**
- **Node.js 18+**
- **Nginx (for reverse proxy)**
- **PM2 (for process management)**

#### Setup Steps

1. **Install Node.js**:
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # CentOS/RHEL
   curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
   sudo yum install -y nodejs
   ```

2. **Install PM2**:
   ```bash
   sudo npm install -g pm2
   ```

3. **Deploy Application**:
   ```bash
   # Clone repository
   git clone <your-repo-url> /var/www/resumebuddy
   cd /var/www/resumebuddy
   
   # Install dependencies
   npm ci
   
   # Build application
   npm run build
   
   # Create PM2 ecosystem file
   ```

4. **PM2 Configuration** (`ecosystem.config.js`):
   ```javascript
   module.exports = {
     apps: [{
       name: 'resumebuddy',
       script: 'npm',
       args: 'start',
       cwd: '/var/www/resumebuddy',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 3000,
         NEXT_PUBLIC_FIREBASE_API_KEY: 'your_api_key',
         NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'your_domain',
         NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'your_project_id',
         NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'your_bucket',
         NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: 'your_sender_id',
         NEXT_PUBLIC_FIREBASE_APP_ID: 'your_app_id',
         GOOGLE_GENAI_API_KEY: 'your_genai_key'
       }
     }]
   };
   ```

5. **Start with PM2**:
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

6. **Nginx Configuration** (`/etc/nginx/sites-available/resumebuddy`):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

7. **Enable Nginx Site**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/resumebuddy /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

8. **SSL with Let's Encrypt**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## Post-Deployment Configuration

### Domain Configuration

1. **Update Firebase Auth Domain**:
   - Go to Firebase Console → Authentication → Settings
   - Add your production domain to authorized domains

2. **Update CORS Settings**:
   - Ensure your domain is included in Firebase Storage CORS configuration

### Performance Optimization

1. **Enable Caching**:
   - Configure CDN (Cloudflare recommended)
   - Set up proper cache headers

2. **Monitor Performance**:
   - Set up Google Analytics
   - Configure Firebase Performance Monitoring

### Security Hardening

1. **Firestore Security Rules**:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

2. **Storage Security Rules**:
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /users/{userId}/{allPaths=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

## Monitoring and Maintenance

### Health Checks

Set up monitoring for:
- **Application Uptime**
- **Response Times**
- **Error Rates**
- **Firebase Usage**
- **API Key Quotas**

### Backup Strategy

1. **Firestore Backups**:
   ```bash
   # Set up automatic daily backups
   gcloud firestore export gs://your-backup-bucket/firestore-backups/$(date +%Y-%m-%d)
   ```

2. **Code Backups**:
   - Ensure Git repository is backed up
   - Tag releases for easy rollbacks

### Updates and Maintenance

1. **Dependency Updates**:
   ```bash
   # Check for updates
   npm outdated
   
   # Update dependencies
   npm update
   
   # Security audit
   npm audit
   npm audit fix
   ```

2. **Deployment Updates**:
   ```bash
   # Pull latest changes
   git pull origin main
   
   # Install new dependencies
   npm ci
   
   # Build application
   npm run build
   
   # Restart application (PM2)
   pm2 restart resumebuddy
   
   # Or redeploy (Vercel)
   vercel --prod
   ```

## Troubleshooting

### Common Issues

1. **Build Failures**:
   ```bash
   # Clear Next.js cache
   rm -rf .next
   
   # Clear node_modules
   rm -rf node_modules package-lock.json
   npm install
   
   # Type check
   npm run typecheck
   ```

2. **Firebase Connection Issues**:
   - Verify environment variables
   - Check Firebase project settings
   - Ensure API keys have proper permissions

3. **Genkit API Issues**:
   - Verify Google AI API key
   - Check API quotas and billing
   - Monitor function execution logs

4. **Performance Issues**:
   - Enable Next.js analytics
   - Check bundle size: `npm run build`
   - Monitor Core Web Vitals

### Debugging

1. **Enable Debug Mode**:
   ```bash
   # Local development
   DEBUG=* npm run dev
   
   # Production logging
   NODE_ENV=development npm start
   ```

2. **Firebase Debugging**:
   ```javascript
   // Enable Firebase debugging
   import { connectFirestoreEmulator } from 'firebase/firestore';
   
   if (process.env.NODE_ENV === 'development') {
     connectFirestoreEmulator(db, 'localhost', 8080);
   }
   ```

### Log Analysis

Monitor logs in:
- **Vercel**: Function logs in dashboard
- **Firebase**: Cloud Functions logs
- **Server**: PM2 logs (`pm2 logs`)
- **Docker**: `docker logs container_name`

## Support and Resources

- **Next.js Documentation**: https://nextjs.org/docs
- **Firebase Documentation**: https://firebase.google.com/docs
- **Genkit Documentation**: https://firebase.google.com/docs/genkit
- **Vercel Documentation**: https://vercel.com/docs

For application-specific issues, refer to the project's issue tracker or documentation.