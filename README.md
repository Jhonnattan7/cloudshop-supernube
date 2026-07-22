# CloudShop Enterprise — cloudshop-supernube

> Plataforma e-commerce cloud-native en AWS — Lambda, DynamoDB, API Gateway, CloudFront, Terraform

[![Terraform](https://img.shields.io/badge/Terraform-%3E%3D1.6.0-7B42BC?logo=terraform)](https://developer.hashicorp.com/terraform/install)
[![AWS](https://img.shields.io/badge/AWS-us--east--1-FF9900?logo=amazonaws)](https://aws.amazon.com)
[![Team](https://img.shields.io/badge/Team-G01-blue)]()

---

## Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Guia de Inicio Rapido](#guia-de-inicio-rapido-para-el-equipo)
- [State Locking y Concurrencia](#state-locking-y-concurrencia)
- [Validacion Pre-Commit](#validacion-pre-commit)
- [Deploy de Lambdas](#deploy-de-lambdas)
- [Outputs de Infraestructura](#outputs-de-infraestructura)
- [Equipo](#equipo)

---

## Requisitos Previos

| Herramienta | Version Minima | Instalacion |
|---|---|---|
| Terraform | >= 1.6.0 | https://developer.hashicorp.com/terraform/install |
| AWS CLI | >= 2.0 | https://aws.amazon.com/cli/ |
| Node.js | >= 18.x | https://nodejs.org |
| Git | cualquiera | https://git-scm.com |

Verificar instalacion:

```bash
terraform --version
aws --version
node --version
git --version
```

---

## Estructura del Proyecto

```
cloudshop-supernube/
|
|-- terraform-bootstrap/          <- Bootstrap (solo admin, una vez)
|   |-- main.tf                   <- S3 bucket + DynamoDB lock table
|   |-- outputs.tf
|   +-- terraform.tfstate         <- Estado LOCAL (no se sube a S3)
|
|-- terraform/                    <- Infraestructura principal (todo el equipo)
|   |-- backend.tf                <- Conexion al backend remoto S3
|   |-- providers.tf              <- Provider AWS + default_tags
|   |-- versions.tf               <- Terraform >= 1.6, AWS ~> 5.0
|   |-- variables.tf              <- Variables globales
|   |-- locals.tf                 <- Prefijos, tags comunes
|   |-- main.tf                   <- Orquestador de modulos
|   |-- outputs.tf                <- URLs, ARNs exportados
|   +-- modules/
|       |-- api-gateway/          <- REST API + Stage + Deployment
|       |-- cloudfront/           <- CDN -> S3 Frontend
|       |-- cloudwatch/           <- Log Groups (14d retention) + Dashboard
|       |-- dynamodb/             <- Tablas genericas (PAY_PER_REQUEST)
|       |-- eventbridge/          <- Event Bus + Reglas de eventos
|       |-- iam/                  <- Lambda execution role + policies
|       |-- s3/                   <- Frontend bucket (website hosting)
|       |-- ses/                  <- Email identity para notificaciones
|       +-- waf/                  <- Web ACL + Managed Rules + Rate Limit
|
|-- lambdas/                      <- Microservicios Serverless
|   |-- auth/                     <- Autenticacion (Andre)
|   |-- catalog/                  <- Productos y tiendas (Debbie)
|   |-- orders/                   <- Pedidos (Dana)
|   |-- reports/                  <- Reportes y analytics (Tiffany)
|   |-- events/                   <- Consumidor de EventBridge
|   +-- shared/                   <- Utilidades compartidas
|
|-- frontend/                     <- React SPA (Susana)
|
|-- docs/                         <- Documentacion completa
|   |-- api/                      <- Contratos de API
|   |-- architecture/             <- Diagramas de arquitectura
|   |-- contracts/                <- Contratos entre servicios
|   |-- database/                 <- Esquemas DynamoDB
|   |-- deployment/               <- Guias de despliegue
|   |-- diagrams/                 <- Diagramas tecnicos
|   |-- evidence/                 <- Evidencias de ejecucion
|   +-- security/                 <- Politicas de seguridad
|
+-- setup.ps1                     <- Script de configuracion de entorno
```

Nota: `terraform-bootstrap/` mantiene su estado localmente en `terraform.tfstate`. Este directorio solo lo administra el lider de infraestructura (Jhonnatan). El equipo trabaja en `terraform/`, `lambdas/` y `frontend/`.

---

## Guia de Inicio Rapido para el Equipo

### Paso 1 — Clonar o sincronizar

```bash
git pull origin main
```

### Paso 2 — Configurar credenciales AWS

Configurar tus credenciales de AWS CLI:

```bash
aws configure --profile cloudshop
# AWS Access Key ID:     (proporcionada por tu administrador/equipo)
# AWS Secret Access Key: (proporcionada por tu administrador/equipo)
# Default region:        us-east-1
# Default output format: json
```

### Paso 3 — Configurar entorno (cada vez que abren terminal)

```powershell
# Ejecutar el script de setup:
.\setup.ps1
```

### Paso 4 — Instalar dependencias de las Lambdas (Obligatorio pre-deploy)

Antes de cualquier `terraform apply`, se deben empaquetar las dependencias Node.js de las funciones Lambda:

```powershell
.\install-deps.ps1
```

### Paso 5 — Configurar Variables Locales (terraform.tfvars)

Copiar la plantilla de variables y ajustar tus datos (como el correo verificado en Amazon SES):

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

### Paso 6 — Inicializar y Aplicar Terraform

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

Salida esperada: `Apply complete! Resources: X added, 0 changed, 0 destroyed.`

### Paso 7 — Despliegue del Frontend y CDN (S3 + CloudFront)

Una vez aplicados los recursos de Terraform, desplegar la SPA web y purgar la CDN:

```powershell
# 1. Copiar assets estáticos al bucket S3
$BUCKET = (terraform output -raw frontend_bucket_name)
aws s3 sync ../frontend s3://$BUCKET --delete --profile cloudshop

# 2. Invalidar caché global de CloudFront
$DIST_ID = (terraform output -raw cloudfront_distribution_id)
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*" --profile cloudshop
```


---

## State Locking y Concurrencia

Terraform almacena el estado de la infraestructura en S3. Cuando alguien ejecuta `terraform apply`, se adquiere un lock en DynamoDB para evitar que dos personas modifiquen el estado al mismo tiempo.

### Protocolo del equipo

| Regla | Descripcion |
|---|---|
| Avisar antes de apply | Escribir en el chat: "Voy a hacer terraform apply" |
| Esperar confirmacion | No aplicar hasta que nadie mas este aplicando |
| No cancelar a la mitad | Ctrl+C durante un apply puede corromper el estado |
| plan es seguro | terraform plan es de solo lectura, siempre se puede ejecutar |
| Lock atascado | Si un lock queda activo sin razon, avisar al admin para force-unlock |

### Referencia rapida de seguridad

| Comando | Seguro | Notas |
|---|---|---|
| terraform init | Si | Solo conecta al backend |
| terraform validate | Si | Solo valida sintaxis |
| terraform fmt | Si | Solo formatea archivos locales |
| terraform plan | Si | Solo lectura, no modifica nada |
| terraform apply | Coordinar | Modifica estado y recursos en AWS |
| terraform destroy | Solo admin | Destruye toda la infraestructura |

---

## Validacion Pre-Commit

Antes de hacer commit de cambios en `terraform/`:

```bash
cd terraform
terraform fmt -recursive    # Formatear codigo
terraform validate          # Validar sintaxis
terraform plan              # Revisar que se crearia/cambiaria
```

Interpretacion de simbolos en el plan:

| Simbolo | Significado | Accion |
|---|---|---|
| + (verde) | Recurso nuevo que se crea | Generalmente seguro |
| ~ (amarillo) | Modificacion in-place | Revisar que cambia |
| - (rojo) | Destruccion de recurso | DETENER y revisar con el equipo |
| -/+ (rojo) | Destroy + Recreate | CRITICO. Se pierden datos |

---

## Deploy de Lambdas

Cada miembro despliega su lambda de forma independiente.

### Flujo de trabajo

```powershell
# 1. Ir al directorio de tu lambda
cd lambdas/<tu-servicio>

# 2. Instalar dependencias
npm install

# 3. Comprimir
Compress-Archive -Path .\* -DestinationPath function.zip -Force

# 4. Primera vez — crear la funcion:
aws lambda create-function `
  --function-name cloudshop-supernube-dev-<servicio>-lambda `
  --runtime nodejs18.x `
  --role <LAMBDA_ROLE_ARN_del_output> `
  --handler index.handler `
  --zip-file fileb://function.zip

# 5. Actualizaciones siguientes:
aws lambda update-function-code `
  --function-name cloudshop-supernube-dev-<servicio>-lambda `
  --zip-file fileb://function.zip

# 6. Probar:
aws lambda invoke `
  --function-name cloudshop-supernube-dev-<servicio>-lambda `
  --payload '{"httpMethod":"GET","path":"/test"}' `
  response.json

# 7. Ver respuesta:
Get-Content response.json

# 8. Ver logs:
aws logs tail /aws/lambda/cloudshop-supernube-dev-<servicio>-lambda --follow
```

### Variables de entorno por Lambda

| Lambda | Variables de Entorno |
|---|---|
| auth | USERS_TABLE=cloudshop-supernube-dev-users |
| catalog | PRODUCTS_TABLE=cloudshop-supernube-dev-products, STORES_TABLE=cloudshop-supernube-dev-stores |
| orders | ORDERS_TABLE=cloudshop-supernube-dev-orders, CARTS_TABLE=cloudshop-supernube-dev-carts |
| events | AUDIT_TABLE=cloudshop-supernube-dev-audit, EVENT_BUS=cloudshop-supernube-dev-event-bus |
| reports | ORDERS_TABLE=cloudshop-supernube-dev-orders, PRODUCTS_TABLE=cloudshop-supernube-dev-products |

---

## Outputs de Infraestructura

Una vez desplegada la infraestructura, estos valores se llenan con `terraform output`:

| Recurso | Valor |
|---|---|
| API Gateway URL | `TBD` |
| CloudFront URL | `TBD` |
| EventBus Name | `TBD` |
| Frontend Bucket | `TBD` |
| Users Table ARN | `TBD` |
| Products Table ARN | `TBD` |
| Stores Table ARN | `TBD` |
| Orders Table ARN | `TBD` |
| Carts Table ARN | `TBD` |
| Audit Table ARN | `TBD` |

---

## Deployment Guides

1. [Prerequisites](docs/deployment/prerequisites.md)
2. [Deployment Guide](docs/deployment/deploy.md)
3. [Teardown Guide](docs/deployment/teardown.md)

---

## Equipo

| Miembro | Rol | Area |
|---|---|---|
| Jhonnatan Penate | Infraestructura / DevOps Lead | `terraform/` |
| Andre | Desarrollo Backend | `lambdas/auth/` |
| Debbie | Desarrollo Backend | `lambdas/catalog/` |
| Dana | Desarrollo Backend | `lambdas/orders/` |
| Tiffany | Desarrollo Backend | `lambdas/reports/` |
| Susana | Desarrollo Frontend | `frontend/` |

---

## Informacion Tecnica

| Parametro | Valor |
|---|---|
| AWS Account ID | 947421917372 |
| Region | us-east-1 |
| Terraform Version | >= 1.6.0 |
| AWS Provider | ~> 5.0 |
| Environment | dev |
| State Bucket | cloudshop-supernube-terraform-state |
| Lock Table | cloudshop-supernube-terraform-lock |
| Resource Prefix | cloudshop-supernube-dev |
