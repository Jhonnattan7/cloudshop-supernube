locals {
  catalog_lambda_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DynamoDBProducts"
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Scan"
        ]
        Resource = module.dynamodb_products.table_arn
      },
      {
        Sid    = "DynamoDBStores"
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Scan"
        ]
        Resource = module.dynamodb_stores.table_arn
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
      },
      {
        Sid    = "EventBridge"
        Effect = "Allow"
        Action = [
          "events:PutEvents"
        ]
        Resource = module.eventbridge.bus_arn
      }
    ]
  })
}

module "catalog_iam" {
  source      = "./modules/iam"
  role_name   = "${local.prefix}-catalog-role"
  policy_name = "${local.prefix}-catalog-policy"
  policy_json = local.catalog_lambda_policy
}

module "catalog_lambda" {
  source        = "./modules/lambda"
  function_name = "${local.prefix}-catalog-lambda"
  source_dir    = "${path.module}/../lambdas/catalog"
  role_arn      = module.catalog_iam.role_arn
  tags          = local.common_tags

  environment = {
    PRODUCTS_TABLE = module.dynamodb_products.table_name
    STORES_TABLE   = module.dynamodb_stores.table_name
    EVENT_BUS_NAME = module.eventbridge.bus_name
  }
}

resource "aws_lambda_permission" "catalog_lambda_apigw" {
  statement_id  = "AllowAPIGatewayInvokeCatalog"
  action        = "lambda:InvokeFunction"
  function_name = module.catalog_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${module.api_gateway.execution_arn}/*/*"
}

# ---------------------------------------------------------------------------
# /stores
# ---------------------------------------------------------------------------

resource "aws_api_gateway_resource" "stores" {
  rest_api_id = module.api_gateway.api_id
  parent_id   = module.api_gateway.root_resource_id
  path_part   = "stores"
}

resource "aws_api_gateway_resource" "stores_id" {
  rest_api_id = module.api_gateway.api_id
  parent_id   = aws_api_gateway_resource.stores.id
  path_part   = "{storeId}"
}

resource "aws_api_gateway_method" "stores_post" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.stores.id
  http_method   = "POST"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.jwt.id
}

resource "aws_api_gateway_integration" "stores_post" {
  rest_api_id             = module.api_gateway.api_id
  resource_id             = aws_api_gateway_resource.stores.id
  http_method             = aws_api_gateway_method.stores_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.catalog_lambda.invoke_arn
}

resource "aws_api_gateway_method" "stores_get" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.stores.id
  http_method   = "GET"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.jwt.id
}

resource "aws_api_gateway_integration" "stores_get" {
  rest_api_id             = module.api_gateway.api_id
  resource_id             = aws_api_gateway_resource.stores.id
  http_method             = aws_api_gateway_method.stores_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.catalog_lambda.invoke_arn
}

resource "aws_api_gateway_method" "stores_id_get" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.stores_id.id
  http_method   = "GET"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.jwt.id
}

resource "aws_api_gateway_integration" "stores_id_get" {
  rest_api_id             = module.api_gateway.api_id
  resource_id             = aws_api_gateway_resource.stores_id.id
  http_method             = aws_api_gateway_method.stores_id_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.catalog_lambda.invoke_arn
}

resource "aws_api_gateway_method" "stores_id_put" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.stores_id.id
  http_method   = "PUT"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.jwt.id
}

resource "aws_api_gateway_integration" "stores_id_put" {
  rest_api_id             = module.api_gateway.api_id
  resource_id             = aws_api_gateway_resource.stores_id.id
  http_method             = aws_api_gateway_method.stores_id_put.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.catalog_lambda.invoke_arn
}

resource "aws_api_gateway_method" "stores_id_delete" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.stores_id.id
  http_method   = "DELETE"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.jwt.id
}

resource "aws_api_gateway_integration" "stores_id_delete" {
  rest_api_id             = module.api_gateway.api_id
  resource_id             = aws_api_gateway_resource.stores_id.id
  http_method             = aws_api_gateway_method.stores_id_delete.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.catalog_lambda.invoke_arn
}

# ---------------------------------------------------------------------------
# /products
# ---------------------------------------------------------------------------

resource "aws_api_gateway_resource" "products" {
  rest_api_id = module.api_gateway.api_id
  parent_id   = module.api_gateway.root_resource_id
  path_part   = "products"
}

resource "aws_api_gateway_resource" "products_id" {
  rest_api_id = module.api_gateway.api_id
  parent_id   = aws_api_gateway_resource.products.id
  path_part   = "{productId}"
}

resource "aws_api_gateway_method" "products_post" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.products.id
  http_method   = "POST"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.jwt.id
}

resource "aws_api_gateway_integration" "products_post" {
  rest_api_id             = module.api_gateway.api_id
  resource_id             = aws_api_gateway_resource.products.id
  http_method             = aws_api_gateway_method.products_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.catalog_lambda.invoke_arn
}

resource "aws_api_gateway_method" "products_get" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.products.id
  http_method   = "GET"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.jwt.id

  request_parameters = {
    "method.request.querystring.categoria" = false
    "method.request.querystring.storeId"   = false
  }
}

resource "aws_api_gateway_integration" "products_get" {
  rest_api_id             = module.api_gateway.api_id
  resource_id             = aws_api_gateway_resource.products.id
  http_method             = aws_api_gateway_method.products_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.catalog_lambda.invoke_arn
}

resource "aws_api_gateway_method" "products_id_get" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.products_id.id
  http_method   = "GET"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.jwt.id
}

resource "aws_api_gateway_integration" "products_id_get" {
  rest_api_id             = module.api_gateway.api_id
  resource_id             = aws_api_gateway_resource.products_id.id
  http_method             = aws_api_gateway_method.products_id_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.catalog_lambda.invoke_arn
}

resource "aws_api_gateway_method" "products_id_put" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.products_id.id
  http_method   = "PUT"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.jwt.id
}

resource "aws_api_gateway_integration" "products_id_put" {
  rest_api_id             = module.api_gateway.api_id
  resource_id             = aws_api_gateway_resource.products_id.id
  http_method             = aws_api_gateway_method.products_id_put.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.catalog_lambda.invoke_arn
}

resource "aws_api_gateway_method" "products_id_delete" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.products_id.id
  http_method   = "DELETE"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.jwt.id
}

resource "aws_api_gateway_integration" "products_id_delete" {
  rest_api_id             = module.api_gateway.api_id
  resource_id             = aws_api_gateway_resource.products_id.id
  http_method             = aws_api_gateway_method.products_id_delete.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.catalog_lambda.invoke_arn
}
