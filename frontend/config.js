// config.js
// Archivo central de configuración de la API de CloudShop

// URL Base de tu API Gateway en AWS (Dev)
const API_BASE_URL = "https://zyaiyt390a.execute-api.us-east-1.amazonaws.com/dev";

// Habilitar o deshabilitar la simulación local (Mock Mode) para pruebas sin AWS
const USE_MOCK = false;

// Helper genérico para peticiones fetch con JWT
async function apiFetch(endpoint, options = {}) {
  if (USE_MOCK) {
    return await mockApiFetch(endpoint, options);
  }

  const token = localStorage.getItem("jwt_token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  
  // Agregamos un helper json() seguro
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.clear();
      if (typeof showToast === "function") {
        showToast("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.", "warning");
      }
      setTimeout(() => { window.location.href = "login.html"; }, 1200);
    }
    throw {
      statusCode: response.status,
      error: data.error || 'API_ERROR',
      message: data.message || 'Error en la petición de la API'
    };
  }
  return data;
}

// ============================================================================
// MOTOR DE SIMULACIÓN LOCAL (MOCK BACKEND) CON LOCALSTORAGE
// ============================================================================

// Inicializar base de datos mock en localStorage si está vacía
function initMockDB() {
  const DB_VERSION = "v3.1";
  if (localStorage.getItem("mock_db_version") !== DB_VERSION) {
    localStorage.removeItem("mock_users");
    localStorage.removeItem("mock_stores");
    localStorage.removeItem("mock_products");
    localStorage.removeItem("mock_orders");
    localStorage.removeItem("mock_carts");
    localStorage.setItem("mock_db_version", DB_VERSION);
  }

  if (!localStorage.getItem("mock_users")) {
    const users = [
      {
        userId: "usr_admin_seed",
        nombre: "Administrador Global",
        email: "admin@cloudshop.com",
        password: "AdminSecretPassword123!",
        rol: "ADMIN",
        activo: true,
        createdAt: "2026-05-01T00:00:00Z"
      },
      {
        userId: "usr_susana",
        nombre: "Susana",
        email: "susana@cloudshop.com",
        password: "SusanaPassword123!",
        rol: "CLIENTE",
        activo: true,
        createdAt: "2026-05-01T00:00:00Z"
      },
      {
        userId: "usr_pedro",
        nombre: "Pedro Gómez",
        email: "pedro@gmail.com",
        password: "PedroPassword123!",
        rol: "CLIENTE",
        activo: true,
        createdAt: "2026-05-01T00:00:00Z"
      },
      {
        userId: "usr_maria",
        nombre: "María Rodríguez",
        email: "maria@gmail.com",
        password: "MariaPassword123!",
        rol: "CLIENTE",
        activo: true,
        createdAt: "2026-05-01T00:00:00Z"
      }
    ];
    localStorage.setItem("mock_users", JSON.stringify(users));
  }

  if (!localStorage.getItem("mock_stores")) {
    const stores = [
      {
        storeId: "store_mock001",
        nombre: "Tienda Central",
        descripcion: "Tienda principal de CloudShop",
        activo: true,
        createdAt: "2026-05-01T00:00:00Z",
        updatedAt: "2026-05-01T00:00:00Z"
      },
      {
        storeId: "store_mock002",
        nombre: "Tienda Norte",
        descripcion: "Sucursal zona norte",
        activo: true,
        createdAt: "2026-05-01T00:00:00Z",
        updatedAt: "2026-05-01T00:00:00Z"
      },
      {
        storeId: "store_mock003",
        nombre: "Tienda Virtual Tecno",
        descripcion: "E-Commerce especializado en Gadgets",
        activo: true,
        createdAt: "2026-06-01T00:00:00Z",
        updatedAt: "2026-06-01T00:00:00Z"
      }
    ];
    localStorage.setItem("mock_stores", JSON.stringify(stores));
  }

  if (!localStorage.getItem("mock_products")) {
    const products = [
      {
        productId: "prod_mock001",
        storeId: "store_mock001",
        codigo: "LAP-001",
        nombre: "Laptop Dell XPS",
        descripcion: "Laptop empresarial 15 pulgadas",
        categoria: "Electronica",
        precio: 999.99,
        inventario: 10,
        activo: true,
        createdAt: "2026-05-01T00:00:00Z",
        updatedAt: "2026-07-15T00:00:00Z"
      },
      {
        productId: "prod_mock002",
        storeId: "store_mock001",
        codigo: "MOU-002",
        nombre: "Mouse inalámbrico",
        descripcion: "Mouse ergonómico 2.4GHz",
        categoria: "Accesorios",
        precio: 19.99,
        inventario: 0,
        activo: true,
        createdAt: "2026-05-01T00:00:00Z",
        updatedAt: "2026-07-15T00:00:00Z"
      },
      {
        productId: "prod_mock003",
        storeId: "store_mock002",
        codigo: "TEC-003",
        nombre: "Teclado mecánico",
        descripcion: "Teclado mecánico retroiluminado",
        categoria: "Accesorios",
        precio: 59.99,
        inventario: 12,
        activo: true,
        createdAt: "2026-05-01T00:00:00Z",
        updatedAt: "2026-07-15T00:00:00Z"
      },
      {
        productId: "prod_mock004",
        storeId: "store_mock003",
        codigo: "MON-004",
        nombre: "Monitor Gamer LED 27",
        descripcion: "Pantalla Gamer IPS 144Hz",
        categoria: "Electronica",
        precio: 249.99,
        inventario: 8,
        activo: true,
        createdAt: "2026-06-01T00:00:00Z",
        updatedAt: "2026-07-15T00:00:00Z"
      },
      {
        productId: "prod_mock005",
        storeId: "store_mock001",
        codigo: "SIL-005",
        nombre: "Silla Ergonómica Pro",
        descripcion: "Silla de oficina soporte lumbar",
        categoria: "Hogar",
        precio: 189.50,
        inventario: 4,
        activo: true,
        createdAt: "2026-05-10T00:00:00Z",
        updatedAt: "2026-07-15T00:00:00Z"
      },
      {
        productId: "prod_mock006",
        storeId: "store_mock002",
        codigo: "AUR-006",
        nombre: "Auriculares Bluetooth",
        descripcion: "Audífonos inalámbricos noise cancelling",
        categoria: "Accesorios",
        precio: 45.00,
        inventario: 0,
        activo: true,
        createdAt: "2026-05-15T00:00:00Z",
        updatedAt: "2026-07-15T00:00:00Z"
      }
    ];
    localStorage.setItem("mock_products", JSON.stringify(products));
  }

  if (!localStorage.getItem("mock_carts")) {
    localStorage.setItem("mock_carts", JSON.stringify({}));
  }

  if (!localStorage.getItem("mock_orders")) {
    const orders = [
      {
        orderId: "ord_mock001",
        userId: "usr_susana",
        email: "susana@cloudshop.com",
        items: [
          { productId: "prod_mock001", nombre: "Laptop Dell XPS", precioUnitario: 999.99, quantity: 1, subtotal: 999.99 }
        ],
        total: 999.99,
        estado: "ENTREGADO",
        createdAt: "2026-05-02T14:30:00Z"
      },
      {
        orderId: "ord_mock002",
        userId: "usr_pedro",
        email: "pedro@gmail.com",
        items: [
          { productId: "prod_mock002", nombre: "Mouse inalámbrico", precioUnitario: 19.99, quantity: 1, subtotal: 19.99 }
        ],
        total: 19.99,
        estado: "ENTREGADO",
        createdAt: "2026-05-15T18:00:00Z"
      },
      {
        orderId: "ord_mock003",
        userId: "usr_maria",
        email: "maria@gmail.com",
        items: [
          { productId: "prod_mock003", nombre: "Teclado mecánico", precioUnitario: 59.99, quantity: 1, subtotal: 59.99 },
          { productId: "prod_mock004", nombre: "Monitor Gamer LED 27", precioUnitario: 249.99, quantity: 1, subtotal: 249.99 }
        ],
        total: 309.98,
        estado: "ENTREGADO",
        createdAt: "2026-06-01T10:15:00Z"
      },
      {
        orderId: "ord_mock004",
        userId: "usr_susana",
        email: "susana@cloudshop.com",
        items: [
          { productId: "prod_mock003", nombre: "Teclado mecánico", precioUnitario: 59.99, quantity: 1, subtotal: 59.99 },
          { productId: "prod_mock002", nombre: "Mouse inalámbrico", precioUnitario: 19.99, quantity: 1, subtotal: 19.99 }
        ],
        total: 79.98,
        estado: "CANCELADO",
        createdAt: "2026-06-10T12:00:00Z"
      },
      {
        orderId: "ord_mock005",
        userId: "usr_pedro",
        email: "pedro@gmail.com",
        items: [
          { productId: "prod_mock004", nombre: "Monitor Gamer LED 27", precioUnitario: 249.99, quantity: 1, subtotal: 249.99 }
        ],
        total: 249.99,
        estado: "ENTREGADO",
        createdAt: "2026-06-22T09:45:00Z"
      },
      {
        orderId: "ord_mock006",
        userId: "usr_maria",
        email: "maria@gmail.com",
        items: [
          { productId: "prod_mock005", nombre: "Silla Ergonómica Pro", precioUnitario: 189.50, quantity: 1, subtotal: 189.50 }
        ],
        total: 189.50,
        estado: "CONFIRMADO",
        createdAt: "2026-07-05T16:30:00Z"
      },
      {
        orderId: "ord_mock007",
        userId: "usr_susana",
        email: "susana@cloudshop.com",
        items: [
          { productId: "prod_mock005", nombre: "Silla Ergonómica Pro", precioUnitario: 189.50, quantity: 1, subtotal: 189.50 },
          { productId: "prod_mock006", nombre: "Auriculares Bluetooth", precioUnitario: 45.00, quantity: 1, subtotal: 45.00 }
        ],
        total: 234.50,
        estado: "ENVIADO",
        createdAt: "2026-07-12T11:20:00Z"
      },
      {
        orderId: "ord_mock008",
        userId: "usr_pedro",
        email: "pedro@gmail.com",
        items: [
          { productId: "prod_mock003", nombre: "Teclado mecánico", precioUnitario: 59.99, quantity: 1, subtotal: 59.99 }
        ],
        total: 59.99,
        estado: "EN_PREPARACION",
        createdAt: "2026-07-20T15:00:00Z"
      },
      {
        orderId: "ord_mock009",
        userId: "usr_susana",
        email: "susana@cloudshop.com",
        items: [
          { productId: "prod_mock006", nombre: "Auriculares Bluetooth", precioUnitario: 45.00, quantity: 1, subtotal: 45.00 }
        ],
        total: 45.00,
        estado: "PENDIENTE",
        createdAt: "2026-07-22T17:40:00Z"
      },
      {
        orderId: "ord_mock010",
        userId: "usr_admin_seed",
        email: "admin@cloudshop.com",
        items: [
          { productId: "prod_mock003", nombre: "Teclado mecánico", precioUnitario: 59.99, quantity: 1, subtotal: 59.99 }
        ],
        total: 59.99,
        estado: "ENTREGADO",
        createdAt: "2026-07-23T11:00:00Z"
      }
    ];
    localStorage.setItem("mock_orders", JSON.stringify(orders));
  }
}

// Ejecutar inicialización
if (USE_MOCK) {
  initMockDB();
  console.log("%c[Mock Mode Active] Las peticiones se simularán localmente en el navegador.", "color: #b19ffb; font-weight: bold; font-size: 14px;");
}

// Simular retraso de red
const sleep = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

async function mockApiFetch(endpoint, options = {}) {
  await sleep();

  const method = (options.method || "GET").toUpperCase();
  const body = options.body ? JSON.parse(options.body) : null;
  const token = localStorage.getItem("jwt_token");

  // Decodificar usuario desde token ficticio
  let currentUser = null;
  if (token && token.startsWith("mock_jwt_token_for_")) {
    const userId = token.replace("mock_jwt_token_for_", "");
    const users = JSON.parse(localStorage.getItem("mock_users") || "[]");
    currentUser = users.find(u => u.userId === userId && u.activo);
  }

  const role = currentUser ? currentUser.rol : null;

  // Helper para respuestas mock
  const respond = (status, data) => {
    if (status >= 400) {
      throw {
        statusCode: status,
        error: data.error || 'BAD_REQUEST',
        message: data.message || 'Error en la petición'
      };
    }
    return data;
  };

  // Helper para validar rol
  const checkRole = (allowedRoles) => {
    if (!currentUser) return respond(401, { error: "UNAUTHORIZED", message: "Token requerido" });
    if (!allowedRoles.includes(role)) return respond(403, { error: "FORBIDDEN", message: "Acceso no autorizado para tu rol" });
  };

  // --- SERVICIO DE AUTENTICACIÓN ---
  if (endpoint === "/auth/register" && method === "POST") {
    const { email, password, nombre, rol } = body || {};
    if (!email || !password || !nombre) {
      return respond(400, { error: "VALIDATION_ERROR", message: "email, password y nombre son requeridos" });
    }
    const users = JSON.parse(localStorage.getItem("mock_users") || "[]");
    if (users.some(u => u.email === email)) {
      return respond(400, { error: "VALIDATION_ERROR", message: "Email ya está registrado" });
    }
    
    // NOTA: El backend real ignora el rol y crea CLIENTE.
    // Para simplificar pruebas del docente en mock, si viene un rol lo aceptamos, si no CLIENTE.
    const selectedRole = (rol && ["CLIENTE", "OPERADOR", "ADMIN"].includes(rol)) ? rol : "CLIENTE";
    
    const newUser = {
      userId: "usr_" + Math.random().toString(36).substr(2, 9),
      email,
      password, // En texto plano en mock
      nombre,
      rol: selectedRole,
      activo: true,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    localStorage.setItem("mock_users", JSON.stringify(users));

    return respond(201, {
      userId: newUser.userId,
      email: newUser.email,
      nombre: newUser.nombre,
      rol: newUser.rol,
      activo: true,
      createdAt: newUser.createdAt
    });
  }

  if (endpoint === "/auth/login" && method === "POST") {
    const { email, password } = body || {};
    if (!email || !password) {
      return respond(400, { error: "VALIDATION_ERROR", message: "email y password son requeridos" });
    }
    const users = JSON.parse(localStorage.getItem("mock_users") || "[]");
    const user = users.find(u => u.email === email && u.activo);

    if (!user || user.password !== password) {
      return respond(401, { error: "UNAUTHORIZED", message: "Invalid email or password" });
    }

    return respond(200, {
      token: `mock_jwt_token_for_${user.userId}`,
      userId: user.userId,
      rol: user.rol,
      expiresIn: 3600
    });
  }

  // --- SERVICIO DE CATÁLOGO (TIENDAS) ---
  if (endpoint === "/stores") {
    if (method === "GET") {
      const stores = JSON.parse(localStorage.getItem("mock_stores") || "[]");
      // CLIENTE/OPERADOR solo ven activas. ADMIN ve todas.
      if (role === "ADMIN") {
        return respond(200, { stores });
      }
      return respond(200, { stores: stores.filter(s => s.activo) });
    }

    if (method === "POST") {
      checkRole(["ADMIN"]);
      const { nombre, descripcion } = body || {};
      if (!nombre) return respond(400, { error: "VALIDATION_ERROR", message: "nombre es requerido" });

      const stores = JSON.parse(localStorage.getItem("mock_stores") || "[]");
      const newStore = {
        storeId: "store_" + Math.random().toString(36).substr(2, 9),
        nombre,
        descripcion: descripcion || "",
        activo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      stores.push(newStore);
      localStorage.setItem("mock_stores", JSON.stringify(stores));
      return respond(201, newStore);
    }
  }

  if (endpoint.startsWith("/stores/")) {
    const storeId = endpoint.split("/")[2];
    const stores = JSON.parse(localStorage.getItem("mock_stores") || "[]");
    const storeIndex = stores.findIndex(s => s.storeId === storeId);

    if (storeIndex === -1) return respond(404, { error: "NOT_FOUND", message: "Tienda no encontrada" });

    if (method === "GET") {
      return respond(200, stores[storeIndex]);
    }

    if (method === "PUT") {
      checkRole(["ADMIN"]);
      const { nombre, descripcion } = body || {};
      if (nombre) stores[storeIndex].nombre = nombre;
      if (descripcion !== undefined) stores[storeIndex].descripcion = descripcion;
      stores[storeIndex].updatedAt = new Date().toISOString();

      localStorage.setItem("mock_stores", JSON.stringify(stores));
      return respond(200, stores[storeIndex]);
    }

    if (method === "DELETE") {
      checkRole(["ADMIN"]);
      stores[storeIndex].activo = false;
      stores[storeIndex].updatedAt = new Date().toISOString();

      localStorage.setItem("mock_stores", JSON.stringify(stores));
      return respond(200, { storeId, activo: false, updatedAt: stores[storeIndex].updatedAt });
    }
  }

  // --- SERVICIO DE CATÁLOGO (PRODUCTOS) ---
  if (endpoint.startsWith("/products")) {
    // Verificar si es GET /products o GET /products/{id}
    const parts = endpoint.split("?")[0].split("/");
    
    if (parts.length === 2) { // "/products"
      if (method === "GET") {
        let products = JSON.parse(localStorage.getItem("mock_products") || "[]");
        
        // Parsear query parameters de forma simple
        const urlParams = new URLSearchParams(endpoint.includes("?") ? endpoint.split("?")[1] : "");
        const catFilter = urlParams.get("categoria");
        const storeFilter = urlParams.get("storeId");

        if (catFilter) {
          products = products.filter(p => p.categoria.toLowerCase() === catFilter.toLowerCase());
        }
        if (storeFilter) {
          products = products.filter(p => p.storeId === storeFilter);
        }

        // Filtro por activo
        if (role !== "ADMIN") {
          products = products.filter(p => p.activo);
        }

        return respond(200, { products });
      }

      if (method === "POST") {
        checkRole(["ADMIN"]);
        const { codigo, nombre, descripcion, categoria, precio, inventario, storeId } = body || {};
        if (!codigo || !nombre || !categoria || typeof precio !== 'number' || typeof inventario !== 'number' || !storeId) {
          return respond(400, { error: "VALIDATION_ERROR", message: "Todos los campos son requeridos" });
        }

        const stores = JSON.parse(localStorage.getItem("mock_stores") || "[]");
        const store = stores.find(s => s.storeId === storeId);
        if (!store || !store.activo) {
          return respond(400, { error: "VALIDATION_ERROR", message: "Tienda asociada no existe o no está activa" });
        }

        const products = JSON.parse(localStorage.getItem("mock_products") || "[]");
        const newProduct = {
          productId: "prod_" + Math.random().toString(36).substr(2, 9),
          storeId,
          codigo,
          nombre,
          descripcion: descripcion || "",
          categoria,
          precio,
          inventario,
          activo: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        products.push(newProduct);
        localStorage.setItem("mock_products", JSON.stringify(products));
        return respond(201, newProduct);
      }
    } else if (parts.length === 3) { // "/products/{id}"
      const productId = parts[2];
      const products = JSON.parse(localStorage.getItem("mock_products") || "[]");
      const prodIndex = products.findIndex(p => p.productId === productId);

      if (prodIndex === -1) return respond(404, { error: "NOT_FOUND", message: "Producto no encontrado" });

      if (method === "GET") {
        return respond(200, products[prodIndex]);
      }

      if (method === "PUT") {
        checkRole(["ADMIN", "OPERADOR"]);
        if (role === "OPERADOR") {
          // OPERADOR solo puede actualizar inventario
          const keys = Object.keys(body || {});
          if (keys.length !== 1 || keys[0] !== "inventario") {
            return respond(403, { 
              error: "FORBIDDEN", 
              message: "OPERADOR solo puede actualizar el campo 'inventario'. Elimina los demás campos del body e intenta de nuevo." 
            });
          }
          products[prodIndex].inventario = body.inventario;
        } else {
          // ADMIN puede actualizar todo
          const { codigo, nombre, descripcion, categoria, precio, inventario, storeId, activo } = body || {};
          if (codigo !== undefined) products[prodIndex].codigo = codigo;
          if (nombre !== undefined) products[prodIndex].nombre = nombre;
          if (descripcion !== undefined) products[prodIndex].descripcion = descripcion;
          if (categoria !== undefined) products[prodIndex].categoria = categoria;
          if (precio !== undefined) products[prodIndex].precio = precio;
          if (inventario !== undefined) products[prodIndex].inventario = inventario;
          if (activo !== undefined) products[prodIndex].activo = activo;
          if (storeId !== undefined) {
            const stores = JSON.parse(localStorage.getItem("mock_stores") || "[]");
            const store = stores.find(s => s.storeId === storeId);
            if (!store || !store.activo) {
              return respond(400, { error: "VALIDATION_ERROR", message: "Tienda asociada no existe o no está activa" });
            }
            products[prodIndex].storeId = storeId;
          }
        }

        products[prodIndex].updatedAt = new Date().toISOString();
        localStorage.setItem("mock_products", JSON.stringify(products));
        return respond(200, products[prodIndex]);
      }

      if (method === "DELETE") {
        checkRole(["ADMIN"]);
        // Hard delete
        products.splice(prodIndex, 1);
        localStorage.setItem("mock_products", JSON.stringify(products));
        return respond(200, { productId, deleted: true });
      }
    }
  }

  // --- SERVICIO DE CARRITO ---
  if (endpoint === "/cart") {
    if (!currentUser) return respond(401, { error: "UNAUTHORIZED", message: "Token requerido" });
    if (role === "OPERADOR") return respond(403, { error: "FORBIDDEN", message: "OPERADOR no tiene carrito de compras" });

    const carts = JSON.parse(localStorage.getItem("mock_carts") || "{}");
    const userCart = carts[currentUser.userId] || [];

    if (method === "GET") {
      return respond(200, { userId: currentUser.userId, items: userCart });
    }

    if (method === "DELETE") {
      carts[currentUser.userId] = [];
      localStorage.setItem("mock_carts", JSON.stringify(carts));
      return respond(200, { userId: currentUser.userId, items: [] });
    }
  }

  if (endpoint === "/cart/items" && method === "POST") {
    if (!currentUser) return respond(401, { error: "UNAUTHORIZED", message: "Token requerido" });
    if (role === "OPERADOR") return respond(403, { error: "FORBIDDEN", message: "OPERADOR no puede agregar productos al carrito" });

    const { productId, quantity } = body || {};
    if (!productId || typeof quantity !== "number" || quantity <= 0) {
      return respond(400, { error: "VALIDATION_ERROR", message: "productId y una cantidad positiva son requeridos" });
    }

    const products = JSON.parse(localStorage.getItem("mock_products") || "[]");
    const product = products.find(p => p.productId === productId);
    if (!product || !product.activo) {
      return respond(400, { error: "VALIDATION_ERROR", message: "El producto no existe o está inactivo" });
    }

    const carts = JSON.parse(localStorage.getItem("mock_carts") || "{}");
    const userCart = carts[currentUser.userId] || [];
    const itemIndex = userCart.findIndex(item => item.productId === productId);

    if (itemIndex > -1) {
      userCart[itemIndex].quantity += quantity;
    } else {
      userCart.push({
        productId,
        quantity,
        updatedAt: new Date().toISOString()
      });
    }

    carts[currentUser.userId] = userCart;
    localStorage.setItem("mock_carts", JSON.stringify(carts));
    return respond(201, { message: "Producto agregado al carrito", item: { productId, quantity } });
  }

  if (endpoint.startsWith("/cart/items/")) {
    if (!currentUser) return respond(401, { error: "UNAUTHORIZED", message: "Token requerido" });
    if (role === "OPERADOR") return respond(403, { error: "FORBIDDEN", message: "OPERADOR no puede modificar el carrito" });

    const productId = endpoint.split("/")[3];
    const carts = JSON.parse(localStorage.getItem("mock_carts") || "{}");
    const userCart = carts[currentUser.userId] || [];
    const itemIndex = userCart.findIndex(item => item.productId === productId);

    if (itemIndex === -1) return respond(404, { error: "NOT_FOUND", message: "Producto no encontrado en el carrito" });

    if (method === "PUT") {
      const { quantity } = body || {};
      if (typeof quantity !== "number" || quantity < 0) {
        return respond(400, { error: "VALIDATION_ERROR", message: "Cantidad inválida" });
      }

      if (quantity === 0) {
        userCart.splice(itemIndex, 1);
        carts[currentUser.userId] = userCart;
        localStorage.setItem("mock_carts", JSON.stringify(carts));
        return respond(200, { userId: currentUser.userId, productId, removed: true });
      }

      userCart[itemIndex].quantity = quantity;
      userCart[itemIndex].updatedAt = new Date().toISOString();
      carts[currentUser.userId] = userCart;
      localStorage.setItem("mock_carts", JSON.stringify(carts));
      return respond(200, userCart[itemIndex]);
    }

    if (method === "DELETE") {
      userCart.splice(itemIndex, 1);
      carts[currentUser.userId] = userCart;
      localStorage.setItem("mock_carts", JSON.stringify(carts));
      return respond(200, { userId: currentUser.userId, productId, removed: true });
    }
  }

  // --- SERVICIO DE PEDIDOS ---
  if (endpoint === "/orders") {
    if (!currentUser) return respond(401, { error: "UNAUTHORIZED", message: "Token requerido" });

    if (method === "GET") {
      const orders = JSON.parse(localStorage.getItem("mock_orders") || "[]");
      // CLIENTE solo ve los suyos, ADMIN/OPERADOR ven todos
      if (role === "CLIENTE") {
        return respond(200, { orders: orders.filter(o => o.userId === currentUser.userId) });
      }
      return respond(200, { orders });
    }

    if (method === "POST") {
      if (role === "OPERADOR") return respond(403, { error: "FORBIDDEN", message: "OPERADOR no puede crear pedidos" });

      const carts = JSON.parse(localStorage.getItem("mock_carts") || "{}");
      const userCart = carts[currentUser.userId] || [];
      if (userCart.length === 0) {
        return respond(400, { error: "VALIDATION_ERROR", message: "El carrito está vacío" });
      }

      const products = JSON.parse(localStorage.getItem("mock_products") || "[]");
      const orderItems = [];
      let total = 0;

      // Validar stock y resolver nombres/precios
      for (const item of userCart) {
        const prod = products.find(p => p.productId === item.productId);
        if (!prod || !prod.activo) {
          return respond(400, { error: "VALIDATION_ERROR", message: `El producto ${item.productId} ya no está disponible` });
        }
        if (prod.inventario < item.quantity) {
          return respond(400, { error: "VALIDATION_ERROR", message: `Stock insuficiente para ${prod.nombre}. Disponible: ${prod.inventario}` });
        }

        // Restar inventario
        prod.inventario -= item.quantity;

        const subtotal = prod.precio * item.quantity;
        total += subtotal;

        orderItems.push({
          productId: prod.productId,
          nombre: prod.nombre,
          precioUnitario: prod.precio,
          quantity: item.quantity,
          subtotal
        });
      }

      // Guardar productos con stock restado
      localStorage.setItem("mock_products", JSON.stringify(products));

      // Crear el pedido
      const orders = JSON.parse(localStorage.getItem("mock_orders") || "[]");
      const newOrder = {
        orderId: "ord_" + Math.floor(100000000 + Math.random() * 900000000),
        userId: currentUser.userId,
        email: currentUser.email,
        items: orderItems,
        total,
        estado: "PENDIENTE",
        createdAt: new Date().toISOString()
      };

      orders.push(newOrder);
      localStorage.setItem("mock_orders", JSON.stringify(orders));

      // Vaciar carrito
      carts[currentUser.userId] = [];
      localStorage.setItem("mock_carts", JSON.stringify(carts));

      return respond(201, newOrder);
    }
  }

  if (endpoint.startsWith("/orders/")) {
    const parts = endpoint.split("/");
    const orderId = parts[2];
    const orders = JSON.parse(localStorage.getItem("mock_orders") || "[]");
    const orderIndex = orders.findIndex(o => o.orderId === orderId);

    if (orderIndex === -1) return respond(404, { error: "NOT_FOUND", message: "Pedido no encontrado" });
    const order = orders[orderIndex];

    // Permisos para ver detalle
    if (role === "CLIENTE" && order.userId !== currentUser.userId) {
      return respond(403, { error: "FORBIDDEN", message: "No puedes acceder a este pedido" });
    }

    if (parts.length === 3) { // GET /orders/{orderId}
      if (method === "GET") {
        return respond(200, order);
      }
    }

    if (parts.length === 4 && parts[3] === "status" && method === "PUT") {
      checkRole(["ADMIN", "OPERADOR"]);
      const { estado } = body || {};
      const validStatuses = ["PENDIENTE", "CONFIRMADO", "EN_PREPARACION", "ENVIADO", "ENTREGADO"];
      
      if (!validStatuses.includes(estado)) {
        return respond(400, { error: "VALIDATION_ERROR", message: "Estado de pedido inválido" });
      }

      // Validar transición
      const currentStatus = order.estado;
      const curIdx = validStatuses.indexOf(currentStatus);
      const newIdx = validStatuses.indexOf(estado);

      // Debe ir un paso adelante (o permitir re-asignar el mismo estado)
      if (newIdx !== curIdx + 1 && newIdx !== curIdx) {
        return respond(400, { 
          error: "VALIDATION_ERROR", 
          message: `Transición de estado inválida de ${currentStatus} a ${estado}. Debe seguir el flujo secuencial.` 
        });
      }

      order.estado = estado;
      order.updatedAt = new Date().toISOString();
      localStorage.setItem("mock_orders", JSON.stringify(orders));
      return respond(200, order);
    }

    if (parts.length === 4 && parts[3] === "cancel" && method === "POST") {
      // CLIENTE puede cancelar solo el suyo. ADMIN/OPERADOR pueden cancelar cualquiera
      if (role === "CLIENTE" && order.userId !== currentUser.userId) {
        return respond(403, { error: "FORBIDDEN", message: "No puedes cancelar este pedido" });
      }

      order.estado = "CANCELADO";
      order.updatedAt = new Date().toISOString();

      // Devolver inventario al stock
      const products = JSON.parse(localStorage.getItem("mock_products") || "[]");
      for (const item of order.items) {
        const prod = products.find(p => p.productId === item.productId);
        if (prod) {
          prod.inventario += item.quantity;
        }
      }
      localStorage.setItem("mock_products", JSON.stringify(products));
      localStorage.setItem("mock_orders", JSON.stringify(orders));

      return respond(200, order);
    }
  }

  // --- SERVICIO DE REPORTES ---
  if (endpoint === "/reports/dashboard" && method === "GET") {
    checkRole(["ADMIN"]);

    const orders = JSON.parse(localStorage.getItem("mock_orders") || "[]");
    const products = JSON.parse(localStorage.getItem("mock_products") || "[]");
    const stores = JSON.parse(localStorage.getItem("mock_stores") || "[]");

    // 1. totalVentas
    const activeOrders = orders.filter(o => o.estado !== "CANCELADO");
    const totalVentas = activeOrders.reduce((sum, o) => sum + o.total, 0);

    // 2. ventasPorTienda
    const salesByStore = {};
    stores.forEach(s => { salesByStore[s.nombre] = 0; });

    activeOrders.forEach(o => {
      o.items.forEach(item => {
        // Encontrar tienda del producto
        const prod = products.find(p => p.productId === item.productId);
        if (prod) {
          const store = stores.find(s => s.storeId === prod.storeId);
          if (store) {
            salesByStore[store.nombre] = (salesByStore[store.nombre] || 0) + item.subtotal;
          }
        }
      });
    });

    const ventasPorTienda = Object.keys(salesByStore).map(name => ({
      tienda: name,
      total: parseFloat(salesByStore[name].toFixed(2))
    }));

    // 3. productosMasVendidos
    const productSales = {};
    const productNames = {};
    activeOrders.forEach(o => {
      o.items.forEach(item => {
        productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
        if (item.nombre) {
          productNames[item.productId] = item.nombre;
        }
      });
    });

    const productosMasVendidos = Object.keys(productSales)
      .map(id => {
        const prod = products.find(p => p.productId === id);
        let nombre = "Producto Eliminado";
        let categoria = "Otros";
        if (prod) {
          nombre = prod.nombre;
          categoria = prod.categoria || "Otros";
        } else if (productNames[id]) {
          nombre = `${productNames[id]} (Eliminado)`;
          // Deducir categoría para productos históricos comunes sembrados para dar variedad de color
          const lowName = nombre.toLowerCase();
          if (lowName.includes("teclado") || lowName.includes("monitor") || lowName.includes("auriculares") || lowName.includes("laptop") || lowName.includes("gamer")) {
            categoria = "Electronica";
          } else if (lowName.includes("silla") || lowName.includes("escritorio") || lowName.includes("lampara")) {
            categoria = "Hogar";
          } else if (lowName.includes("mochila") || lowName.includes("gorra") || lowName.includes("taza")) {
            categoria = "Accesorios";
          }
        }
        return {
          productId: id,
          nombre: nombre,
          categoria: categoria,
          cantidadVendida: productSales[id]
        };
      })
      .sort((a, b) => b.cantidadVendida - a.cantidadVendida)
      .slice(0, 3);

    // 4. productosAgotados
    const productosAgotados = products
      .filter(p => p.activo && p.inventario <= 0)
      .map(p => ({
        productId: p.productId,
        nombre: p.nombre,
        storeId: p.storeId
      }));

    // 5. clientesConMasCompras
    const clientSales = {};
    const clientCounts = {};
    activeOrders.forEach(o => {
      clientSales[o.userId] = (clientSales[o.userId] || 0) + o.total;
      clientCounts[o.userId] = (clientCounts[o.userId] || 0) + 1;
    });

    const clientesConMasCompras = Object.keys(clientSales)
      .map(id => ({
        userId: id,
        totalGastado: parseFloat(clientSales[id].toFixed(2)),
        cantidadPedidos: clientCounts[id]
      }))
      .sort((a, b) => b.totalGastado - a.totalGastado)
      .slice(0, 10);

    // 6. pedidosPorEstado
    const pedidosPorEstado = {
      PENDIENTE: 0,
      CONFIRMADO: 0,
      EN_PREPARACION: 0,
      ENVIADO: 0,
      ENTREGADO: 0,
      CANCELADO: 0
    };
    orders.forEach(o => {
      if (pedidosPorEstado[o.estado] !== undefined) {
        pedidosPorEstado[o.estado]++;
      }
    });

    // 7. historicoVentas (Últimos 6 meses)
    const salesByMonth = {};
    const monthsOrder = [];
    const tempDate = new Date("2026-07-23T12:00:00Z");
    for (let i = 5; i >= 0; i--) {
      const d = new Date(tempDate.getFullYear(), tempDate.getMonth() - i, 1);
      const monthKey = d.toLocaleString('es-ES', { month: 'short' }).replace('.', '').toLowerCase();
      salesByMonth[monthKey] = 0;
      monthsOrder.push(monthKey);
    }

    activeOrders.forEach(o => {
      const orderDate = new Date(o.createdAt);
      const monthKey = orderDate.toLocaleString('es-ES', { month: 'short' }).replace('.', '').toLowerCase();
      if (salesByMonth[monthKey] !== undefined) {
        salesByMonth[monthKey] += o.total;
      }
    });

    const historicoVentas = monthsOrder.map(month => ({
      mes: month.charAt(0).toUpperCase() + month.slice(1),
      total: parseFloat(salesByMonth[month].toFixed(2))
    }));

    return respond(200, {
      totalVentas: parseFloat(totalVentas.toFixed(2)),
      ventasPorTienda,
      productosMasVendidos,
      productosAgotados,
      clientesConMasCompras,
      pedidosPorEstado,
      historicoVentas
    });
  }

  return respond(404, { error: "NOT_FOUND", message: `Ruta mock no implementada para ${method} ${endpoint}` });
}

// ============================================================================
// HELPERS Y UTILIDADES GLOBALES DE INTERFAZ
// ============================================================================

// Mostrar notificación flotante (Toast)
function showToast(message, type = "success") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  let icon = "[Info]";
  if (type === "success") icon = "[Ok]";
  if (type === "warning") icon = "[Aviso]";
  if (type === "error") icon = "[Error]";

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  // Auto-eliminar después de 3.5s
  setTimeout(() => {
    toast.classList.add("toast-exit");
    toast.addEventListener("animationend", () => {
      toast.remove();
    });
  }, 3500);
}

// Alerta Personalizada Premium (reemplaza alert nativo)
function showCustomAlert(title, message, onOk = null) {
  const prevAlert = document.getElementById("custom-modal-alert");
  if (prevConfirm = document.getElementById("custom-modal-confirm")) prevConfirm.remove();
  if (prevAlert) prevAlert.remove();

  const container = document.createElement("div");
  container.id = "custom-modal-alert";
  container.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9999; display:flex; align-items:center; justify-content:center; backdrop-filter: blur(4px);";

  container.innerHTML = `
    <div class="glass-panel" style="width: 400px; max-width: 90%; padding: 2rem; border: 1.5px solid rgba(200, 94, 181, 0.25); text-align: center; display: flex; flex-direction: column; gap: 1.25rem;">
      <div style="font-size: 2.2rem; color: var(--primary);"><i class="fi fi-rr-info"></i></div>
      <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-main); margin: 0;">${title}</h3>
      <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.4; margin: 0;">${message}</p>
      <button id="custom-alert-ok-btn" class="btn-primary" style="width: 100%; height: 42px; font-weight: 600;">Aceptar</button>
    </div>
  `;

  document.body.appendChild(container);

  const okBtn = container.querySelector("#custom-alert-ok-btn");
  const closeAlert = () => {
    container.remove();
    if (onOk) onOk();
  };
  okBtn.onclick = closeAlert;
  container.onclick = (e) => {
    if (e.target === container) closeAlert();
  };
}

// Confirmación Personalizada Premium (reemplaza confirm nativo)
function showCustomConfirm(title, message, onConfirm, onCancel = null) {
  const prevConfirm = document.getElementById("custom-modal-confirm");
  if (prevConfirm) prevConfirm.remove();

  const container = document.createElement("div");
  container.id = "custom-modal-confirm";
  container.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9999; display:flex; align-items:center; justify-content:center; backdrop-filter: blur(4px);";

  container.innerHTML = `
    <div class="glass-panel" style="width: 420px; max-width: 90%; padding: 2.25rem; border: 1.5px solid rgba(239, 68, 68, 0.25); text-align: center; display: flex; flex-direction: column; gap: 1.25rem;">
      <div style="font-size: 2.2rem; color: #dc2626;"><i class="fi fi-rr-triangle-warning"></i></div>
      <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-main); margin: 0;">${title}</h3>
      <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.4; margin: 0;">${message}</p>
      <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
        <button id="custom-confirm-yes-btn" class="btn-danger" style="flex: 1; height: 42px; font-weight: 600;">Confirmar</button>
        <button id="custom-confirm-no-btn" class="btn-secondary" style="flex: 1; height: 42px; font-weight: 600;">Cancelar</button>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  const yesBtn = container.querySelector("#custom-confirm-yes-btn");
  const noBtn = container.querySelector("#custom-confirm-no-btn");

  const closeConfirm = (accepted) => {
    container.remove();
    if (accepted) {
      if (onConfirm) onConfirm();
    } else {
      if (onCancel) onCancel();
    }
  };

  yesBtn.onclick = () => closeConfirm(true);
  noBtn.onclick = () => closeConfirm(false);
  container.onclick = (e) => {
    if (e.target === container) closeConfirm(false);
  };
}

// Cerrar sesión
function logout() {
  localStorage.removeItem("jwt_token");
  localStorage.removeItem("jwt_role");
  localStorage.removeItem("jwt_email");
  localStorage.removeItem("jwt_name");
  localStorage.removeItem("jwt_userId");
  showToast("Sesión cerrada", "success");
  setTimeout(() => {
    window.location.href = "login.html";
  }, 800);
}

// Actualizar barra de navegación con estado del usuario
function updateNavbar() {
  const token = localStorage.getItem("jwt_token");
  const role = localStorage.getItem("jwt_role");
  const name = localStorage.getItem("jwt_name") || "Usuario";

  const navPanel = document.getElementById("nav-user-panel");
  const mainLinks = document.getElementById("nav-links");
  
  if (!navPanel) return;

  if (!token) {
    const isLoginPage = window.location.pathname.endsWith("login.html");
    if (isLoginPage) {
      navPanel.innerHTML = "";
    } else {
      navPanel.innerHTML = `<a href="login.html" class="btn-primary" style="padding: 0.4rem 1rem; font-size: 0.85rem;">Iniciar Sesión</a>`;
    }

    if (mainLinks) {
      if (isLoginPage) {
        mainLinks.innerHTML = "";
      } else {
        mainLinks.innerHTML = `<li><a href="index.html" class="nav-link active"><i class="fi fi-rr-store-alt" style="margin-right:0.4rem; font-size:0.85rem; color:var(--primary);"></i>Catálogo</a></li>`;
      }
    }
    return;
  }

  // Clases CSS por rol
  let roleClass = "";
  let roleText = role;
  if (role === "ADMIN") {
    roleClass = "user-role-admin";
    roleText = "Administrador";
  } else if (role === "OPERADOR") {
    roleClass = "user-role-operador";
    roleText = "Operador";
  } else {
    roleText = "Cliente";
  }

  // Generar enlaces del menú
  if (mainLinks) {
    let linksHTML = `<li><a href="index.html" id="link-catalog" class="nav-link"><i class="fi fi-rr-store-alt" style="margin-right:0.4rem; font-size:0.85rem; color:var(--primary);"></i>Catálogo</a></li>`;
    
    if (role === "CLIENTE") {
      linksHTML += `<li><a href="cart.html" id="link-cart" class="nav-link"><i class="fi fi-rr-shopping-cart" style="margin-right:0.4rem; font-size:0.85rem; color:var(--primary);"></i>Carrito <span id="nav-cart-count" style="background:#ef4444; color:white; border-radius:10px; padding:1px 6px; font-size:0.75rem; font-weight:700; margin-left:2px; display:none;">0</span></a></li>`;
    }
    
    linksHTML += `<li><a href="orders.html" id="link-orders" class="nav-link"><i class="fi fi-rr-receipt" style="margin-right:0.4rem; font-size:0.85rem; color:var(--primary);"></i>Pedidos</a></li>`;
    
    if (role === "ADMIN" || role === "OPERADOR") {
      linksHTML += `<li><a href="dashboard.html" id="link-dashboard" class="nav-link"><i class="fi fi-rr-chart-histogram" style="margin-right:0.4rem; font-size:0.85rem; color:var(--primary);"></i>Dashboard</a></li>`;
    }
    
    mainLinks.innerHTML = linksHTML;

    // Resaltar link activo
    const path = window.location.pathname;
    const page = path.substring(path.lastIndexOf("/") + 1) || "index.html";
    const linkIdMap = {
      "index.html": "link-catalog",
      "catalog.html": "link-catalog",
      "cart.html": "link-cart",
      "orders.html": "link-orders",
      "dashboard.html": "link-dashboard"
    };
    const activeId = linkIdMap[page];
    if (activeId) {
      const activeLink = document.getElementById(activeId);
      if (activeLink) activeLink.classList.add("active");
    }
  }

  // Mostrar panel de usuario
  navPanel.innerHTML = `
    <div class="user-badge ${roleClass}">
      <span>${name} (${roleText})</span>
    </div>
    <button onclick="logout()" class="btn-logout">Cerrar Sesión</button>
  `;

  // Actualizar contador del carrito
  updateCartCounter();

  // Convertir selectores nativos en personalizados estilizados
  setTimeout(makeCustomSelects, 100);
}

// Actualizar contador del carrito en el menú
async function updateCartCounter() {
  const token = localStorage.getItem("jwt_token");
  const role = localStorage.getItem("jwt_role");
  const counter = document.getElementById("nav-cart-count");
  if (!counter || !token || role === "OPERADOR") return;

  try {
    const data = await apiFetch("/cart");
    const count = data.items ? data.items.reduce((sum, i) => sum + i.quantity, 0) : 0;
    counter.textContent = count;
    counter.style.display = count > 0 ? "inline" : "none";
  } catch (err) {
    console.error("Error al actualizar contador de carrito:", err);
  }
}

// Proteger ruta para roles específicos
function requireAuth(allowedRoles = null) {
  const token = localStorage.getItem("jwt_token");
  const role = localStorage.getItem("jwt_role");

  if (!token) {
    window.location.href = "login.html?redirect=" + encodeURIComponent(window.location.pathname);
    return false;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    showCustomAlert("Acceso Denegado", "Tu rol no tiene permisos para ver esta página.", () => {
      window.location.href = "index.html";
    });
    return false;
  }
  return true;
}

// Convertir selectores nativos en selectores personalizados estilizados
function makeCustomSelects() {
  document.querySelectorAll("select.filter-select").forEach(select => {
    // Si ya existe el wrapper personalizado, lo removemos para volverlo a construir de forma limpia sin duplicados
    if (select.nextElementSibling && select.nextElementSibling.classList.contains("custom-select-wrapper")) {
      select.nextElementSibling.remove();
    }

    // Crear el contenedor personalizado
    const wrapper = document.createElement("div");
    wrapper.className = "custom-select-wrapper";
    if (select.style.width) wrapper.style.width = select.style.width;
    if (select.id) wrapper.dataset.for = select.id;
    
    // Aplicar estado disabled inicial
    if (select.disabled) {
      wrapper.classList.add("disabled");
    }

    // Crear el trigger del selector
    const trigger = document.createElement("div");
    trigger.className = "custom-select-trigger";
    
    const triggerText = document.createElement("span");
    triggerText.className = "custom-select-trigger-text";
    triggerText.textContent = select.options[select.selectedIndex]?.textContent || "";
    trigger.appendChild(triggerText);
    wrapper.appendChild(trigger);

    // Crear la lista de opciones (dropdown)
    const dropdown = document.createElement("div");
    dropdown.className = "custom-select-dropdown";

    Array.from(select.options).forEach(opt => {
      const customOpt = document.createElement("div");
      customOpt.className = "custom-select-option" + (opt.selected ? " selected" : "");
      customOpt.textContent = opt.textContent;
      
      customOpt.onclick = (e) => {
        e.stopPropagation();
        select.value = opt.value;
        triggerText.textContent = opt.textContent;
        dropdown.querySelectorAll(".custom-select-option").forEach(o => o.classList.remove("selected"));
        customOpt.classList.add("selected");
        wrapper.classList.remove("open");
        select.dispatchEvent(new Event("change"));
      };
      dropdown.appendChild(customOpt);
    });

    wrapper.appendChild(dropdown);

    // Ocultar select original y poner el custom wrapper en su lugar
    select.style.display = "none";
    select.parentNode.insertBefore(wrapper, select.nextSibling);

    // Evento de clic en el trigger
    trigger.onclick = (e) => {
      if (select.disabled) return; // Si el select original está desactivado, no abrir dropdown
      e.stopPropagation();
      document.querySelectorAll(".custom-select-wrapper").forEach(w => {
        if (w !== wrapper) w.classList.remove("open");
      });
      wrapper.classList.toggle("open");
    };
  });
}

// Cerrar todos los dropdowns al hacer clic fuera
document.addEventListener("click", () => {
  document.querySelectorAll(".custom-select-wrapper").forEach(w => w.classList.remove("open"));
});


