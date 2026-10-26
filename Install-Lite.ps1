param([Parameter(Mandatory = $true)][string]$ProfilePath)
$ErrorActionPreference = 'Stop'
$profileRoot = (Resolve-Path -LiteralPath $ProfilePath).Path
$modsRoot = Join-Path $profileRoot 'chrome\sine-mods'
$registryPath = Join-Path $modsRoot 'mods.json'
$importsPath = Join-Path $modsRoot 'chrome.css'
if (!(Test-Path -LiteralPath $registryPath) -or !(Test-Path -LiteralPath (Join-Path $profileRoot 'prefs.js'))) {
    throw 'Choose an existing Zen profile with Sine installed (about:support > Profile Folder).'
}
$registry = Get-Content -LiteralPath $registryPath -Raw | ConvertFrom-Json -AsHashtable
$theme = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'theme.json') -Raw | ConvertFrom-Json -AsHashtable
$backup = Join-Path $PSScriptRoot ('local-backup\lite-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff'))
New-Item -ItemType Directory -Path $backup -Force | Out-Null
Copy-Item -LiteralPath $registryPath -Destination (Join-Path $backup 'mods.json')
Copy-Item -LiteralPath $importsPath -Destination (Join-Path $backup 'chrome.css')
$target = Join-Path $modsRoot $theme.id
if (Test-Path -LiteralPath $target) { Copy-Item -LiteralPath $target -Destination (Join-Path $backup 'previous-mod') -Recurse }
New-Item -ItemType Directory -Path $target -Force | Out-Null
foreach ($file in @('theme.json', 'chrome.css', 'zia-flat.uc.js', 'LICENSE')) {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot $file) -Destination (Join-Path $target $file)
}
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'icons') -Destination $target -Recurse -Force
$theme.enabled = $true
$theme.origin = 'local'
$theme['no-updates'] = $true # Main still distributes the old CSS-only companion.
$registry[$theme.id] = $theme
if ($registry.ContainsKey('zia')) { $registry.zia.enabled = $false }
$imports = ''
foreach ($mod in $registry.Values) {
    if ($mod.enabled -and $mod.style.chrome) {
        $uri = [Uri]::new((Join-Path (Join-Path $modsRoot $mod.id) $mod.style.chrome)).AbsoluteUri
        $imports += "@import `"$uri`";`n"
    }
}
$utf8 = [Text.UTF8Encoding]::new($false)
[IO.File]::WriteAllText($registryPath, ($registry | ConvertTo-Json -Depth 40 -Compress), $utf8)
[IO.File]::WriteAllText($importsPath, $imports, $utf8)
$state = @{ profile = $profileRoot; backup = $backup; registryHash = (Get-FileHash -LiteralPath $registryPath).Hash; importsHash = (Get-FileHash -LiteralPath $importsPath).Hash }
[IO.File]::WriteAllText((Join-Path $PSScriptRoot 'local-backup\lite-install.json'), ($state | ConvertTo-Json), $utf8)
Write-Output "Zia Flat Lite installed. Original Zia disabled. Backup: $backup"
Write-Output 'Restart Zen completely to load the new runtime. Automatic updates are paused for this experimental branch.'
