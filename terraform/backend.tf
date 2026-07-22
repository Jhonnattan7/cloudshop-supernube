terraform {
  backend "s3" {
    bucket         = "cloudshop-supernube-terraform-state"
    key            = "terraform/cloudshop.tfstate"
    region         = "us-east-1"
    dynamodb_table = "cloudshop-supernube-terraform-lock"
    encrypt        = true
  }
}

