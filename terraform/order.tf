locals {
  order_lambda_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DynamoDBCarts"
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query"
        ]
        Resource = module.dynamodb_carts.table_arn
      },
      {
        Sid    = "DynamoDBOrders"
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = module.dynamodb_orders.table_arn
      },
      {
      
        Sid    = "InvokeCatalog"
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = module.catalog_lambda.function_arn
      },
      {
        Sid    = "EventBridge"
        Effect = "Allow"
        Action = [
          "events:PutEvents"
        ]
        Resource = module.eventbridge.bus_arn
      },
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:*"
      }
    ]
  })
}

# ---------------------------------------------------------------------------
# IAM + Lambda
# ---------------------------------------------------------------------------

module "order_iam" {
  source      = "./modules/iam"
  role_name   = "${local.prefix}-order-role"
  policy_name = "${local.prefix}-order-policy"
  policy_json = local.order_lambda_policy
}

module "order_lambda" {
  source        = "./modules/lambda"
  function_name = "${local.prefix}-orders-lambda"
  source_dir    = "${path.module}/../lambdas/order"
  role_arn      = module.order_iam.role_arn
  tags          = local.common_tags

  environment = {
    CART_TABLE            = module.dynamodb_carts.table_name
    ORDERS_TABLE           = module.dynamodb_orders.table_name
    CATALOG_FUNCTION_NAME  = module.catalog_lambda.function_name
    EVENT_BUS_NAME         = module.eventbridge.bus_name
  }
}

resource "aws_lambda_permission" "order_lambda_apigw" {
  statement_id  = "AllowAPIGatewayInvokeOrder"
  action        = "lambda:InvokeFunction"
  function_name = module.order_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${module.api_gateway.execution_arn}/*/*"
}

# ---------------------------------------------------------------------------
# /cart
# ---------------------------------------------------------------------------

resource "aws_api_gateway_resource" "cart" {
  rest_api_id = module.api_gateway.api_id
  parent_id   = module.api_gateway.root_resource_id
  path_part   = "cart"
}

resource "aws_api_gateway_method" "cart_get" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.cart.id
  http_method   = "GET"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.jwt.id
}

resource "aws_api_gateway_integration" "cart_get" {
  rest_api_id             = module.api_gateway.api_id
  resource_id             = aws_api_gateway_resource.cart.id
  http_method             = aws_api_gateway_method.cart_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.order_lambda.invoke_arn
}

resource "aws_api_gateway_method" "cart_delete" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.cart.id
  http_method   = "DELETE"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.jwt.id
}

resource "aws_api_gateway_integration" "cart_delete" {
  rest_api_id             = module.api_gateway.api_id
  resource_id             = aws_api_gateway_resource.cart.id
  http_method             = aws_api_gateway_method.cart_delete.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.order_lambda.invoke_arn
}

resource "aws_api_gateway_resource" "cart_items" {
  rest_api_id = module.api_gateway.api_id
  parent_id   = aws_api_gateway_resource.cart.id
  path_part   = "items"
}

resource "aws_api_gateway_method" "cart_items_post" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.cart_items.id
  http_method   = "POST"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.jwt.id
}

resource "aws_api_gateway_integration" "cart_items_post" {
  rest_api_id             = module.api_gateway.api_id
  resource_id             = aws_api_gateway_resource.cart_items.id
  http_method             = aws_api_gateway_method.cart_items_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.order_lambda.invoke_arn
}

resource "aws_api_gateway_resource" "cart_items_id" {
  rest_api_id = module.api_gateway.api_id
  parent_id   = aws_api_gateway_resource.cart_items.id
  path_part   = "{productId}"
}

resource "aws_api_gateway_method" "cart_items_id_put" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.cart_items_id.id
  http_method   = "PUT"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.jwt.id
}

resource "aws_api_gateway_integration" "cart_items_id_put" {
  rest_api_id             = module.api_gateway.api_id
  resource_id             = aws_api_gateway_resource.cart_items_id.id
  http_method             = aws_api_gateway_method.cart_items_id_put.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.order_lambda.invoke_arn
}

resource "aws_api_gateway_method" "cart_items_id_delete" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.cart_items_id.id
  http_method   = "DELETE"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.jwt.id
}

resource "aws_api_gateway_integration" "cart_items_id_delete" {
  rest_api_id             = module.api_gateway.api_id
  resource_id             = aws_api_gateway_resource.cart_items_id.id
  http_method             = aws_api_gateway_method.cart_items_id_delete.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.order_lambda.invoke_arn
}

# ---------------------------------------------------------------------------
# /orders
# ---------------------------------------------------------------------------

resource "aws_api_gateway_resource" "orders" {
  rest_api_id = module.api_gateway.api_id
  parent_id   = module.api_gateway.root_resource_id
  path_part   = "orders"
}

resource "aws_api_gateway_resource" "orders_id" {
  rest_api_id = module.api_gateway.api_id
  parent_id   = aws_api_gateway_resource.orders.id
  path_part   = "{orderId}"
}

resource "aws_api_gateway_method" "orders_post" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.orders.id
  http_method   = "POST"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.jwt.id
}

resource "aws_api_gateway_integration" "orders_post" {
  rest_api_id             = module.api_gateway.api_id
  resource_id             = aws_api_gateway_resource.orders.id
  http_method             = aws_api_gateway_method.orders_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.order_lambda.invoke_arn
}

resource "aws_api_gateway_method" "orders_get" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.orders.id
  http_method   = "GET"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.jwt.id

  request_parameters = {
    "method.request.querystring.estado" = false
    "method.request.querystring.userId" = false
  }
}

resource "aws_api_gateway_integration" "orders_get" {
  rest_api_id             = module.api_gateway.api_id
  resource_id             = aws_api_gateway_resource.orders.id
  http_method             = aws_api_gateway_method.orders_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.order_lambda.invoke_arn
}

resource "aws_api_gateway_method" "orders_id_get" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.orders_id.id
  http_method   = "GET"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.jwt.id
}

resource "aws_api_gateway_integration" "orders_id_get" {
  rest_api_id             = module.api_gateway.api_id
  resource_id             = aws_api_gateway_resource.orders_id.id
  http_method             = aws_api_gateway_method.orders_id_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.order_lambda.invoke_arn
}

resource "aws_api_gateway_resource" "orders_id_status" {
  rest_api_id = module.api_gateway.api_id
  parent_id   = aws_api_gateway_resource.orders_id.id
  path_part   = "status"
}

resource "aws_api_gateway_method" "orders_id_status_put" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.orders_id_status.id
  http_method   = "PUT"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.jwt.id
}

resource "aws_api_gateway_integration" "orders_id_status_put" {
  rest_api_id             = module.api_gateway.api_id
  resource_id             = aws_api_gateway_resource.orders_id_status.id
  http_method             = aws_api_gateway_method.orders_id_status_put.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.order_lambda.invoke_arn
}

resource "aws_api_gateway_resource" "orders_id_cancel" {
  rest_api_id = module.api_gateway.api_id
  parent_id   = aws_api_gateway_resource.orders_id.id
  path_part   = "cancel"
}

resource "aws_api_gateway_method" "orders_id_cancel_post" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.orders_id_cancel.id
  http_method   = "POST"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.jwt.id
}

resource "aws_api_gateway_integration" "orders_id_cancel_post" {
  rest_api_id             = module.api_gateway.api_id
  resource_id             = aws_api_gateway_resource.orders_id_cancel.id
  http_method             = aws_api_gateway_method.orders_id_cancel_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.order_lambda.invoke_arn
}
