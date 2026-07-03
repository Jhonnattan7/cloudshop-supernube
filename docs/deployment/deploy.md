# Deployment Guide

Full deployment from scratch using Terraform.
No manual AWS Console steps allowed after bootstrap.

## Step 0 - Bootstrap Terraform Remote State

Before applying the main infrastructure, you must create the remote state bucket and lock table:

```bash
cd terraform-bootstrap
terraform init
terraform apply
cd ..
```

Type `yes` when prompted.

## Step 1 - Initialize Terraform

```bash
cd terraform
terraform init
```

Expected output:

```text
Terraform has been successfully initialized!
```

## Step 2 - Review the plan

```bash
terraform plan -out=tfplan
```

Review every resource before applying.
Expected: no errors, all resources shown as to be created.

## Step 3 - Apply infrastructure

```bash
terraform apply tfplan
```

Type `yes` when prompted.

Expected output:

```text
Apply complete! Resources: X added, 0 changed, 0 destroyed.
```

## Step 4 - Update README outputs

After apply, run:

```bash
terraform output
```

Copy the values to the root README.md outputs table.
This unblocks the rest of the team.

## Step 5 - Deploy Lambdas

Each service deploys their own Lambda independently:

```bash
# Auth
cd lambdas/auth
npm install
zip -r function.zip .
aws lambda update-function-code \
  --function-name cloudshop-g01-auth-lambda \
  --zip-file fileb://function.zip

# Catalog
cd lambdas/catalog
npm install
zip -r function.zip .
aws lambda update-function-code \
  --function-name cloudshop-g01-catalog-lambda \
  --zip-file fileb://function.zip

# Orders
cd lambdas/orders
npm install
zip -r function.zip .
aws lambda update-function-code \
  --function-name cloudshop-g01-orders-lambda \
  --zip-file fileb://function.zip

# Reports
cd lambdas/reports
npm install
zip -r function.zip .
aws lambda update-function-code \
  --function-name cloudshop-g01-reports-lambda \
  --zip-file fileb://function.zip

# Events
cd lambdas/events
npm install
zip -r function.zip .
aws lambda update-function-code \
  --function-name cloudshop-g01-events-lambda \
  --zip-file fileb://function.zip
```

## Step 6 - Deploy frontend

```bash
cd frontend
npm install
npm run build

aws s3 sync dist/ s3://cloudshop-g01-frontend \
  --delete

aws cloudfront create-invalidation \
  --distribution-id <DISTRIBUTION_ID> \
  --paths "/*"
```

Replace `<DISTRIBUTION_ID>` with the value from terraform output.

## Verify deployment

```bash
# Check API Gateway is responding
curl https://<API_GW_URL>/dev/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'

# Expected: 401 or 400 (not 502 - 502 means Lambda is broken)
```
