Write-Host "== Start Ollama with GPU preferences =="

# Force use NVIDIA GPU 0 and enable GPU offload
$env:OLLAMA_CUDA_DEVICES = "0"
$env:OLLAMA_NUM_GPU = "1"

# Optional: reduce context to fit 8GB VRAM scenarios better
if (-not $env:OLLAMA_NUM_CTX) { $env:OLLAMA_NUM_CTX = "2048" }

Write-Host "OLLAMA_CUDA_DEVICES=$env:OLLAMA_CUDA_DEVICES"
Write-Host "OLLAMA_NUM_GPU=$env:OLLAMA_NUM_GPU"
Write-Host "OLLAMA_NUM_CTX=$env:OLLAMA_NUM_CTX"

Write-Host "Launching 'ollama serve'..."
Start-Process -NoNewWindow -FilePath "ollama" -ArgumentList "serve"
Write-Host "Ollama started. Test with:"
Write-Host "  curl -s http://localhost:11434/api/chat -H 'Content-Type: application/json' -d '{`"model`":`"gemma3:12b-instruct`",`"messages`":[{`"role`":`"user`",`"content`":`"hello`"}],`"options`":{`"num_gpu`":1,`"num_ctx`":2048}}'"


