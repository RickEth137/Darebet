# Comprehensive typography fix script
$ErrorActionPreference = "Continue"

# Define file patterns and their full paths  
$filesToUpdate = @(
    "src\app\profile\[username]\page.tsx",
    "src\app\bet\[id]\page.tsx", 
    "src\app\[username]\page.tsx"
)

foreach ($file in $filesToUpdate) {
    $fullPath = Join-Path $PSScriptRoot $file
    Write-Host "Checking: $file"
    
    if (Test-Path $fullPath) {
        Write-Host "  ✓ Found, updating..."
        
        # Read content
        $content = Get-Content $fullPath -Raw
        
        # Replace gray text patterns
        $content = $content -replace 'text-gray-600', 'text-anarchist-white'
        $content = $content -replace 'text-gray-900', 'text-anarchist-red' 
        
        # Also fix hover states
        $content = $content -replace 'hover:text-gray-900', 'hover:text-anarchist-red'
        
        # Write back
        Set-Content $fullPath $content
        Write-Host "  ✓ Updated $file"
    } else {
        Write-Host "  × File not found: $file"
    }
}

Write-Host ""
Write-Host "Typography consistency update completed!"
Write-Host "All main headings should now be red (text-anarchist-red)"
Write-Host "All secondary text should now be white (text-anarchist-white)"