# Increments deploy patch in battle.html and commits. Called from hooks/pre-push.
# Exit: 0 = no bump / skip, 1 = committed (caller re-runs git push), 2 = error (abort push)

$ErrorActionPreference = 'Stop'
$root = git rev-parse --show-toplevel 2>$null
if (-not $root) { exit 0 }

$file = Join-Path $root 'battle.html'
if (-not (Test-Path -LiteralPath $file)) { exit 2 }

git diff HEAD --quiet -- battle.html 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host 'deploy-version: skip bump — commit or discard battle.html changes first.' -ForegroundColor Yellow
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

git add -- battle.html
git diff --cached --quiet -- battle.html
if ($LASTEXITCODE -eq 0) {
    git checkout -- battle.html 2>$null
    exit 0
}

$newVer = "v$major.$minor.$patch"
git commit -m "chore: deploy $newVer"
if ($LASTEXITCODE -ne 0) {
    git checkout -- battle.html 2>$null
    exit 2
}

Write-Host "deploy-version: committed $newVer" -ForegroundColor DarkGray
exit 1
