$ErrorActionPreference = 'Stop'

$ts = Get-Date -Format yyyyMMddHHmmss
$bodyObj = [ordered]@{
  name    = "Auto Test User $ts"
  phone   = "09123$($ts.Substring(10))"
  email   = "autotest_$ts@example.com"
  address = "123 Test Street"
  notes   = "CLI test $ts"
}

$json = $bodyObj | ConvertTo-Json -Depth 5
Write-Host "BODY:`n$json"

$uri = 'https://namhbcf-api.bangachieu2.workers.dev/api/public/customer-register'

Write-Host "\nREGISTER 1:"
$res1 = Invoke-RestMethod -Method POST -Uri $uri -Body $json -ContentType 'application/json'
$res1 | ConvertTo-Json -Depth 10

Start-Sleep -Seconds 1

Write-Host "\nREGISTER 2 (dedupe):"
$res2 = Invoke-RestMethod -Method POST -Uri $uri -Body $json -ContentType 'application/json'
$res2 | ConvertTo-Json -Depth 10