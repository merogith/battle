# Increments deploy patch in battle.html and commits. Called from hooks/pre-push.
# Git runs the hook before packing objects; the same push then includes the new commit.
# Exit: 0 = ok (bumped or skipped), 2 = error (abort push)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$file = Join-Path $root 'battle.html'

if (-not (Test-Path -LiteralPath $file)) {
    Write-Host "deploy-version: battle.html not found at $file" -ForegroundColor Red
    exit 2
}

git -C $root diff HEAD --quiet -- battle.html 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host 'deploy-version: skip bump — commit or stash battle.html changes first.' -ForegroundColor Yellow
    exit 0
}

$content = [System.IO.File]::ReadAllText($file)
$pattern = '(id="deploy-version-patch"[^>]*>)\s*v(\d+)\.(\d+)\.(\d+)\s*(</div>)'
$m = [regex]::Match($content, $pattern)
if (-not $m.Success) {
    Write-Host 'deploy-version: marker not found in battle.html' -ForegroundColor Red
    exit 2
}

$major = [int]$m.Groups[2].Value
$minor = [int]$m.Groups[3].Value
$patch = [int]$m.Groups[4].Value + 1
$newFragment = '{0}v{1}.{2}.{3}{4}' -f $m.Groups[1].Value, $major, $minor, $patch, $m.Groups[5].Value
$newContent = $content.Substring(0, $m.Index) + $newFragment + $content.Substring($m.Index + $m.Length)

$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($file, $newContent, $utf8)

git -C $root add -- battle.html
git -C $root diff --cached --quiet -- battle.html
if ($LASTEXITCODE -eq 0) {
    git -C $root checkout -- battle.html 2>$null
    exit 0
}

$newVer = "v$major.$minor.$patch"
git -C $root commit -m "chore: deploy $newVer"
if (-not $?) {
    git -C $root checkout -- battle.html 2>$null
    exit 2
}

Write-Host "deploy-version: committed $newVer" -ForegroundColor DarkGray
exit 0
