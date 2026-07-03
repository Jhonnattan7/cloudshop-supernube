output "api_gateway_url" {
  description = "The URL to invoke the API Gateway"
  value       = module.api_gateway.api_endpoint
}

output "cloudfront_url" {
  description = "The domain name of the CloudFront distribution"
  value       = module.cloudfront.distribution_domain_name
}

output "event_bus_name" {
  description = "The name of the EventBridge custom bus"
  value       = module.eventbridge.bus_name
}

output "frontend_bucket" {
  description = "The name of the S3 bucket for the frontend"
  value       = module.s3.bucket_name
}

output "table_users_arn" {
  description = "The ARN of the Users DynamoDB table"
  value       = module.dynamodb_users.table_arn
}

output "table_products_arn" {
  description = "The ARN of the Products DynamoDB table"
  value       = module.dynamodb_products.table_arn
}

output "table_stores_arn" {
  description = "The ARN of the Stores DynamoDB table"
  value       = module.dynamodb_stores.table_arn
}

output "table_orders_arn" {
  description = "The ARN of the Orders DynamoDB table"
  value       = module.dynamodb_orders.table_arn
}

output "table_carts_arn" {
  description = "The ARN of the Carts DynamoDB table"
  value       = module.dynamodb_carts.table_arn
}

output "table_audit_arn" {
  description = "The ARN of the Audit DynamoDB table"
  value       = module.dynamodb_audit.table_arn
}
