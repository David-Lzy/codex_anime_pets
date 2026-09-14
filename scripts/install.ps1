param(
    [string]$PetId = "assistant-004",
    [switch]$All,
    [switch]$List,
    [switch]$Legacy,
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

    if ($Pet.id -notmatch '^[a-z0-9]+(-[a-z0-9]+)*$') { throw "Invalid pet id" }
    $Files = $Pet.files
    if ($Legacy -and $Files.legacy) { $Files = $Files.legacy }
    $PetJson = [System.IO.Path]::GetFullPath((Join-Path $Root $Files.pet_json))
    $Spritesheet = [System.IO.Path]::GetFullPath((Join-Path $Root $Files.spritesheet))
    $RootPrefix = $Root.Path.TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar
    foreach ($Source in @($PetJson, $Spritesheet)) {
        if (-not $Source.StartsWith($RootPrefix, [System.StringComparison]::OrdinalIgnoreCase)) { throw "Pet source escapes collection" }
        $Ancestor = $Source
        while ($Ancestor.StartsWith($RootPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
            if ((Test-Path -LiteralPath $Ancestor) -and ((Get-Item -LiteralPath $Ancestor -Force).Attributes -band [System.IO.FileAttributes]::ReparsePoint)) {
                throw "Refusing redirected source files"
            }
            $Ancestor = Split-Path -Parent $Ancestor
        }
    }
    if (-not (Test-Path -LiteralPath $PetJson)) {
        throw "Missing pet.json for $($Pet.id): $PetJson"
    }
    if (-not (Test-Path -LiteralPath $Spritesheet)) {
        throw "Missing spritesheet for $($Pet.id): $Spritesheet"
    }

    $Metadata = [System.IO.File]::ReadAllText($PetJson) | ConvertFrom-Json
    if ($Metadata.spritesheetPath -and $Metadata.spritesheetPath -ne 'spritesheet.webp') { throw "Unsupported spritesheetPath" }
    if ($Legacy -and $Metadata.spriteVersionNumber -and $Metadata.spriteVersionNumber -ne 1) { throw "No v1 compatibility files" }
    $PetsDir = Join-Path $CodexHome 'pets'
    $TargetDir = Join-Path $PetsDir $Pet.id
    foreach ($Item in @($TargetDir, (Join-Path $TargetDir 'pet.json'), (Join-Path $TargetDir 'spritesheet.webp'))) {
        if ((Test-Path -LiteralPath $Item) -and ((Get-Item -LiteralPath $Item -Force).Attributes -band [System.IO.FileAttributes]::ReparsePoint)) {
            throw "Refusing to overwrite redirected pet files"
        }
    }
    New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null
    $Backup = $null
    if ((Test-Path -LiteralPath (Join-Path $TargetDir 'pet.json')) -or (Test-Path -LiteralPath (Join-Path $TargetDir 'spritesheet.webp'))) {
        $Backup = Join-Path $PetsDir ('.backups\' + $Pet.id + '-' + [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffffffZ'))
        $BackupParent = Split-Path -Parent $Backup
        if ((Test-Path -LiteralPath $BackupParent) -and ((Get-Item -LiteralPath $BackupParent -Force).Attributes -band [System.IO.FileAttributes]::ReparsePoint)) {
            throw "Refusing redirected backup directory"
        }
        New-Item -ItemType Directory -Force -Path $Backup | Out-Null
        foreach ($Name in @('pet.json', 'spritesheet.webp')) {
            if (Test-Path -LiteralPath (Join-Path $TargetDir $Name)) {
                Copy-Item -LiteralPath (Join-Path $TargetDir $Name) -Destination (Join-Path $Backup $Name)
            }
        }
    }
    $Staging = Join-Path $PetsDir ('.install-' + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $Staging | Out-Null
    try {
        Copy-Item -LiteralPath $Spritesheet -Destination (Join-Path $Staging 'spritesheet.webp')
        Copy-Item -LiteralPath $PetJson -Destination (Join-Path $Staging 'pet.json')
        Move-Item -LiteralPath (Join-Path $Staging 'spritesheet.webp') -Destination (Join-Path $TargetDir 'spritesheet.webp') -Force
        Move-Item -LiteralPath (Join-Path $Staging 'pet.json') -Destination (Join-Path $TargetDir 'pet.json') -Force
    } catch {
        foreach ($Name in @('pet.json', 'spritesheet.webp')) {
            if ($Backup -and (Test-Path -LiteralPath (Join-Path $Backup $Name))) {
                Copy-Item -LiteralPath (Join-Path $Backup $Name) -Destination (Join-Path $TargetDir $Name) -Force
            } elseif (Test-Path -LiteralPath (Join-Path $TargetDir $Name)) {
                Remove-Item -LiteralPath (Join-Path $TargetDir $Name)
            }
        }
        throw
    } finally {
        $ResolvedStaging = [System.IO.Path]::GetFullPath($Staging)
        $ResolvedParent = [System.IO.Path]::GetFullPath($PetsDir).TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar
        if ($ResolvedStaging.StartsWith($ResolvedParent, [System.StringComparison]::OrdinalIgnoreCase)) {
            Remove-Item -LiteralPath $ResolvedStaging -Recurse -Force
        }
    }

    Write-Host "Installed $($Pet.display_name)"
    Write-Host "Target: $TargetDir"
}

Write-Host "Restart Codex or refresh the pet picker if the pet does not appear immediately."
