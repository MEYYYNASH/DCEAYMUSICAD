param(
    [Parameter(Mandatory=$false)]
    [string]$GitHubRepoUrl = "",
    [Parameter(Mandatory=$false)]
    [string]$VersionTag = "v1.0.1"
)

Write-Host "=== XECEAY GitHub Auto-Update Release Publisher ===" -ForegroundColor Cyan

if (-not (Test-Path ".git")) {
    git init
    git branch -M main
}

git add .
git commit -m "Release XECEAY $VersionTag" --allow-empty

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
    Write-Host "Done! GitHub Actions will now build and attach XECEAY-release.apk to Release $VersionTag." -ForegroundColor Cyan
} else {
    Write-Host "Git commit prepared! Run: .\publish-release.ps1 -GitHubRepoUrl 'https://github.com/YOUR_USER/xeceay-music.git' -VersionTag 'v1.0.1'" -ForegroundColor Yellow
}
