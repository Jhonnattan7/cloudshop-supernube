locals {
  auth_lambda_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DynamoDBUsers"
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Scan"
        ]
        Resource = module.dynamodb_users.table_arn
      },
      {
        Sid    = "DynamoDBAudit"
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem"
        ]
        Resource = module.dynamodb_audit.table_arn
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

  shared_authorizer_lambda_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
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

module "auth_iam" {
  source      = "./modules/iam"
  role_name   = "${local.prefix}-auth-role"
  policy_name = "${local.prefix}-auth-policy"
  policy_json = local.auth_lambda_policy
}

module "shared_authorizer_iam" {
  source      = "./modules/iam"
  role_name   = "${local.prefix}-shared-authorizer-role"
  policy_name = "${local.prefix}-shared-authorizer-policy"
  policy_json = local.shared_authorizer_lambda_policy
}

module "auth_lambda" {
  source        = "./modules/lambda"
  function_name = "${local.prefix}-auth-lambda"
  source_dir    = "${path.module}/../lambdas/auth"
  role_arn      = module.auth_iam.role_arn
  tags          = local.common_tags

  environment = {
    USERS_TABLE = module.dynamodb_users.table_name
    AUDIT_TABLE = module.dynamodb_audit.table_name
    JWT_SECRET  = var.jwt_secret
  }
}

module "shared_authorizer_lambda" {
  source        = "./modules/lambda"
  function_name = "${local.prefix}-shared-authorizer-lambda"
  source_dir    = "${path.module}/../lambdas/shared"
  role_arn      = module.shared_authorizer_iam.role_arn
  tags          = local.common_tags

  environment = {
    JWT_SECRET = var.jwt_secret
  }
}

resource "aws_dynamodb_table_item" "admin_seed" {
  table_name = module.dynamodb_users.table_name
  hash_key   = "userId"

  # fecha fija porque timestamp() cambia en cada plan y generaria un diff perpetuo
  item = jsonencode({
    userId    = { S = "usr_admin_seed" }
    email     = { S = var.admin_email }
    password  = { S = bcrypt(var.admin_password) }
    nombre    = { S = "Admin" }
    rol       = { S = "ADMIN" }
    activo    = { BOOL = true }
    createdAt = { S = "2026-01-01T00:00:00Z" }
    updatedAt = { S = "2026-01-01T00:00:00Z" }
  })

  lifecycle {
    ignore_changes = [item]
  }
}

resource "aws_api_gateway_resource" "auth" {
  rest_api_id = module.api_gateway.api_id
  parent_id   = module.api_gateway.root_resource_id
  path_part   = "auth"
}

resource "aws_api_gateway_resource" "auth_register" {
  rest_api_id = module.api_gateway.api_id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "register"
}

resource "aws_api_gateway_resource" "auth_login" {
  rest_api_id = module.api_gateway.api_id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "login"
}

resource "aws_api_gateway_method" "auth_register_post" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.auth_register.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_register_post" {
  rest_api_id             = module.api_gateway.api_id
  resource_id             = aws_api_gateway_resource.auth_register.id
  http_method             = aws_api_gateway_method.auth_register_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.auth_lambda.invoke_arn
}

resource "aws_api_gateway_method" "auth_login_post" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.auth_login.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_login_post" {
  rest_api_id             = module.api_gateway.api_id
  resource_id             = aws_api_gateway_resource.auth_login.id
  http_method             = aws_api_gateway_method.auth_login_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.auth_lambda.invoke_arn
}

resource "aws_lambda_permission" "auth_lambda_apigw" {
  statement_id  = "AllowAPIGatewayInvokeAuth"
  action        = "lambda:InvokeFunction"
  function_name = module.auth_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${module.api_gateway.execution_arn}/*/*"
}

resource "aws_api_gateway_authorizer" "jwt" {
  name                             = "${local.prefix}-jwt-authorizer"
  rest_api_id                      = module.api_gateway.api_id
  type                             = "TOKEN"
  authorizer_uri                   = module.shared_authorizer_lambda.invoke_arn
  identity_source                  = "method.request.header.Authorization"
  authorizer_result_ttl_in_seconds = 0
}

resource "aws_lambda_permission" "authorizer_apigw" {
  statement_id  = "AllowAPIGatewayInvokeAuthorizer"
  action        = "lambda:InvokeFunction"
  function_name = module.shared_authorizer_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${module.api_gateway.execution_arn}/authorizers/${aws_api_gateway_authorizer.jwt.id}"
}

# /usuarios
resource "aws_api_gateway_resource" "usuarios" {
  rest_api_id = module.api_gateway.api_id
  parent_id   = module.api_gateway.root_resource_id
  path_part   = "usuarios"
}

resource "aws_api_gateway_resource" "usuarios_id" {
  rest_api_id = module.api_gateway.api_id
  parent_id   = aws_api_gateway_resource.usuarios.id
  path_part   = "{id}"
}

resource "aws_api_gateway_method" "usuarios_get" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.usuarios.id
  http_method   = "GET"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.jwt.id
}

resource "aws_api_gateway_integration" "usuarios_get" {
  rest_api_id             = module.api_gateway.api_id
  resource_id             = aws_api_gateway_resource.usuarios.id
  http_method             = aws_api_gateway_method.usuarios_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.auth_lambda.invoke_arn
}

resource "aws_api_gateway_method" "usuarios_id_put" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.usuarios_id.id
  http_method   = "PUT"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.jwt.id
}

resource "aws_api_gateway_integration" "usuarios_id_put" {
  rest_api_id             = module.api_gateway.api_id
  resource_id             = aws_api_gateway_resource.usuarios_id.id
  http_method             = aws_api_gateway_method.usuarios_id_put.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.auth_lambda.invoke_arn
}

resource "aws_api_gateway_method" "usuarios_id_delete" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.usuarios_id.id
  http_method   = "DELETE"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.jwt.id
}

resource "aws_api_gateway_integration" "usuarios_id_delete" {
  rest_api_id             = module.api_gateway.api_id
  resource_id             = aws_api_gateway_resource.usuarios_id.id
  http_method             = aws_api_gateway_method.usuarios_id_delete.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.auth_lambda.invoke_arn
}
