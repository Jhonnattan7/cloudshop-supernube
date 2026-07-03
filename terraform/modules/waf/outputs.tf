output "waf_arn" {
  description = "The ARN of the WAF web ACL"
  value       = aws_wafv2_web_acl.main.arn
}

output "waf_id" {
  description = "The ID of the WAF web ACL"
  value       = aws_wafv2_web_acl.main.id
}
