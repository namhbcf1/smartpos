param(
  [string]$Environment = $env:ENVIRONMENT
)

# Fail on errors
$ErrorActionPreference = 'Stop'

# Resolve repo root
$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $repoRoot '..') | Select-Object -ExpandProperty Path
Set-Location $repoRoot

Write-Host "Repo root: $repoRoot"

# Load env file if present (KEY=VALUE lines only)
$envPath = Join-Path $repoRoot 'env'
if (Test-Path $envPath) {
  Write-Host "Loading environment variables from env file..."
  Get-Content $envPath | ForEach-Object {
    if ($_ -match '^[A-Z0-9_]+=') {
      $parts = $_.Split('=',2)
      if ($parts.Length -eq 2) {
        [Environment]::SetEnvironmentVariable($parts[0], $parts[1])
      }
    }
  }
}

# Determine environment
if ([string]::IsNullOrWhiteSpace($Environment)) { $Environment = 'main' }
$Environment = $Environment.Trim()
$envLower = $Environment.ToLowerInvariant()
# Use short flag -e with exact env name
if (@('main','production','staging') -notcontains $envLower) { $Environment = 'main' }
$wranglerEnvFlag = "--env=$Environment"
Write-Host "Using Wrangler environment: $wranglerEnvFlag"

# Verify required credentials (use safe env access)
$required = @('CLOUDFLARE_API_TOKEN','CLOUDFLARE_ACCOUNT_ID')
foreach ($k in $required) {
  $val = [Environment]::GetEnvironmentVariable($k)
  if ([string]::IsNullOrWhiteSpace($val)) { throw "Missing required environment variable: $k" }
}

# Ensure Node and Wrangler
Write-Host "Checking Node.js and Wrangler..."
try { node -v | Out-Null } catch { throw 'Node.js is required in PATH' }
try { npx wrangler -v | Out-Null } catch { throw 'Wrangler is required (dev dependency present). Run npm ci first.' }

# Install root dependencies if node_modules is missing
if (-not (Test-Path (Join-Path $repoRoot 'node_modules'))) {
  Write-Host 'Installing root dependencies...'
  npm ci
}

# Deploy backend Worker
Write-Host 'Deploying Cloudflare Worker...'
$env:CLOUDFLARE_API_TOKEN = $env:CLOUDFLARE_API_TOKEN
$env:CLOUDFLARE_ACCOUNT_ID = $env:CLOUDFLARE_ACCOUNT_ID
npx wrangler deploy $wranglerEnvFlag

# Build frontend
$frontendPath = Join-Path $repoRoot 'frontend'
if (Test-Path $frontendPath) {
  Write-Host 'Building frontend...'
  if (-not (Test-Path (Join-Path $frontendPath 'node_modules'))) {
    Push-Location $frontendPath
    npm ci
    Pop-Location
  }
  Push-Location $frontendPath
  npm run build
  Pop-Location

  # Deploy to Cloudflare Pages using wrangler pages deploy
  $distPath = Join-Path $frontendPath 'dist'
  if (Test-Path $distPath) {
    Write-Host 'Deploying frontend to Cloudflare Pages...'
    # Use project name derived from wrangler.toml FRONTEND_URL if available
    $projectName = $env:CLOUDFLARE_PAGES_PROJECT
    if (-not $projectName) { $projectName = 'namhbcf-uk' }

  $branch = if ($envLower -eq 'staging') { 'staging' } elseif ($envLower -eq 'production') { 'production' } else { 'main' }
    npx wrangler pages deploy "$distPath" --project-name "$projectName" --branch "$branch"
  } else {
    Write-Warning 'Frontend dist not found; skipping Pages deploy.'
  }
} else {
  Write-Host 'Frontend directory not found; skipping Pages build/deploy.'
}

Write-Host 'Deployment complete.'


