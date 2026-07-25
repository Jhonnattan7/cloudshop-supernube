# Guía Técnica y de Evaluación para la Catedrática

**Asignatura**: Desarrollo en la Nube  
**Proyecto**: CloudShop Enterprise — Plataforma E-Commerce Cloud-Native en AWS  
**Catedrática**: Ing. Luz Rivas  
**Equipo**: Grupo Super Nube (Susana Beltran, Debbie Cruz, André Iraheta, Tiffany Melendez, Dana Ochoa, Jhonnatan Peñate)  
**Fecha de Entrega**: 25 de julio de 2026  

---

## 1. Acceso a la Plataforma Web en Vivo (AWS CloudFront + S3)

La plataforma ha sido desplegada en vivo utilizando una arquitectura 100% Serverless gestionada por **Terraform**. 

* **URL Pública de la Aplicación (CDN CloudFront)**:
  `https://d33szkdngruzwy.cloudfront.net`
* **URL Base de la API REST (Amazon API Gateway)**:
  `https://zyaiyt390a.execute-api.us-east-1.amazonaws.com/dev`

---

## 2. Credenciales de Prueba Predeterminadas

Para evaluar de inmediato la aplicación desde la web o mediante Postman:

| Rol | Email | Contraseña | Permisos y Alcance |
| :--- | :--- | :--- | :--- |
| **ADMINISTRADOR** | `admin@cloudshop.com` | `AdminSecretPassword123!` | Crear/editar/eliminar tiendas y productos, gestionar usuarios, actualizar estado de cualquier pedido y consultar el Dashboard Ejecutivo. |
| **CLIENTE (Ejemplo)** | `susana@cloudshop.com` | `SusanaPassword123!` | Explorar catálogo de productos, agregar items al carrito, confirmar pedidos y consultar el historial de pedidos propios. |
| **REGISTRO LIBRE** | *Cualquier correo* | *Cualquier clave* | En la pantalla de inicio de sesión (`login.html`), la catedrática puede usar la pestaña **"Registrarse"** para crear al instante nuevos usuarios con rol **`CLIENTE`** de acuerdo al principio de mínimo privilegio. |

---

## 3. Pruebas Automatizadas y Colección de Postman

En la raíz del repositorio se encuentra el archivo **`cloudshop_postman_collection.json`** (Versión 2.1.0).

### Instrucciones de uso para Postman:
1. Abrir Postman e importar el archivo `cloudshop_postman_collection.json`.
2. En la pestaña **Variables** de la colección, verificar o ajustar la variable `baseUrl` con la URL del API Gateway desplegado.
3. Ejecutar las solicitudes en orden secuencial:
   - `POST /auth/login` (Genera el JWT y lo almacena automáticamente en las variables de Postman).
   - `POST /stores` y `POST /products` (Creación de catálogo).
   - `POST /cart/items` y `POST /orders` (Creación de pedido y activación de EventBridge).
   - `GET /reports/dashboard` (Consulta de métricas ejecutivas).

---

## 4. Evidencias de los 4 Casos de Prueba Obligatorios

Las evidencias completas con capturas de pantalla de la consola AWS y ejecuciones HTTP se encuentran en `docs/evidence/`:

1. **Caso 1: Acceso Sin Permisos (403 Forbidden)**
   - **Prueba**: Petición a un recurso restringido (ej. `DELETE /products/{id}` o `GET /reports/dashboard`) utilizando un token de rol `CLIENTE` o sin encabezado de autorización.
   - **Resultado**: API Gateway y la Lambda de autorización devuelven inmediatamente `HTTP 403 Forbidden`.
   - **Evidencia**: `docs/evidence/caso1_403_prohibido.png`.

2. **Caso 2: Creación Exitosa de Pedido (Flujo Extremo a Extremo)**
   - **Prueba**: Un usuario `CLIENTE` crea un pedido mediante `POST /orders`.
   - **Flujo Asíncrono Desacoplado**:
     1. La Lambda `orders` responde `HTTP 201 Created` y emite el evento `ORDER_CREATED` a Amazon EventBridge.
     2. EventBridge invoca la Lambda `events` en segundo plano.
     3. La Lambda `events` reduce el stock en la tabla DynamoDB `products`.
     4. Se escribe el registro transaccional en la tabla DynamoDB `audit`.
     5. Se envía automáticamente la notificación por correo electrónico mediante **Amazon SES**.
   - **Evidencias**: `docs/evidence/caso2_1_pedido_creado.png`, `caso2_2_inventario_dynamo.png`, `caso2_3_auditoria_dynamo.png`, `caso2_4a_correo_gmail.png`, `caso2_4b_ses_consola.png`.

3. **Caso 3: Dashboard de Métricas y Observabilidad en CloudWatch**
   - **Prueba**: Consulta del Dashboard consolidado `cloudshop-supernube-dev-dashboard` en Amazon CloudWatch.
   - **Evidencia**: Gráficas en tiempo real de invocaciones Lambda, latencia promedio de API Gateway, tasa de errores 4xx/5xx y logs centralizados. `docs/evidence/README.md`.

4. **Caso 4: Despliegue 100% Automatizado mediante Terraform**
   - **Prueba**: Salida de `terraform apply` mostrando `Apply complete! Resources: X added, 0 changed, 0 destroyed.` y los outputs de infraestructura exportados.
   - **Evidencia**: `docs/evidence/README.md`.

---

## 5. Resumen de Arquitectura y Componentes AWS

```text
[ Cliente Web / Navegador / Postman ]
                 │
                 ▼
       Amazon CloudFront (CDN)
                 │
                 ▼
          Amazon S3 (Frontend)
                 │
                 ▼
           AWS WAF (Security)
                 │
                 ▼
      Amazon API Gateway (REST API)
                 │
                 ▼
    AWS Lambda (Auth, Catalog, Orders, Reports)
                 │
                 ▼
      Amazon DynamoDB (PAY_PER_REQUEST)
                 │
                 ▼
      Amazon EventBridge (Event Bus)
                 │
                 ├─────────────────────────┬─────────────────────────┐
                 ▼                         ▼                         ▼
      Actualizar Inventario        Registro de Auditoría      Notificación SES
       (DynamoDB products)         (DynamoDB audit)           (Email transaccional)
```
