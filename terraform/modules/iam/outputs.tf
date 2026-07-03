output "role_arn" {
  description = "The ARN of the IAM role"
  value       = aws_iam_role.lambda_exec.arn
}

output "role_name" {
  description = "The name of the IAM role"
  value       = aws_iam_role.lambda_exec.name
}

output "policy_arn" {
  description = "The ARN of the IAM policy"
  value       = aws_iam_policy.custom_policy.arn
}
