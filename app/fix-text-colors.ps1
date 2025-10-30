# Fix typography - replace gray text with anarchist colors
$files = @(
    "src\app\dare\[id]\page.tsx",
    "src\app\profile\[username]\page.tsx", 
    "src\app\bet\[id]\page.tsx",
    "src\app\[username]\page.tsx",
    "src\components\DareCard.tsx",
    "src\components\CreateDareModal.tsx"
)

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path $fullPath) {
        Write-Host "Updating $file..."
        (Get-Content $fullPath) -replace 'text-gray-600', 'text-anarchist-white' | Set-Content $fullPath
        Write-Host "✓ Updated $file"
    } else {
        Write-Host "× File not found: $file"
    }
}

Write-Host "Typography fix complete!"