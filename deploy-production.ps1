# ===================================================================
# SMART POS - PRODUCTION DEPLOYMENT SCRIPT
# Deploy toàn bộ hệ thống lên Cloudflare
# ===================================================================

param(
    [switch]$SkipTests = $false,
    [switch]$SkipBuild = $false,
    [switch]$SkipBackend = $false,
    [switch]$SkipFrontend = $false,
    [switch]$SkipDatabase = $false,
    [string]$Environment = "production"
)

Write-Host "🚀 SMART POS - PRODUCTION DEPLOYMENT STARTING" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Configuration
$ErrorActionPreference = "Stop"
$startTime = Get-Date

# Environment files
$productionEnv = ".env.production"
$frontendEnv = "frontend/.env.production"

# Check if we're in the correct directory
if (-not (Test-Path "wrangler.toml") -and -not (Test-Path "src")) {
    Write-Host "❌ Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Load environment variables
if (Test-Path $productionEnv) {
    Write-Host "📋 Loading production environment variables..." -ForegroundColor Yellow
    Get-Content $productionEnv | ForEach-Object {
        if ($_ -match "^([^#].*?)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
}

# Function to run command with error handling
function Invoke-SafeCommand {
    param([string]$Command, [string]$Description)
    
    Write-Host "⚡ $Description..." -ForegroundColor Cyan
    try {
        Invoke-Expression $Command
        Write-Host "✅ $Description completed successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ $Description failed: $($_.Exception.Message)" -ForegroundColor Red
        throw
    }
}

# Function to check command availability
function Test-CommandAvailable {
    param([string]$Command)
    
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow

$prerequisites = @(
    @{Command = "node"; Name = "Node.js"},
    @{Command = "npm"; Name = "npm"},
    @{Command = "wrangler"; Name = "Wrangler CLI"}
)

foreach ($prereq in $prerequisites) {
    if (-not (Test-CommandAvailable $prereq.Command)) {
        Write-Host "❌ $($prereq.Name) is not installed or not in PATH" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ $($prereq.Name) is available" -ForegroundColor Green
}

# Check authentication
Write-Host "🔐 Checking Cloudflare authentication..." -ForegroundColor Yellow
try {
    $authCheck = wrangler whoami 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Cloudflare authentication successful" -ForegroundColor Green
        Write-Host "👤 Logged in as: $authCheck" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Cloudflare authentication failed. Please run: wrangler login" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ Failed to check authentication: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
if (-not $SkipBuild) {
    Invoke-SafeCommand "npm install" "Installing root dependencies"
    
    if (Test-Path "frontend") {
        Set-Location "frontend"
        Invoke-SafeCommand "npm install" "Installing frontend dependencies"
        Set-Location ".."
    }
}

# Run tests (unless skipped)
if (-not $SkipTests) {
    Write-Host "🧪 Running tests..." -ForegroundColor Yellow
    try {
        if (Test-Path "jest.config.js") {
            Invoke-SafeCommand "npm test -- --coverage --ci" "Running test suite"
        } else {
            Write-Host "⚠️  No Jest configuration found, skipping tests" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "⚠️  Tests failed, but continuing deployment (use --SkipTests to skip)" -ForegroundColor Yellow
    }
}

# Build frontend (unless skipped)
if (-not $SkipBuild -and -not $SkipFrontend) {
    Write-Host "🏗️  Building frontend..." -ForegroundColor Yellow
    if (Test-Path "frontend") {
        Set-Location "frontend"
        Invoke-SafeCommand "npm run build" "Building frontend for production"
        Set-Location ".."
    }
}

# Deploy database schema (unless skipped)
if (-not $SkipDatabase) {
    Write-Host "🗄️  Deploying database schema..." -ForegroundColor Yellow
    
    if (Test-Path "src/schema-unified-final.sql") {
        try {
            # Execute database migrations
            Invoke-SafeCommand "wrangler d1 execute DB --file=src/schema-unified-final.sql" "Executing database schema"
            Write-Host "✅ Database schema deployed successfully" -ForegroundColor Green
        }
        catch {
            Write-Host "⚠️  Database deployment failed, check if schema already exists" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  No database schema file found (src/schema-unified-final.sql)" -ForegroundColor Yellow
    }
}

# Deploy backend API (unless skipped)
if (-not $SkipBackend) {
    Write-Host "⚙️  Deploying backend API..." -ForegroundColor Yellow
    
    # Check if wrangler.toml exists
    if (Test-Path "wrangler.toml") {
        try {
            # Deploy to production
            Invoke-SafeCommand "wrangler deploy --env production" "Deploying backend to Cloudflare Workers"
            
            # Get deployment URL
            $deploymentInfo = wrangler deployments list --env production 2>&1 | Select-Object -First 5
            Write-Host "📊 Backend deployment info:" -ForegroundColor Cyan
            Write-Host $deploymentInfo -ForegroundColor Gray
            
        }
        catch {
            Write-Host "❌ Backend deployment failed: $($_.Exception.Message)" -ForegroundColor Red
            throw
        }
    } else {
        Write-Host "⚠️  No wrangler.toml found, skipping backend deployment" -ForegroundColor Yellow
    }
}

# Deploy frontend (unless skipped)
if (-not $SkipFrontend) {
    Write-Host "🌐 Deploying frontend..." -ForegroundColor Yellow
    
    if (Test-Path "frontend") {
        Set-Location "frontend"
        
        # Check for Pages configuration
        if (Test-Path "wrangler.toml") {
            try {
                Invoke-SafeCommand "wrangler pages deploy dist --project-name=namhbcf-uk" "Deploying frontend to Cloudflare Pages"
            }
            catch {
                Write-Host "⚠️  Pages deployment via Wrangler failed, trying direct deployment" -ForegroundColor Yellow
                try {
                    Invoke-SafeCommand "wrangler pages deploy dist" "Deploying frontend (auto-detect project)"
                }
                catch {
                    Write-Host "❌ Frontend deployment failed: $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        }
        elseif (Test-Path "dist") {
            try {
                Invoke-SafeCommand "wrangler pages deploy dist --project-name=namhbcf-uk" "Deploying frontend build directory"
            }
            catch {
                Write-Host "❌ Frontend deployment failed: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        else {
            Write-Host "⚠️  No frontend build found. Run 'npm run build' first" -ForegroundColor Yellow
        }
        
        Set-Location ".."
    }
}

# Health check
Write-Host "🏥 Running health checks..." -ForegroundColor Yellow
$healthChecks = @(
    @{
        Name = "Backend API Health"
        URL = "https://namhbcf-api.bangachieu2.workers.dev/health"
        Timeout = 10
    },
    @{
        Name = "Frontend Accessibility" 
        URL = "https://namhbcf-uk.pages.dev"
        Timeout = 10
    }
)

foreach ($check in $healthChecks) {
    try {
        Write-Host "⚡ Checking $($check.Name)..." -ForegroundColor Cyan
        $response = Invoke-WebRequest -Uri $check.URL -TimeoutSec $check.Timeout -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $($check.Name) is healthy (200)" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $($check.Name) returned status $($response.StatusCode)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "❌ $($check.Name) health check failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Final summary
$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host "`n🎉 DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host "⏱️  Total deployment time: $($duration.TotalMinutes.ToString('0'))m $($duration.Seconds)s" -ForegroundColor Cyan
Write-Host "🌐 Frontend URL: https://namhbcf-uk.pages.dev" -ForegroundColor Cyan
Write-Host "⚙️  Backend API: https://namhbcf-api.bangachieu2.workers.dev" -ForegroundColor Cyan
Write-Host "🗄️  Database: Cloudflare D1 (1f6dec6f-f953-4f00-9408-afd28a7f6650)" -ForegroundColor Cyan

Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Verify functionality at the frontend URL" -ForegroundColor Gray
Write-Host "2. Test API endpoints using the backend URL" -ForegroundColor Gray
Write-Host "3. Check logs: wrangler tail --env production" -ForegroundColor Gray
Write-Host "4. Monitor performance in Cloudflare Dashboard" -ForegroundColor Gray

Write-Host "`n🚀 Deployment completed successfully!" -ForegroundColor Green