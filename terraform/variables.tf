variable "aws_region" {
  description = "The AWS region to deploy resources in"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "The environment name (e.g., dev, stg, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "The name of the project"
  type        = string
  default     = "cloudshop-supernube"
}

variable "sender_email" {
  description = "The sender email address for SES"
  type        = string
  default     = "admin@cloudshop.local"
}

variable "jwt_secret" {
  description = "Secret used to sign and verify JWT tokens"
  type        = string
  sensitive   = true
}

variable "admin_email" {
  description = "Email for the seeded admin user"
  type        = string
  default     = "admin@cloudshop.local"
}

variable "admin_password" {
  description = "Password for the seeded admin user"
  type        = string
  sensitive   = true
}
