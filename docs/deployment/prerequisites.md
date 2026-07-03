# Prerequisites

Everything needed before running terraform apply.

## 1. Tools

| Tool | Version | Install |
|---|---|---|
| Terraform | >= 1.6.0 | https://developer.hashicorp.com/terraform/install |
| AWS CLI | >= 2.0 | https://aws.amazon.com/cli/ |
| Node.js | >= 18.x | https://nodejs.org |
| Git | any | https://git-scm.com |

Verify installations:

```bash
terraform --version
aws --version
node --version
git --version
```

## 2. AWS credentials

Configure AWS CLI with the project credentials:

```text
aws configure
```

Required values:

```text
AWS Access Key ID:     (provided by P1)
AWS Secret Access Key: (provided by P1)
Default region:        us-east-1
Default output format: json
```

Verify access:

```text
aws sts get-caller-identity
```

## 3. Clone the repository

```text
git clone https://github.com/your-org/cloudshop-g01-cloud2026.git
cd cloudshop-g01-cloud2026
```

## 4. Bootstrap - first time only

Before running terraform init, the S3 bucket and DynamoDB table for remote state must exist.

P1 runs this once:

```text
aws s3api create-bucket \
  --bucket cloudshop-g01-terraform-state \
  --region us-east-1

aws s3api put-bucket-versioning \
  --bucket cloudshop-g01-terraform-state \
  --versioning-configuration Status=Enabled

aws dynamodb create-table \
  --table-name cloudshop-g01-terraform-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

These two resources are created manually once.
Everything else is created by Terraform.
