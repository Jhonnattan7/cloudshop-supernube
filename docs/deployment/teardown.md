# Teardown

How to destroy all infrastructure.

## Destroy all resources

```bash
cd terraform
terraform destroy
```

Type `yes` when prompted.

## What is NOT destroyed by terraform destroy

These were created manually in bootstrap and must be deleted manually:

```bash
# Empty the state bucket first
aws s3 rm s3://cloudshop-g01-terraform-state --recursive

# Delete state bucket
aws s3api delete-bucket \
  --bucket cloudshop-g01-terraform-state

# Delete lock table
aws dynamodb delete-table \
  --table-name cloudshop-g01-terraform-lock
```

## Warning

Running terraform destroy deletes ALL data in DynamoDB.
There is no backup.
Only run this after the project is fully graded.
