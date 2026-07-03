output "dashboard_name" {
  description = "The name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "log_group_arns" {
  description = "A map of Lambda names to their Log Group ARNs"
  value       = { for k, v in aws_cloudwatch_log_group.lambda_logs : k => v.arn }
}
