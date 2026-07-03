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
}

module "eventbridge" {
  source   = "./modules/eventbridge"
  bus_name = local.event_bus_name
  # Se añade un ARN temporal ya que el módulo lo requiere (hasta que se cree la Lambda real)
  events_lambda_arn = "arn:aws:lambda:${var.aws_region}:123456789012:function:${local.prefix}-events-lambda"
  tags              = local.common_tags
}

module "ses" {
  source       = "./modules/ses"
  sender_email = var.sender_email
  tags         = local.common_tags
}

module "cloudwatch" {
  source           = "./modules/cloudwatch"
  project_name     = var.project_name
  api_gateway_name = "${local.prefix}-api"
  lambda_names     = ["auth", "catalog", "orders", "reports", "events"]
  tags             = local.common_tags

  depends_on = [
    module.api_gateway
  ]
}
