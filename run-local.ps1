param(
  [string]$NodeDir = "C:\Program Files\nodejs",
  [switch]$ForceInstall
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

function Ensure-NodePath {
  if (Get-Command node -ErrorAction SilentlyContinue) { return }

  $candidates = @(
    $NodeDir,
    "C:\Program Files (x86)\nodejs"
  )

  foreach ($dir in $candidates) {
    $nodeExe = Join-Path $dir "node.exe"
    $npmCmd = Join-Path $dir "npm.cmd"
    if (Test-Path $nodeExe -PathType Leaf -and Test-Path $npmCmd -PathType Leaf) {
      $env:Path = "$dir;$env:Path"
      return
    }
  }

  throw "Could not find Node.js. Install Node.js (LTS) or pass -NodeDir to this script."
}

Ensure-NodePath

Set-Location $repoRoot

if (-not (Test-Path ".env.local" -PathType Leaf)) {
  if (Test-Path ".env.example" -PathType Leaf) {
    Copy-Item ".env.example" ".env.local" -Force
    Write-Host "Created .env.local from .env.example"
  } else {
    throw "Missing .env.example (needed to create .env.local)."
  }
}

$envFile = Get-Content ".env.local" -ErrorAction SilentlyContinue
$hasKey = $false
foreach ($line in $envFile) {
  if ($line -match "^\s*OPENAI_API_KEY\s*=") {
    $hasKey = $true
    break
  }
}

if (-not $hasKey) {
  throw "OPENAI_API_KEY not found in .env.local. Set it before running."
}

# Common placeholder value shipped in the repo.
$placeholder = ($envFile | Where-Object { $_ -match "^\s*OPENAI_API_KEY\s*=\s*your_openai_key_here\s*$" }).Count
if ($placeholder -gt 0) {
  throw "OPENAI_API_KEY is still the placeholder in .env.local. Replace it with your real key."
}

$shouldInstall = $ForceInstall
if (-not (Test-Path "node_modules" -PathType Container)) {
  $shouldInstall = $true
}

if ($shouldInstall) {
  & npm.cmd install
}

Write-Host "Starting dev server: http://localhost:3000"
& npm.cmd run dev

