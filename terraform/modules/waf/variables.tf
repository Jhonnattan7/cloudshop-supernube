variable "waf_name" {
  description = "The name of the WAF web ACL"
  type        = string
}

variable "tags" {
  description = "Tags to apply to the WAF web ACL"
  type        = map(string)
  default     = {}
}
