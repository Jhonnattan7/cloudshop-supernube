# Contrato de API — Servicio de Autenticación (Auth Service)

El servicio de autenticación permite la creación de usuarios y la generación de tokens JWT firmados para el acceso a las rutas protegidas en API Gateway.

---

## Endpoints

### 1. Registro de Usuario
* **Método**: `POST /auth/register`
* **Body**:
  ```json
  {
    "nombre": "Jhonnatan Perez",
    "email": "cliente@dominio.com",
    "password": "PasswordSegura123!",
    "rol": "CLIENTE"
  }
  ```
  *(Roles permitidos: `CLIENTE`, `OPERADOR`, `ADMINISTRADOR`)*

* **Respuesta Exitosa (201 Created)**:
  ```json
  {
    "message": "Usuario registrado exitosamente",
    "userId": "usr_abc123",
    "email": "cliente@dominio.com",
    "rol": "CLIENTE"
  }
  ```

---

### 2. Inicio de Sesión (Login)
* **Método**: `POST /auth/login`
* **Body**:
  ```json
  {
    "email": "cliente@dominio.com",
    "password": "PasswordSegura123!"
  }
  ```

* **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": "usr_abc123",
      "nombre": "Jhonnatan Perez",
      "email": "cliente@dominio.com",
      "rol": "CLIENTE"
    }
  }
  ```
