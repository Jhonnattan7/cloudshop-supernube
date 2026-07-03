variable "bus_name" {
  description = "The name of the EventBridge custom bus"
  type        = string
}

variable "events_lambda_arn" {
  description = "The ARN of the Lambda function to process events"
  type        = string
}

variable "tags" {
  description = "Tags to apply to the EventBridge resources"
  type        = map(string)
  default     = {}
}
