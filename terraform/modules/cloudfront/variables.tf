variable "s3_website_endpoint" {
  description = "The website endpoint of the S3 bucket"
  type        = string
}

variable "s3_bucket_name" {
  description = "The name of the S3 bucket"
  type        = string
}

variable "waf_arn" {
  description = "The ARN of the WAF to associate with the CloudFront distribution"
  type        = string
  default     = null
}

variable "tags" {
  description = "Tags to apply to the CloudFront distribution"
  type        = map(string)
  default     = {}
}
