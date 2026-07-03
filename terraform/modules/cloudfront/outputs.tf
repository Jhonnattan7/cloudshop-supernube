output "distribution_id" {
  description = "The ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.frontend.id
}

output "distribution_domain_name" {
  description = "The domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "distribution_arn" {
  description = "The ARN of the CloudFront distribution"
  value       = aws_cloudfront_distribution.frontend.arn
}
