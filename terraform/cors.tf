# API Gateway CORS Configuration

# Gateway Responses
resource "aws_api_gateway_gateway_response" "cors_4xx" {
  rest_api_id   = module.api_gateway.api_id
  response_type = "DEFAULT_4XX"

  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'OPTIONS,GET,POST,PUT,DELETE'"
  }
}

resource "aws_api_gateway_gateway_response" "cors_5xx" {
  rest_api_id   = module.api_gateway.api_id
  response_type = "DEFAULT_5XX"

  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'OPTIONS,GET,POST,PUT,DELETE'"
  }
}

# Reusable CORS headers
locals {
  cors_response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }

  cors_integration_response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,GET,POST,PUT,DELETE'"
  }
}

# OPTIONS Methods per Resource

# /auth/register
resource "aws_api_gateway_method" "auth_register_options" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.auth_register.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_register_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.auth_register.id
  http_method = aws_api_gateway_method.auth_register_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "auth_register_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.auth_register.id
  http_method = aws_api_gateway_method.auth_register_options.http_method
  status_code = "200"

  response_parameters = local.cors_response_parameters

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "auth_register_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.auth_register.id
  http_method = aws_api_gateway_method.auth_register_options.http_method
  status_code = aws_api_gateway_method_response.auth_register_options.status_code

  response_parameters = local.cors_integration_response_parameters
}

# /auth/login
resource "aws_api_gateway_method" "auth_login_options" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.auth_login.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_login_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.auth_login.id
  http_method = aws_api_gateway_method.auth_login_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "auth_login_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.auth_login.id
  http_method = aws_api_gateway_method.auth_login_options.http_method
  status_code = "200"

  response_parameters = local.cors_response_parameters

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "auth_login_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.auth_login.id
  http_method = aws_api_gateway_method.auth_login_options.http_method
  status_code = aws_api_gateway_method_response.auth_login_options.status_code

  response_parameters = local.cors_integration_response_parameters
}

# /stores
resource "aws_api_gateway_method" "stores_options" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.stores.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "stores_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.stores.id
  http_method = aws_api_gateway_method.stores_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "stores_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.stores.id
  http_method = aws_api_gateway_method.stores_options.http_method
  status_code = "200"

  response_parameters = local.cors_response_parameters

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "stores_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.stores.id
  http_method = aws_api_gateway_method.stores_options.http_method
  status_code = aws_api_gateway_method_response.stores_options.status_code

  response_parameters = local.cors_integration_response_parameters
}

# /stores/{storeId}
resource "aws_api_gateway_method" "stores_id_options" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.stores_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "stores_id_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.stores_id.id
  http_method = aws_api_gateway_method.stores_id_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "stores_id_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.stores_id.id
  http_method = aws_api_gateway_method.stores_id_options.http_method
  status_code = "200"

  response_parameters = local.cors_response_parameters

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "stores_id_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.stores_id.id
  http_method = aws_api_gateway_method.stores_id_options.http_method
  status_code = aws_api_gateway_method_response.stores_id_options.status_code

  response_parameters = local.cors_integration_response_parameters
}

# /products
resource "aws_api_gateway_method" "products_options" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.products.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "products_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.products.id
  http_method = aws_api_gateway_method.products_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "products_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.products.id
  http_method = aws_api_gateway_method.products_options.http_method
  status_code = "200"

  response_parameters = local.cors_response_parameters

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "products_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.products.id
  http_method = aws_api_gateway_method.products_options.http_method
  status_code = aws_api_gateway_method_response.products_options.status_code

  response_parameters = local.cors_integration_response_parameters
}

# /products/{productId}
resource "aws_api_gateway_method" "products_id_options" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.products_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "products_id_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.products_id.id
  http_method = aws_api_gateway_method.products_id_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "products_id_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.products_id.id
  http_method = aws_api_gateway_method.products_id_options.http_method
  status_code = "200"

  response_parameters = local.cors_response_parameters

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "products_id_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.products_id.id
  http_method = aws_api_gateway_method.products_id_options.http_method
  status_code = aws_api_gateway_method_response.products_id_options.status_code

  response_parameters = local.cors_integration_response_parameters
}

# /cart
resource "aws_api_gateway_method" "cart_options" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.cart.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "cart_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.cart.id
  http_method = aws_api_gateway_method.cart_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "cart_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.cart.id
  http_method = aws_api_gateway_method.cart_options.http_method
  status_code = "200"

  response_parameters = local.cors_response_parameters

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "cart_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.cart.id
  http_method = aws_api_gateway_method.cart_options.http_method
  status_code = aws_api_gateway_method_response.cart_options.status_code

  response_parameters = local.cors_integration_response_parameters
}

# /cart/items
resource "aws_api_gateway_method" "cart_items_options" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.cart_items.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "cart_items_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.cart_items.id
  http_method = aws_api_gateway_method.cart_items_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "cart_items_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.cart_items.id
  http_method = aws_api_gateway_method.cart_items_options.http_method
  status_code = "200"

  response_parameters = local.cors_response_parameters

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "cart_items_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.cart_items.id
  http_method = aws_api_gateway_method.cart_items_options.http_method
  status_code = aws_api_gateway_method_response.cart_items_options.status_code

  response_parameters = local.cors_integration_response_parameters
}

# /cart/items/{productId}
resource "aws_api_gateway_method" "cart_items_id_options" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.cart_items_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "cart_items_id_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.cart_items_id.id
  http_method = aws_api_gateway_method.cart_items_id_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "cart_items_id_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.cart_items_id.id
  http_method = aws_api_gateway_method.cart_items_id_options.http_method
  status_code = "200"

  response_parameters = local.cors_response_parameters

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "cart_items_id_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.cart_items_id.id
  http_method = aws_api_gateway_method.cart_items_id_options.http_method
  status_code = aws_api_gateway_method_response.cart_items_id_options.status_code

  response_parameters = local.cors_integration_response_parameters
}

# /orders
resource "aws_api_gateway_method" "orders_options" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.orders.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "orders_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.orders.id
  http_method = aws_api_gateway_method.orders_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "orders_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.orders.id
  http_method = aws_api_gateway_method.orders_options.http_method
  status_code = "200"

  response_parameters = local.cors_response_parameters

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "orders_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.orders.id
  http_method = aws_api_gateway_method.orders_options.http_method
  status_code = aws_api_gateway_method_response.orders_options.status_code

  response_parameters = local.cors_integration_response_parameters
}

# /orders/{orderId}
resource "aws_api_gateway_method" "orders_id_options" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.orders_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "orders_id_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.orders_id.id
  http_method = aws_api_gateway_method.orders_id_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "orders_id_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.orders_id.id
  http_method = aws_api_gateway_method.orders_id_options.http_method
  status_code = "200"

  response_parameters = local.cors_response_parameters

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "orders_id_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.orders_id.id
  http_method = aws_api_gateway_method.orders_id_options.http_method
  status_code = aws_api_gateway_method_response.orders_id_options.status_code

  response_parameters = local.cors_integration_response_parameters
}

# /orders/{orderId}/status
resource "aws_api_gateway_method" "orders_id_status_options" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.orders_id_status.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "orders_id_status_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.orders_id_status.id
  http_method = aws_api_gateway_method.orders_id_status_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "orders_id_status_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.orders_id_status.id
  http_method = aws_api_gateway_method.orders_id_status_options.http_method
  status_code = "200"

  response_parameters = local.cors_response_parameters

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "orders_id_status_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.orders_id_status.id
  http_method = aws_api_gateway_method.orders_id_status_options.http_method
  status_code = aws_api_gateway_method_response.orders_id_status_options.status_code

  response_parameters = local.cors_integration_response_parameters
}

# /orders/{orderId}/cancel
resource "aws_api_gateway_method" "orders_id_cancel_options" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.orders_id_cancel.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "orders_id_cancel_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.orders_id_cancel.id
  http_method = aws_api_gateway_method.orders_id_cancel_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "orders_id_cancel_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.orders_id_cancel.id
  http_method = aws_api_gateway_method.orders_id_cancel_options.http_method
  status_code = "200"

  response_parameters = local.cors_response_parameters

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "orders_id_cancel_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.orders_id_cancel.id
  http_method = aws_api_gateway_method.orders_id_cancel_options.http_method
  status_code = aws_api_gateway_method_response.orders_id_cancel_options.status_code

  response_parameters = local.cors_integration_response_parameters
}

# /reports/dashboard
resource "aws_api_gateway_method" "reports_dashboard_options" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.reports_dashboard.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "reports_dashboard_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.reports_dashboard.id
  http_method = aws_api_gateway_method.reports_dashboard_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "reports_dashboard_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.reports_dashboard.id
  http_method = aws_api_gateway_method.reports_dashboard_options.http_method
  status_code = "200"

  response_parameters = local.cors_response_parameters

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "reports_dashboard_options" {
  rest_api_id = module.api_gateway.api_id
  resource_id = aws_api_gateway_resource.reports_dashboard.id
  http_method = aws_api_gateway_method.reports_dashboard_options.http_method
  status_code = aws_api_gateway_method_response.reports_dashboard_options.status_code

  response_parameters = local.cors_integration_response_parameters
}
