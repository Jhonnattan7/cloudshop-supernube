locals {
  reports_lambda_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DynamoDBReadAll"
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Scan",
          "dynamodb:Query"
        ]
        Resource = [
          module.dynamodb_users.table_arn,
          module.dynamodb_products.table_arn,
          module.dynamodb_stores.table_arn,
          module.dynamodb_orders.table_arn,
          module.dynamodb_carts.table_arn,
          module.dynamodb_audit.table_arn
        ]
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

module "reports_iam" {
  source      = "./modules/iam"
  role_name   = "${local.prefix}-reports-role"
  policy_name = "${local.prefix}-reports-policy"
  policy_json = local.reports_lambda_policy
}

module "reports_lambda" {
  source        = "./modules/lambda"
  function_name = "${local.prefix}-reports-lambda"
  source_dir    = "${path.module}/../lambdas/reports"
  role_arn      = module.reports_iam.role_arn
  tags          = local.common_tags

  environment = {
    USERS_TABLE    = module.dynamodb_users.table_name
    PRODUCTS_TABLE = module.dynamodb_products.table_name
    STORES_TABLE   = module.dynamodb_stores.table_name
    ORDERS_TABLE   = module.dynamodb_orders.table_name
    CARTS_TABLE    = module.dynamodb_carts.table_name
  }
}

resource "aws_api_gateway_resource" "reports" {
  rest_api_id = module.api_gateway.api_id
  parent_id   = module.api_gateway.root_resource_id
  path_part   = "reports"
}

resource "aws_api_gateway_resource" "reports_dashboard" {
  rest_api_id = module.api_gateway.api_id
  parent_id   = aws_api_gateway_resource.reports.id
  path_part   = "dashboard"
}

resource "aws_api_gateway_method" "reports_dashboard_get" {
  rest_api_id   = module.api_gateway.api_id
  resource_id   = aws_api_gateway_resource.reports_dashboard.id
  http_method   = "GET"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.jwt.id
}

resource "aws_api_gateway_integration" "reports_dashboard_get" {
  rest_api_id             = module.api_gateway.api_id
  resource_id             = aws_api_gateway_resource.reports_dashboard.id
  http_method             = aws_api_gateway_method.reports_dashboard_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.reports_lambda.invoke_arn
}

resource "aws_lambda_permission" "reports_lambda_apigw" {
  statement_id  = "AllowAPIGatewayInvokeReports"
  action        = "lambda:InvokeFunction"
  function_name = module.reports_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${module.api_gateway.execution_arn}/*/*"
}
