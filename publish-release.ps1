param(
    [Parameter(Mandatory=$false)]
    [string]$GitHubRepoUrl = "https://github.com/MEYYYNASH/DCEAYMUSICAD.git",
    [Parameter(Mandatory=$false)]
    [string]$VersionTag = "v2.1.0"
)

Write-Host "=== DCEAY GitHub Auto-Update Release Publisher ===" -ForegroundColor Cyan
Write-Host "Tagline: One App, All Your Music" -ForegroundColor DarkCyan

if (-not (Test-Path ".git")) {
    git init
    git branch -M main
}

git add .
git commit -m "Release DCEAY $VersionTag — One App, All Your Music" --allow-empty

if ($GitHubRepoUrl -ne "") {
    $existing = git remote
    if ($existing -contains "origin") {
        git remote set-url origin $GitHubRepoUrl
    } else {
        git remote add origin $GitHubRepoUrl
    }
    git tag -f $VersionTag
    Write-Host "Pushing code and tag $VersionTag to $GitHubRepoUrl..." -ForegroundColor Green
    git push -u origin main --tags
    Write-Host "Done! GitHub Actions will now build DCEAY-release.apk, calculate SHA-256, and publish Release $VersionTag." -ForegroundColor Cyan
} else {
    Write-Host "Git commit prepared! Run: .\publish-release.ps1 -GitHubRepoUrl 'https://github.com/MEYYYNASH/DCEAY.git' -VersionTag 'v1.2.1'" -ForegroundColor Yellow
}
