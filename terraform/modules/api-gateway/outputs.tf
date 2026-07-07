output "api_id" {
  description = "The ID of the REST API"
  value       = aws_api_gateway_rest_api.api.id
}

output "api_endpoint" {
  description = "The URL to invoke the API"
  value       = aws_api_gateway_stage.stage.invoke_url
}

output "execution_arn" {
  description = "The Execution ARN of the REST API"
  value       = aws_api_gateway_rest_api.api.execution_arn
}

output "stage_name" {
  description = "The name of the API Gateway stage"
  value       = aws_api_gateway_stage.stage.stage_name
}

output "root_resource_id" {
  description = "ID of the REST API's root resource, used by services to attach their own resource trees"
  value       = aws_api_gateway_rest_api.api.root_resource_id
}
