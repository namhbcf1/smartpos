param(
  [string]$ZipPath,
  [string]$ModelPath,
  [string]$InstallDir,
  [int]$GpuLayers,
  [int]$Context
)

Write-Host "== Setup llama.cpp from local ZIP (CUDA) =="

if (-not $InstallDir) { $InstallDir = "C:\ai" }
if (-not $GpuLayers) { $GpuLayers = 20 }
if (-not $Context) { $Context = 2048 }
$ModelDir = Join-Path $InstallDir "models"
$ServerDir = Join-Path $InstallDir "llamacpp"
$StartScript = Join-Path $InstallDir "ai-start-llamacpp.ps1"

function Ensure-Dir($path) {
  if (-not (Test-Path $path)) { New-Item -ItemType Directory -Path $path | Out-Null }
}

# Resolve defaults from Downloads if not provided
if (-not $ZipPath) {
  $ZipPath = Join-Path $Env:USERPROFILE "Downloads\\cudart-llama-bin-win-cuda-12.4-x64.zip"
}
if (-not $ModelPath) {
  $ModelPath = Join-Path $Env:USERPROFILE "Downloads\\Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf"
}

if (-not (Test-Path $ZipPath)) { Write-Error "ZIP not found: $ZipPath"; exit 1 }
if (-not (Test-Path $ModelPath)) { Write-Warning "Model not found at $ModelPath. You can pass -ModelPath to this script." }

Ensure-Dir $InstallDir
Ensure-Dir $ModelDir
Ensure-Dir $ServerDir

Write-Host ("Extracting: {0}" -f $ZipPath)
try {
  if (Get-Command Expand-Archive -ErrorAction SilentlyContinue) {
    Expand-Archive -Path $ZipPath -DestinationPath $ServerDir -Force
  } else {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::ExtractToDirectory($ZipPath, $ServerDir)
  }
} catch {
  Write-Warning "Extraction failed: $($_.Exception.Message)"
}

# Find server exe inside extracted tree
$serverExe = Get-ChildItem -Path $ServerDir -Recurse -Include server.exe, llama-server.exe, *server*.exe -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $serverExe) {
  Write-Error "server.exe not found under $ServerDir. Please verify the ZIP contents."
  exit 1
}

# Copy model to models dir if present
if (Test-Path $ModelPath) {
  $targetModel = Join-Path $ModelDir (Split-Path $ModelPath -Leaf)
  try {
    Copy-Item -Path $ModelPath -Destination $targetModel -Force
    $ModelPath = $targetModel
    Write-Host ("Model copied to: {0}" -f $ModelPath)
  } catch {
    Write-Warning "Could not copy model: $($_.Exception.Message). Will reference original path."
  }
}

@"
Write-Host "== Start llama.cpp server (CUDA) =="


$serverExe = "${($serverExe.FullName)}"
$modelPath = "${ModelPath}"
if (-not (Test-Path $serverExe)) { Write-Error "server.exe missing: $serverExe"; exit 1 }
if (-not (Test-Path $modelPath)) { Write-Error "Model file missing: $modelPath"; exit 1 }

$args = @(
  '-m', $modelPath,
  '-c', '${Context}',
  '--api',
  '--host', '0.0.0.0',
  '--port', '11434',
  '--gpu-layers', '${GpuLayers}'
)

Write-Host ("Launching: `"$serverExe`" $($args -join ' ')")
Start-Process -NoNewWindow -FilePath $serverExe -ArgumentList $args
Write-Host "Server started on http://localhost:11434"
Write-Host "Test: curl http://localhost:11434/v1/models"
"@ | Set-Content -Path $StartScript -Encoding UTF8

Write-Host ("Start script written: {0}" -f $StartScript)
Write-Host ("Run: powershell -ExecutionPolicy Bypass -File `"{0}`"" -f $StartScript)


