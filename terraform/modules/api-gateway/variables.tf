variable "api_name" {
  description = "The name of the REST API"
  type        = string
}

variable "stage_name" {
  description = "The name of the API Gateway stage"
  type        = string
  default     = "dev"
}

variable "tags" {
  description = "Tags to apply to the API Gateway resources"
  type        = map(string)
  default     = {}
}
