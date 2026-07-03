provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "cloudshop-enterprise"
      Environment = var.environment
      Team        = "g01"
      ManagedBy   = "terraform"
    }
  }
}
