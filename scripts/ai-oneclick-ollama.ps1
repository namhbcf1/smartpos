Write-Host "== One-Click AI Setup (Ollama) =="

function Test-Command($cmd) {
  $exists = Get-Command $cmd -ErrorAction SilentlyContinue
  return $null -ne $exists
}

$ollamaCmd = "ollama"
if (-not (Test-Command $ollamaCmd)) {
  $candidates = @(
    "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe",
    "C:\\Program Files\\Ollama\\ollama.exe"
  )
  foreach ($c in $candidates) {
    if (Test-Path $c) { $ollamaCmd = $c; break }
  }
}

if (-not (Test-Command $ollamaCmd) -and -not (Test-Path $ollamaCmd)) {
  Write-Error "Ollama is not installed or not found in PATH. Install from https://ollama.com/download then re-run this script."
  exit 1
}

# Prefer GPU if available (RTX 3070 8GB)
$env:OLLAMA_CUDA_DEVICES = "0"
$env:OLLAMA_NUM_GPU = "1"
if (-not $env:OLLAMA_NUM_CTX) { $env:OLLAMA_NUM_CTX = "2048" }

Write-Host "GPU prefs: OLLAMA_CUDA_DEVICES=$env:OLLAMA_CUDA_DEVICES, OLLAMA_NUM_GPU=$env:OLLAMA_NUM_GPU, OLLAMA_NUM_CTX=$env:OLLAMA_NUM_CTX"

Write-Host "\nPulling recommended free models (this may take a while)..."
try {
  Write-Host "- Pull llama3:8b"
  & $ollamaCmd pull llama3:8b
} catch { Write-Warning "Could not pull llama3:8b: $($_.Exception.Message)" }

try {
  Write-Host "- Pull gemma:7b-instruct"
  & $ollamaCmd pull gemma:7b-instruct
} catch { Write-Warning "Could not pull gemma:7b-instruct: $($_.Exception.Message)" }

Write-Host "\nStarting Ollama service with GPU preference..."
Start-Process -NoNewWindow -FilePath $ollamaCmd -ArgumentList "serve"
Start-Sleep -Seconds 2

Write-Host "\nTesting local API..."
try {
  $ok = Invoke-RestMethod -Method Get -Uri http://localhost:11434/api/version -TimeoutSec 10
  Write-Host "Ollama API OK: $($ok.version)"
} catch {
  Write-Warning "Cannot reach Ollama API. Make sure the service started."
}

Write-Host "\nTest a short chat (llama3:8b)"
$json = '{"model":"llama3:8b","messages":[{"role":"user","content":"Xin chao"}],"stream":false,"options":{"num_gpu":1,"num_ctx":2048}}'
try {
  $res = Invoke-RestMethod -Method Post -Uri http://localhost:11434/api/chat -ContentType 'application/json' -Body $json -TimeoutSec 120
  if ($res) { Write-Host "Chat response received." }
} catch { Write-Warning "Chat test failed: $($_.Exception.Message)" }

Write-Host "\nDone. You can now call your backend endpoint /api/ai/chat with model 'llama3:8b' or 'gemma:7b-instruct'."


