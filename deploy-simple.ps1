# SMARTPOS SIMPLE DEPLOYMENT SCRIPT
Write-Host "🚀 SMARTPOS DEPLOYMENT STARTING..." -ForegroundColor Green

# Deploy Backend
Write-Host "🔧 Deploying Backend..." -ForegroundColor Yellow
npm install
wrangler deploy --name smartpos-api-bangachieu2

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend deployed successfully!" -ForegroundColor Green
    
    # Initialize table
    Write-Host "🔧 Initializing database..." -ForegroundColor Yellow
    try {
        Invoke-WebRequest -Uri "https://smartpos-api-bangachieu2.bangachieu2.workers.dev/api/v1/serial-numbers/init-table" -Method POST -UseBasicParsing -TimeoutSec 30
        Write-Host "✅ Database initialized" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Database may already be initialized" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Backend deployment failed" -ForegroundColor Red
    exit 1
}

# Deploy Frontend
Write-Host "🎨 Deploying Frontend..." -ForegroundColor Yellow
Set-Location frontend
npm install
npm run build
wrangler pages deploy dist --project-name=smartpos-web
Set-Location ..

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend deployed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend deployment failed" -ForegroundColor Red
    exit 1
}

# Success
Write-Host "`n🎉 DEPLOYMENT COMPLETED!" -ForegroundColor Green
Write-Host "Frontend: https://smartpos-web.pages.dev" -ForegroundColor Cyan
Write-Host "Backend:  https://smartpos-api-bangachieu2.bangachieu2.workers.dev" -ForegroundColor Cyan
Write-Host "🚀 SmartPOS is now LIVE!" -ForegroundColor Green
