# Open Smart POS System Links
Write-Host "Opening Smart POS System..." -ForegroundColor Green

# Frontend URL
$frontendUrl = "https://a129fa8e.namhbcf-uk.pages.dev"
Write-Host "Opening Frontend: $frontendUrl" -ForegroundColor Yellow
Start-Process $frontendUrl

# API URL
$apiUrl = "https://namhbcf-api.bangachieu2.workers.dev"
Write-Host "Opening API: $apiUrl" -ForegroundColor Yellow
Start-Process $apiUrl

# API Info
$apiInfoUrl = "https://namhbcf-api.bangachieu2.workers.dev/api/info"
Write-Host "Opening API Info: $apiInfoUrl" -ForegroundColor Yellow
Start-Process $apiInfoUrl

# Products API
$productsUrl = "https://namhbcf-api.bangachieu2.workers.dev/api/products"
Write-Host "Opening Products API: $productsUrl" -ForegroundColor Yellow
Start-Process $productsUrl

Write-Host ""
Write-Host "All links opened successfully!" -ForegroundColor Green
Write-Host "Login credentials: admin/admin123" -ForegroundColor Cyan