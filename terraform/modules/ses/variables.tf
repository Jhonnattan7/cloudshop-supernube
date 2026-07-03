variable "sender_email" {
  description = "The email address to verify in SES"
  type        = string
}

variable "tags" {
  description = "Tags to apply to the SES identity"
  type        = map(string)
  default     = {}
}
