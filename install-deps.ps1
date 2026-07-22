# CloudShop Enterprise — Script de instalación de dependencias de Lambdas
# Ejecutar antes de terraform apply: .\install-deps.ps1

Write-Host ""
Write-Host "=== Instalando dependencias en cada Lambda ===" -ForegroundColor Cyan
Write-Host ""

$lambdas = Get-ChildItem -Path "./lambdas" -Directory

foreach ($lambda in $lambdas) {
    $pkgJson = Join-Path $lambda.FullName "package.json"
    if (Test-Path $pkgJson) {
        Write-Host "→ Instalando dependencias en: $($lambda.Name)..." -ForegroundColor Yellow
        Push-Location $lambda.FullName
        npm install --omit=dev
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✔ $($lambda.Name) listo." -ForegroundColor Green
        } else {
            Write-Host "  ✖ Error al instalar en $($lambda.Name)" -ForegroundColor Red
        }
        Pop-Location
    }
}

Write-Host ""
Write-Host "✔ Dependencias listas. Ya puedes ejecutar terraform apply." -ForegroundColor Green
Write-Host ""
