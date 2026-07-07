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

variable "redeploy_trigger" {
  description = "Value that changes whenever routes/integrations change, forces API Gateway to redeploy"
  type        = string
  default     = ""
}
