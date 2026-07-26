module "s3" {
  source      = "./modules/s3"
  bucket_name = local.frontend_bucket
  tags        = local.common_tags
}

module "waf" {
  source   = "./modules/waf"
  waf_name = "${local.prefix}-waf"
  tags     = local.common_tags
}

module "cloudfront" {
  source              = "./modules/cloudfront"
  s3_website_endpoint = module.s3.website_endpoint
  s3_bucket_name      = module.s3.bucket_name
  waf_arn             = module.waf.waf_arn
  tags                = local.common_tags
}

module "dynamodb_users" {
  source        = "./modules/dynamodb"
  table_name    = "${local.prefix}-users"
  partition_key = "userId"
  attributes    = [{ name = "userId", type = "S" }]
  tags          = local.common_tags
}

module "dynamodb_products" {
  source        = "./modules/dynamodb"
  table_name    = "${local.prefix}-products"
  partition_key = "productId"
  attributes    = [{ name = "productId", type = "S" }]
  tags          = local.common_tags
}

module "dynamodb_stores" {
  source        = "./modules/dynamodb"
  table_name    = "${local.prefix}-stores"
  partition_key = "storeId"
  attributes    = [{ name = "storeId", type = "S" }]
  tags          = local.common_tags
}

module "dynamodb_orders" {
  source        = "./modules/dynamodb"
  table_name    = "${local.prefix}-orders"
  partition_key = "orderId"
  sort_key      = "userId"
  attributes = [
    { name = "orderId", type = "S" },
    { name = "userId", type = "S" }
  ]
  tags = local.common_tags
}

module "dynamodb_carts" {
  source        = "./modules/dynamodb"
  table_name    = "${local.prefix}-carts"
  partition_key = "userId"
  sort_key      = "productId"
  attributes = [
    { name = "userId", type = "S" },
    { name = "productId", type = "S" }
  ]
  tags = local.common_tags
}

module "dynamodb_audit" {
  source        = "./modules/dynamodb"
  table_name    = "${local.prefix}-audit"
  partition_key = "auditId"
  sort_key      = "timestamp"
  attributes = [
    { name = "auditId", type = "S" },
    { name = "timestamp", type = "S" }
  ]
  tags = local.common_tags
}

module "api_gateway" {
  source     = "./modules/api-gateway"
  api_name   = "${local.prefix}-api"
  stage_name = var.environment
  tags       = local.common_tags

  redeploy_trigger = sha1(jsonencode([
    aws_api_gateway_method.auth_register_post.id,
    aws_api_gateway_integration.auth_register_post.id,
    aws_api_gateway_method.auth_login_post.id,
    aws_api_gateway_integration.auth_login_post.id,
    aws_api_gateway_authorizer.jwt.id,
    aws_api_gateway_method.reports_dashboard_get.id,
    aws_api_gateway_integration.reports_dashboard_get.id,
    aws_api_gateway_method.stores_post.id,
    aws_api_gateway_integration.stores_post.id,
    aws_api_gateway_method.stores_get.id,
    aws_api_gateway_integration.stores_get.id,
    aws_api_gateway_method.stores_id_get.id,
    aws_api_gateway_integration.stores_id_get.id,
    aws_api_gateway_method.stores_id_put.id,
    aws_api_gateway_integration.stores_id_put.id,
    aws_api_gateway_method.stores_id_delete.id,
    aws_api_gateway_integration.stores_id_delete.id,
    aws_api_gateway_method.products_post.id,
    aws_api_gateway_integration.products_post.id,
    aws_api_gateway_method.products_get.id,
    aws_api_gateway_integration.products_get.id,
    aws_api_gateway_method.products_id_get.id,
    aws_api_gateway_integration.products_id_get.id,
    aws_api_gateway_method.products_id_put.id,
    aws_api_gateway_integration.products_id_put.id,
    aws_api_gateway_method.products_id_delete.id,
    aws_api_gateway_integration.products_id_delete.id,
    aws_api_gateway_method.cart_get.id,
    aws_api_gateway_integration.cart_get.id,
    aws_api_gateway_method.cart_delete.id,
    aws_api_gateway_integration.cart_delete.id,
    aws_api_gateway_method.cart_items_post.id,
    aws_api_gateway_integration.cart_items_post.id,
    aws_api_gateway_method.cart_items_id_put.id,
    aws_api_gateway_integration.cart_items_id_put.id,
    aws_api_gateway_method.cart_items_id_delete.id,
    aws_api_gateway_integration.cart_items_id_delete.id,
    aws_api_gateway_method.orders_post.id,
    aws_api_gateway_integration.orders_post.id,
    aws_api_gateway_method.orders_get.id,
    aws_api_gateway_integration.orders_get.id,
    aws_api_gateway_method.orders_id_get.id,
    aws_api_gateway_integration.orders_id_get.id,
    aws_api_gateway_method.orders_id_status_put.id,
    aws_api_gateway_integration.orders_id_status_put.id,
    aws_api_gateway_method.orders_id_cancel_post.id,
    aws_api_gateway_integration.orders_id_cancel_post.id,
    # --- CORS OPTIONS methods (cors.tf) ---
    aws_api_gateway_method.auth_register_options.id,
    aws_api_gateway_method.auth_login_options.id,
    aws_api_gateway_method.stores_options.id,
    aws_api_gateway_method.stores_id_options.id,
    aws_api_gateway_method.products_options.id,
    aws_api_gateway_method.products_id_options.id,
    aws_api_gateway_method.cart_options.id,
    aws_api_gateway_method.cart_items_options.id,
    aws_api_gateway_method.cart_items_id_options.id,
    aws_api_gateway_method.orders_options.id,
    aws_api_gateway_method.orders_id_options.id,
    aws_api_gateway_method.orders_id_status_options.id,
    aws_api_gateway_method.orders_id_cancel_options.id,
    aws_api_gateway_method.reports_dashboard_options.id,
    aws_api_gateway_gateway_response.cors_4xx.id,
    aws_api_gateway_gateway_response.cors_5xx.id,
    "v2.0-idempotency-key-cors-fix"
  ]))
}

module "eventbridge" {
  source            = "./modules/eventbridge"
  bus_name          = local.event_bus_name
  events_lambda_arn = module.events_lambda.function_arn
  tags              = local.common_tags
}

module "ses" {
  source       = "./modules/ses"
  sender_email = var.sender_email
  tags         = local.common_tags
}

module "cloudwatch" {
  source           = "./modules/cloudwatch"
  project_name     = local.prefix
  api_gateway_name = "${local.prefix}-api"
  lambda_names     = ["auth", "catalog", "orders", "reports", "events"]
  tags             = local.common_tags

  depends_on = [
    module.api_gateway
  ]
}
