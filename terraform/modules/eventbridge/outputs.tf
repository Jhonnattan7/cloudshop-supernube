output "bus_name" {
  description = "The name of the EventBridge bus"
  value       = aws_cloudwatch_event_bus.this.name
}

output "bus_arn" {
  description = "The ARN of the EventBridge bus"
  value       = aws_cloudwatch_event_bus.this.arn
}

output "rule_order_created_arn" {
  description = "The ARN of the ORDER_CREATED rule"
  value       = aws_cloudwatch_event_rule.order_created.arn
}

output "rule_order_cancelled_arn" {
  description = "The ARN of the ORDER_CANCELLED rule"
  value       = aws_cloudwatch_event_rule.order_cancelled.arn
}

output "rule_product_deleted_arn" {
  description = "The ARN of the PRODUCT_DELETED rule"
  value       = aws_cloudwatch_event_rule.product_deleted.arn
}

output "rule_user_created_arn" {
  description = "The ARN of the USER_CREATED rule"
  value       = aws_cloudwatch_event_rule.user_created.arn
}
