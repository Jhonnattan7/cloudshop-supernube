locals {
  events_lambda_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DynamoDBInventory"
        Effect = "Allow"
        Action = [
          "dynamodb:UpdateItem",
          "dynamodb:GetItem"
        ]
        Resource = module.dynamodb_products.table_arn
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
        Sid    = "SES"
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]

        Resource = "*"
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

module "events_iam" {
  source      = "./modules/iam"
  role_name   = "${local.prefix}-events-role"
  policy_name = "${local.prefix}-events-policy"
  policy_json = local.events_lambda_policy
}

module "events_lambda" {
  source        = "./modules/lambda"
  function_name = "${local.prefix}-events-lambda"
  source_dir    = "${path.module}/../lambdas/events"
  role_arn      = module.events_iam.role_arn
  tags          = local.common_tags

  environment = {
    PRODUCTS_TABLE = module.dynamodb_products.table_name
    AUDIT_TABLE    = module.dynamodb_audit.table_name
    SENDER_EMAIL   = var.sender_email
    EVENT_BUS_NAME = module.eventbridge.bus_name
  }
}

resource "aws_lambda_permission" "events_lambda_order_created" {
  statement_id  = "AllowEventBridgeInvokeOrderCreated"
  action        = "lambda:InvokeFunction"
  function_name = module.events_lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = module.eventbridge.rule_order_created_arn
}

resource "aws_lambda_permission" "events_lambda_order_cancelled" {
  statement_id  = "AllowEventBridgeInvokeOrderCancelled"
  action        = "lambda:InvokeFunction"
  function_name = module.events_lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = module.eventbridge.rule_order_cancelled_arn
}

resource "aws_lambda_permission" "events_lambda_product_deleted" {
  statement_id  = "AllowEventBridgeInvokeProductDeleted"
  action        = "lambda:InvokeFunction"
  function_name = module.events_lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = module.eventbridge.rule_product_deleted_arn
}

resource "aws_lambda_permission" "events_lambda_user_created" {
  statement_id  = "AllowEventBridgeInvokeUserCreated"
  action        = "lambda:InvokeFunction"
  function_name = module.events_lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = module.eventbridge.rule_user_created_arn
}
