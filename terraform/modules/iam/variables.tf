variable "role_name" {
  description = "The name of the IAM role"
  type        = string
}

variable "policy_name" {
  description = "The name of the IAM policy"
  type        = string
}

variable "policy_json" {
  description = "The JSON policy document for the IAM policy"
  type        = string
}
