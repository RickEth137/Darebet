# Build and Deploy Script for Dare Betting Platform (PowerShell)
Write-Host "🔥 BUILDING AND DEPLOYING DARE BETTING CONTRACTS 🔥" -ForegroundColor Red

# Set Solana to localhost for development
Write-Host "Setting Solana to localhost..." -ForegroundColor Yellow
solana config set --url localhost

# Start local validator if not running
Write-Host "Starting local Solana validator..." -ForegroundColor Yellow
Start-Process -FilePath "solana-test-validator" -ArgumentList "--reset" -NoNewWindow

# Wait for validator to start
Start-Sleep -Seconds 10

# Build the Anchor program
Write-Host "Building Anchor program..." -ForegroundColor Yellow
Set-Location "../programs/dare-betting"

anchor build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Get-Process -Name "solana-test-validator" | Stop-Process -Force
    exit 1
}

# Deploy the program
Write-Host "Deploying program..." -ForegroundColor Yellow
anchor deploy

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deploy failed!" -ForegroundColor Red
    Get-Process -Name "solana-test-validator" | Stop-Process -Force
    exit 1
}

# Get the program ID
$PROGRAM_ID = solana address -k target/deploy/dare_betting-keypair.json
Write-Host "✅ Program deployed successfully!" -ForegroundColor Green
Write-Host "📝 Program ID: $PROGRAM_ID" -ForegroundColor Cyan

# Update the frontend with the actual program ID
Set-Location "../../app"
Write-Host "Updating frontend with Program ID..." -ForegroundColor Yellow

$filePath = "src/hooks/useDareProgram.ts"
$content = Get-Content $filePath -Raw
$content = $content -replace "11111111111111111111111111111111", $PROGRAM_ID
Set-Content $filePath -Value $content

Write-Host "🎉 DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "🔑 Program ID: $PROGRAM_ID" -ForegroundColor Cyan
Write-Host "🌐 Network: localhost" -ForegroundColor Cyan
Write-Host "💻 Frontend updated automatically" -ForegroundColor Cyan

Write-Host "Local validator is running. Press Ctrl+C to stop." -ForegroundColor Yellow