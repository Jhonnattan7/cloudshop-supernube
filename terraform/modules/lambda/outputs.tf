output "function_name" {
  description = "Name of the lambda function"
  value       = aws_lambda_function.this.function_name
}

output "function_arn" {
  description = "ARN of the lambda function"
  value       = aws_lambda_function.this.arn
}

output "invoke_arn" {
  description = "Invoke ARN, used when wiring API Gateway integrations"
  value       = aws_lambda_function.this.invoke_arn
}
