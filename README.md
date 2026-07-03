# CloudShop Enterprise (cloudshop-supernube)

Cloud-native e-commerce platform on AWS — Lambda, DynamoDB, API Gateway, Terraform.

## Project Structure

- `docs/`: Project documentation (Architecture, Database, Security, Deployment).
- `frontend/`: React single-page application (SPA).
- `lambdas/`: Serverless microservices (auth, catalog, orders, reports, events).
- `terraform-bootstrap/`: Initial AWS resources for Terraform state (S3 bucket and DynamoDB lock table).
- `terraform/`: Main infrastructure as code files and modules.

## Deployment

Please follow the deployment guides in order:
1. [Prerequisites](docs/deployment/prerequisites.md)
2. [Deployment Guide](docs/deployment/deploy.md)
3. [Teardown Guide](docs/deployment/teardown.md)

## Infrastructure Outputs

Once deployed, the following values should be populated here for the team to use:

| Resource | Value |
|----------|-------|
| API Gateway URL | `TBD` |
| CloudFront URL | `TBD` |
| EventBus Name | `TBD` |
| Frontend Bucket | `TBD` |
| Users Table ARN | `TBD` |
| Products Table ARN | `TBD` |
| Stores Table ARN | `TBD` |
| Orders Table ARN | `TBD` |
| Carts Table ARN | `TBD` |
| Audit Table ARN | `TBD` |
