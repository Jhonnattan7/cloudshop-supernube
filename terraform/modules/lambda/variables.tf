variable "function_name" {
  description = "Name of the Lambda function"
  type        = string
}

variable "source_dir" {
  description = "Path to the directory with the lambda source code (gets zipped as-is)"
  type        = string
}

variable "handler" {
  description = "Lambda handler entry point"
  type        = string
  default     = "index.handler"
}

variable "runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "nodejs20.x"
}

variable "role_arn" {
  description = "ARN of the IAM execution role for this function"
  type        = string
}

variable "environment" {
  description = "Environment variables for the lambda"
  type        = map(string)
  default     = {}
}

variable "timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 10
}

variable "memory_size" {
  description = "Lambda memory size in MB"
  type        = number
  default     = 128
}

variable "tags" {
  description = "Tags to apply to the lambda function"
  type        = map(string)
  default     = {}
}
