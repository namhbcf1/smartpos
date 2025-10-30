param(
  [string]$InstallDir,
  [string]$ModelDir,
  # Default URLs (override if they change)
  [string]$ModelUrl,
  [string]$ServerZipUrl
)

if (-not $InstallDir) { $InstallDir = "C:\ai" }
if (-not $ModelDir) { $ModelDir = "C:\ai\models" }
if (-not $ModelUrl) { $ModelUrl = "https://huggingface.co/bartowski/Meta-Llama-3.1-8B-Instruct-GGUF/resolve/main/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf?download=true" }
if (-not $ServerZipUrl) { $ServerZipUrl = "https://huggingface.co/keldenl/llama.cpp-bin/resolve/main/llama-server-win-x64-avx2.zip" }

Write-Host "== One-Click AI Setup (llama.cpp, no Ollama) =="

function Ensure-Dir($path) {
  if (-not (Test-Path $path)) { New-Item -ItemType Directory -Path $path | Out-Null }
}

function Download-File($url, $outPath) {
  Write-Host ("Downloading: {0}" -f $url)
  try {
    Invoke-WebRequest -Uri $url -OutFile $outPath -UseBasicParsing
    return $true
  } catch {
    Write-Warning ("Download failed: {0}" -f $_.Exception.Message)
    return $false
  }
}

Ensure-Dir $InstallDir
Ensure-Dir $ModelDir

$serverDir = Join-Path $InstallDir "llamacpp"
Ensure-Dir $serverDir

$serverZip = Join-Path $serverDir "llama-server.zip"
$modelFile = Join-Path $ModelDir "llama3-8b-instruct-q4_k_m.gguf"

# If user already downloaded to Downloads, use/copy it
$userDownloads = Join-Path $Env:USERPROFILE "Downloads"
$downloadedModel = Join-Path $userDownloads "Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf"
if (-not (Test-Path $modelFile) -and (Test-Path $downloadedModel)) {
  try {
    Write-Host ("Found model in Downloads: {0}" -f $downloadedModel)
    Copy-Item -Path $downloadedModel -Destination $modelFile -Force
    Write-Host ("Copied to: {0}" -f $modelFile)
  } catch {
    Write-Warning ("Could not copy model from Downloads: {0}" -f $_.Exception.Message)
    $modelFile = $downloadedModel
    Write-Host ("Will reference model directly at: {0}" -f $modelFile)
  }
}

Write-Host "\n== Step 1: Download llama.cpp server (Windows) =="
if (-not (Test-Path (Join-Path $serverDir "server.exe"))) {
  if (Download-File $ServerZipUrl $serverZip) {
    Write-Host "Extracting server..."
    try {
      Add-Type -AssemblyName System.IO.Compression.FileSystem
      [System.IO.Compression.ZipFile]::ExtractToDirectory($serverZip, $serverDir, $true)
    } catch {
      Write-Warning "Extraction failed. Please unzip manually: $serverZip"
    }
  } else {
    Write-Warning "Server download failed. You can override -ServerZipUrl with a valid zip URL."
  }
} else {
  Write-Host "server.exe already present, skipping download."
}

Write-Host "\n== Step 2: Download model (Llama 3.1 8B Instruct q4_K_M GGUF) =="
if (-not (Test-Path $modelFile)) {
  if (-not (Download-File $ModelUrl $modelFile)) {
    Write-Warning "Model download failed. Provide a direct GGUF URL via -ModelUrl."
  }
} else {
  Write-Host "Model file already present, skipping download."
}

Write-Host "\n== Step 3: Create start script =="
$startScript = Join-Path $InstallDir "ai-start-llamacpp.ps1"
@"
Write-Host "== Start llama.cpp server (OpenAI-compatible) =="


$serverExe = Join-Path "$serverDir" "server.exe"
$modelPath = "$modelFile"

if (-not (Test-Path $serverExe)) {
  Write-Error "server.exe not found at $serverExe. Please download a valid Windows build of llama.cpp server."
  exit 1
}
if (-not (Test-Path $modelPath)) {
  Write-Error "Model file not found at $modelPath. Provide a valid .gguf file."
  exit 1
}

# For 8GB VRAM, keep gpu-layers modest; increase if it fits
$args = @(
  '-m', $modelPath,
  '-c', '2048',
  '--api',
  '--host', '0.0.0.0',
  '--port', '11434',
  '--gpu-layers', '20'
)

Write-Host ("Launching: `"$serverExe`" $($args -join ' ')")
Start-Process -NoNewWindow -FilePath $serverExe -ArgumentList $args
Write-Host "Server started on http://localhost:11434 (OpenAI-compatible)"
Write-Host "Test: curl http://localhost:11434/v1/models"
"@ | Set-Content -Path $startScript -Encoding UTF8

Write-Host "\n== Done =="
Write-Host ("Start script: {0}" -f $startScript)
Write-Host "Run it with:"
Write-Host ("  powershell -ExecutionPolicy Bypass -File `"{0}`"" -f $startScript)


