# CloudShop SuperNube — Setup de entorno
# Ejecutar al abrir una terminal nueva: .\setup.ps1

$env:AWS_PROFILE = "cloudshop"
$env:AWS_DEFAULT_REGION = "us-east-1"

Write-Host ""
Write-Host "=== CloudShop SuperNube ===" -ForegroundColor Cyan
Write-Host "AWS Profile:  $env:AWS_PROFILE" -ForegroundColor Green
Write-Host "AWS Region:   $env:AWS_DEFAULT_REGION" -ForegroundColor Green
Write-Host ""

# Verificar que las credenciales funcionan
try {
    $identity = aws sts get-caller-identity --output json 2>$null | ConvertFrom-Json
    Write-Host "Cuenta AWS:   $($identity.Account)" -ForegroundColor Green
    Write-Host "Usuario:      $($identity.Arn)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Entorno listo. Puedes trabajar." -ForegroundColor Green
} catch {
    Write-Host "ERROR: No se pudo conectar a AWS." -ForegroundColor Red
    Write-Host "Asegurate de haber corrido: aws configure --profile cloudshop" -ForegroundColor Yellow
    Write-Host "Con las credenciales que te compartio Jhonnatan." -ForegroundColor Yellow
}

Write-Host ""
