Write-Host "== Ollama GPU Diagnose =="

function Test-Command($cmd) {
  $exists = Get-Command $cmd -ErrorAction SilentlyContinue
  return $null -ne $exists
}

if (-not (Test-Command "ollama")) {
  Write-Error "Ollama command not found. Install Ollama first: https://ollama.com/download"
  exit 1
}

if (-not (Test-Command "nvidia-smi")) {
  Write-Warning "nvidia-smi not found. NVIDIA driver/CUDA may be missing. GPU usage cannot be verified."
} else {
  Write-Host "GPU Info (nvidia-smi):"
  nvidia-smi | Out-Host
}

Write-Host "\nOllama version:"
ollama --version

Write-Host "\nChecking Ollama API..."
try {
  $ver = Invoke-RestMethod -Method Get -Uri http://localhost:11434/api/version -TimeoutSec 5
  Write-Host "Ollama API ok:" ($ver | ConvertTo-Json)
} catch {
  Write-Warning "Cannot reach Ollama API at http://localhost:11434. Start 'ollama serve' and retry."
}

Write-Host "\nSampling GPU utilization before test (if available)"
if (Test-Command "nvidia-smi") { nvidia-smi --query-gpu=utilization.gpu,memory.used --format=csv -l 1 -c 1 | Out-Host }

Write-Host "\nRunning short chat with num_gpu=1 (Gemma 3 12B example)"
$body = @{ model = "gemma3:12b-instruct"; messages = @(@{ role = "user"; content = "hello" }); stream = $false; options = @{ num_gpu = 1; num_ctx = 2048 } } | ConvertTo-Json -Depth 5
try {
  $res = Invoke-RestMethod -Method Post -Uri http://localhost:11434/api/chat -ContentType 'application/json' -Body $body -TimeoutSec 120
  Write-Host "Response received."
} catch {
  Write-Warning "Chat request failed: $($_.Exception.Message)"
}

Write-Host "\nSampling GPU utilization after test (if available)"
if (Test-Command "nvidia-smi") { nvidia-smi --query-gpu=utilization.gpu,memory.used --format=csv -l 1 -c 1 | Out-Host }

Write-Host "\nIf GPU utilization did not increase, try:"
Write-Host "  1) Update NVIDIA driver and Ollama"
Write-Host "  2) Start with: `$env:OLLAMA_NUM_GPU='1'; ollama serve"
Write-Host "  3) Use smaller context or model; 8GB VRAM limits offload for 12B"


