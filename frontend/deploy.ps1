# Smart POS Deploy Script
Write-Host "Building Smart POS React Frontend..." -ForegroundColor Green

# Build the React app (will generate proper index.html automatically)
npm run build

# Deploy to Cloudflare Pages
Write-Host "Deploying to Cloudflare Pages..." -ForegroundColor Green
npx wrangler pages deploy dist --project-name namhbcf-uk

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Main site: https://namhbcf-uk.pages.dev" -ForegroundColor Cyan