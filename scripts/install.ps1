param(
    [string]$CodexHome = $env:CODEX_HOME
)

$ErrorActionPreference = "Stop"
$PetId = "assistant-004"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Resolve-Path (Join-Path $ScriptDir "..")
$SourceDir = Join-Path $Root "pet\$PetId"

if ([string]::IsNullOrWhiteSpace($CodexHome)) {
    $CodexHome = Join-Path $HOME ".codex"
}

$TargetDir = Join-Path $CodexHome "pets\$PetId"
$PetJson = Join-Path $SourceDir "pet.json"
$Spritesheet = Join-Path $SourceDir "spritesheet.webp"

if (-not (Test-Path -LiteralPath $PetJson)) {
    throw "Missing pet.json at $PetJson"
}
if (-not (Test-Path -LiteralPath $Spritesheet)) {
    throw "Missing spritesheet.webp at $Spritesheet"
}

New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null
Copy-Item -LiteralPath $PetJson -Destination (Join-Path $TargetDir "pet.json") -Force
Copy-Item -LiteralPath $Spritesheet -Destination (Join-Path $TargetDir "spritesheet.webp") -Force

Write-Host "Installed Assistant-004"
Write-Host "Target: $TargetDir"
Write-Host "Restart Codex or refresh the pet picker if the pet does not appear immediately."

