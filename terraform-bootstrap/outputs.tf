output "state_bucket_name" {
  description = "The name of the S3 bucket for Terraform remote state"
  value       = aws_s3_bucket.state_bucket.id
}

output "lock_table_name" {
  description = "The name of the DynamoDB table for Terraform state locking"
  value       = aws_dynamodb_table.lock_table.name
}
