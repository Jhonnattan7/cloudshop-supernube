variable "project_name" {
  description = "The name of the project"
  type        = string
}

variable "api_gateway_name" {
  description = "The name of the API Gateway"
  type        = string
}

variable "lambda_names" {
  description = "List of Lambda service names (e.g., auth, catalog, orders, reports, events)"
  type        = list(string)
}

variable "tags" {
  description = "Tags to apply to CloudWatch resources"
  type        = map(string)
  default     = {}
}
