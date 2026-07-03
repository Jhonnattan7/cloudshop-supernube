output "ses_arn" {
  description = "The ARN of the SES email identity"
  value       = aws_ses_email_identity.sender.arn
}

output "sender_email" {
  description = "The verified sender email address"
  value       = aws_ses_email_identity.sender.email
}
