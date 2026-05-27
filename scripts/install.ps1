param(
    [string]$PetId = "assistant-004",
    [switch]$All,
    [switch]$List,
    [string]$CodexHome = $env:CODEX_HOME
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Resolve-Path (Join-Path $ScriptDir "..")
$CatalogPath = Join-Path $Root "catalog.json"

if (-not (Test-Path -LiteralPath $CatalogPath)) {
    throw "Missing catalog.json at $CatalogPath"
}

$CatalogText = [System.IO.File]::ReadAllText($CatalogPath, [System.Text.Encoding]::UTF8)
$Catalog = $CatalogText | ConvertFrom-Json
$Pets = @{}
foreach ($Pet in $Catalog.pets) {
    $Pets[$Pet.id] = $Pet
}

if ($List) {
    foreach ($Key in ($Pets.Keys | Sort-Object)) {
        $Pet = $Pets[$Key]
        Write-Host "$($Pet.id)`t$($Pet.display_name)`t$($Pet.short_description)"
    }
    exit 0
}

if ([string]::IsNullOrWhiteSpace($CodexHome)) {
    $CodexHome = Join-Path $HOME ".codex"
}

if ($All) {
    $SelectedPets = @($Pets.Values)
} else {
    if (-not $Pets.ContainsKey($PetId)) {
        $Available = ($Pets.Keys | Sort-Object) -join ", "
        throw "Unknown pet id: $PetId. Available pets: $Available"
    }
    $SelectedPets = @($Pets[$PetId])
}

foreach ($Pet in $SelectedPets) {
    if ($Pet.status -ne "ready") {
        Write-Host "Skipping $($Pet.id) because status is '$($Pet.status)'"
        continue
    }

    $PetJson = Join-Path $Root $Pet.files.pet_json
    $Spritesheet = Join-Path $Root $Pet.files.spritesheet
    if (-not (Test-Path -LiteralPath $PetJson)) {
        throw "Missing pet.json for $($Pet.id): $PetJson"
    }
    if (-not (Test-Path -LiteralPath $Spritesheet)) {
        throw "Missing spritesheet for $($Pet.id): $Spritesheet"
    }

    $TargetDir = Join-Path $CodexHome "pets\$($Pet.id)"
    New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null
    Copy-Item -LiteralPath $PetJson -Destination (Join-Path $TargetDir "pet.json") -Force
    Copy-Item -LiteralPath $Spritesheet -Destination (Join-Path $TargetDir "spritesheet.webp") -Force

    Write-Host "Installed $($Pet.display_name)"
    Write-Host "Target: $TargetDir"
}

Write-Host "Restart Codex or refresh the pet picker if the pet does not appear immediately."
