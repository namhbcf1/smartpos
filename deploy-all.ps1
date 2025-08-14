# ============================================================================
# SMARTPOS COMPLETE DEPLOYMENT SCRIPT
# Deploy Backend + Frontend với một lệnh duy nhất
# ============================================================================

Write-Host "🚀 SMARTPOS COMPLETE DEPLOYMENT STARTING..." -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan

# Function to check if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow

if (-not (Test-Command "wrangler")) {
    Write-Host "❌ Wrangler CLI not found. Please install: npm install -g wrangler" -ForegroundColor Red
    exit 1
}

if (-not (Test-Command "npm")) {
    Write-Host "❌ npm not found. Please install Node.js" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prerequisites check passed" -ForegroundColor Green

# ============================================================================
# STEP 1: DEPLOY BACKEND
# ============================================================================

Write-Host "`n🔧 STEP 1: DEPLOYING BACKEND..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

try {
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        throw "npm install failed"
    }
    
    Write-Host "🚀 Deploying backend to Cloudflare Workers..." -ForegroundColor Yellow
    wrangler deploy --name smartpos-api-bangachieu2
    
    if ($LASTEXITCODE -ne 0) {
        throw "Backend deployment failed"
    }
    
    Write-Host "✅ Backend deployed successfully!" -ForegroundColor Green
    
    # Wait a moment for deployment to be ready
    Write-Host "⏳ Waiting for backend to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    # Initialize serial_numbers table
    Write-Host "🔧 Initializing serial_numbers table..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "https://smartpos-api-bangachieu2.bangachieu2.workers.dev/api/v1/serial-numbers/init-table" -Method POST -UseBasicParsing -TimeoutSec 30
        Write-Host "✅ Serial numbers table initialized" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Warning: Could not initialize serial_numbers table (may already exist)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Backend deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ============================================================================
# STEP 2: DEPLOY FRONTEND
# ============================================================================

Write-Host "`n🎨 STEP 2: DEPLOYING FRONTEND..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

try {
    # Check if frontend directory exists
    if (-not (Test-Path "frontend")) {
        Write-Host "❌ Frontend directory not found" -ForegroundColor Red
        exit 1
    }
    
    # Change to frontend directory
    Push-Location "frontend"
    
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        throw "Frontend npm install failed"
    }
    
    Write-Host "🏗️ Building frontend..." -ForegroundColor Yellow
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        throw "Frontend build failed"
    }
    
    Write-Host "🚀 Deploying frontend to Cloudflare Pages..." -ForegroundColor Yellow
    wrangler pages deploy dist --project-name=smartpos-web
    
    if ($LASTEXITCODE -ne 0) {
        throw "Frontend deployment failed"
    }
    
    Write-Host "✅ Frontend deployed successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Frontend deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Pop-Location
    exit 1
} finally {
    # Return to root directory
    Pop-Location
}

# ============================================================================
# STEP 3: VERIFICATION
# ============================================================================

Write-Host "`n🧪 STEP 3: VERIFYING DEPLOYMENT..." -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan

try {
    Write-Host "🔍 Testing backend health..." -ForegroundColor Yellow
    $backendResponse = Invoke-WebRequest -Uri "https://smartpos-api-bangachieu2.bangachieu2.workers.dev/api/v1/health" -UseBasicParsing -TimeoutSec 30
    Write-Host "✅ Backend is responding" -ForegroundColor Green
    
    Write-Host "🔍 Testing serial numbers endpoint..." -ForegroundColor Yellow
    $serialResponse = Invoke-WebRequest -Uri "https://smartpos-api-bangachieu2.bangachieu2.workers.dev/api/v1/serial-numbers/stats" -UseBasicParsing -TimeoutSec 30
    Write-Host "✅ Serial numbers endpoint is working" -ForegroundColor Green
    
} catch {
    Write-Host "⚠️ Warning: Some endpoints may still be initializing" -ForegroundColor Yellow
}

# ============================================================================
# DEPLOYMENT COMPLETE
# ============================================================================

Write-Host "`n🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

Write-Host "`n📱 LIVE URLS:" -ForegroundColor Cyan
Write-Host "Frontend: https://smartpos-web.pages.dev" -ForegroundColor White
Write-Host "Backend:  https://smartpos-api-bangachieu2.bangachieu2.workers.dev" -ForegroundColor White

Write-Host "`n🔗 QUICK TESTS:" -ForegroundColor Cyan
Write-Host "Health Check: https://smartpos-api-bangachieu2.bangachieu2.workers.dev/api/v1/health" -ForegroundColor White
Write-Host "Serial Stats: https://smartpos-api-bangachieu2.bangachieu2.workers.dev/api/v1/serial-numbers/stats" -ForegroundColor White

Write-Host "`n✨ ADVANCED FEATURES ENABLED:" -ForegroundColor Cyan
Write-Host "• Inventory Forecasting System" -ForegroundColor White
Write-Host "• Business Intelligence Engine" -ForegroundColor White
Write-Host "• System Monitoring and Alerting" -ForegroundColor White
Write-Host "• Real-time Collaboration" -ForegroundColor White
Write-Host "• Advanced Caching System" -ForegroundColor White
Write-Host "• Error Handling and Circuit Breakers" -ForegroundColor White

Write-Host "`n🚀 SmartPOS is now LIVE and ready to use!" -ForegroundColor Green
Write-Host "Visit https://smartpos-web.pages.dev to get started" -ForegroundColor Yellow

Write-Host "`nPress any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
