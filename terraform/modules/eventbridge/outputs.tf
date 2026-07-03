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
