$ErrorActionPreference = 'Stop'
$state = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'local-backup\lite-install.json') -Raw | ConvertFrom-Json
$modsRoot = Join-Path $state.profile 'chrome\sine-mods'
foreach ($entry in @(@{file='mods.json';hash=$state.registryHash}, @{file='chrome.css';hash=$state.importsHash})) {
    if ((Get-FileHash -LiteralPath (Join-Path $modsRoot $entry.file)).Hash -ne $entry.hash) {
        throw 'Sine configuration changed after installation. Restore stopped before changing any files.'
    }
}
foreach ($file in @('mods.json', 'chrome.css')) {
    Copy-Item -LiteralPath (Join-Path $state.backup $file) -Destination (Join-Path $modsRoot $file)
}
$oldMod = Join-Path $state.backup 'previous-mod'
if (Test-Path -LiteralPath $oldMod) {
    Copy-Item -Path (Join-Path $oldMod '*') -Destination (Join-Path $modsRoot 'zia-flat') -Recurse -Force
}
Write-Output 'Previous Sine configuration restored. Restart Zen completely.'
