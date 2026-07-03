output "bucket_name" {
  description = "The name of the S3 bucket"
  value       = aws_s3_bucket.frontend.id
}

output "bucket_arn" {
  description = "The ARN of the S3 bucket"
  value       = aws_s3_bucket.frontend.arn
}

output "website_endpoint" {
  description = "The website endpoint of the S3 bucket"
  value       = aws_s3_bucket_website_configuration.frontend.website_endpoint
}
