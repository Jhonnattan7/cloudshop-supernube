# Evidencias de Ejecución — Casos de Prueba Obligatorios

Este directorio almacena las capturas de pantalla y registros de cURL / Postman / AWS Console que demuestran el cumplimiento de los 4 Casos de Prueba Obligatorios especificados en la rúbrica del proyecto.

---

## Estructura de Evidencias

### 🛑 Caso 1: Acceso Sin Permisos (Resultado esperado: 403 Forbidden)
- **Prueba**: Petición cURL a `/products` (POST/DELETE) o `/orders` sin token o con rol insuficiente.
- **Evidencia**: Captura de pantalla de Postman/cURL mostrando la respuesta HTTP 403 Forbidden devuelta por API Gateway / Custom Authorizer.
- **Archivo**: `case1-403-forbidden.png`

---

### 📦 Caso 2: Creación Exitosa de Pedido (Extremo a Extremo)
- **Prueba**: Flujo completo de compra (Registro -> Login -> Crear producto -> Agregar al carrito -> Crear Pedido).
- **Evidencias requeridas**:
  1. `case2-01-order-created.png`: Respuesta HTTP 201 Created de `POST /orders`.
  2. `case2-02-inventory-updated.png`: Tabla DynamoDB `cloudshop-products` mostrando el inventario decrementado.
  3. `case2-03-eventbridge.png`: Métrica/log del evento `ORDER_CREATED` procesado en EventBridge.
  4. `case2-04-audit-log.png`: Registro insertado en la tabla DynamoDB `cloudshop-audit`.
  5. `case2-05-email-sent.png`: Correo recibido en la bandeja de entrada del cliente mediante Amazon SES.

---

### 📊 Caso 3: Visualización de Métricas en CloudWatch
- **Prueba**: Acceso al Dashboard de CloudWatch generado por IaC.
- **Evidencias**:
  - `case3-01-cloudwatch-dashboard.png`: Vista general del Dashboard con invocaciones Lambda, latencias de API Gateway y contadores de errores.
  - `case3-02-cloudwatch-logs.png`: Logs de la Lambda de eventos procesando registros.

---

### 🏗️ Caso 4: Despliegue Completo mediante Terraform (100% IaC)
- **Prueba**: Ejecución exitosa de `terraform apply` sin intervenciones manuales.
- **Evidencias**:
  - `case4-01-terraform-apply-output.png`: Salida en terminal indicando `Apply complete!`.
  - `case4-02-aws-resources.png`: Consola de AWS mostrando el Bucket S3, CloudFront CDN, API Gateway y funciones Lambda creadas por Terraform.
