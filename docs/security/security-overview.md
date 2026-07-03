# Security Overview

## 1. Security layers

```text
Request
↓
CloudFront         - DDoS protection + HTTPS only
↓
WAF                - SQLi, XSS, rate limiting rules
↓
API Gateway        - single entry point, no direct Lambda access
↓
Lambda Authorizer  - JWT validation + role extraction
↓
Lambda (service)   - business role check per endpoint
↓
IAM Role           - least privilege per Lambda
```

## 2. Authentication - JWT

Every protected endpoint requires a valid JWT in the Authorization header.

```text
Authorization: Bearer <token>
```

Token payload:

```json
{
  "userId": "usr_abc123",
  "email": "user@email.com",
  "rol": "ADMIN",
  "exp": 1234567890
}
```

Token expiration: 1 hour (`exp` = issued time + 3600 seconds)

Full auth contract -> [docs/contracts/auth-contract.md](../contracts/auth-contract.md)

## 3. Lambda Authorizer

A single shared Lambda Authorizer in `lambdas/shared/` validates every request before it reaches any service Lambda.

Validation steps:

1. Check Authorization header exists
2. Verify JWT signature
3. Check token is not expired
4. Extract `rol` from payload
5. Pass `userId` and `rol` to the downstream Lambda via request context

| Condition | Result |
|---|---|
| No Authorization header | `401 Unauthorized` |
| Invalid signature | `401 Unauthorized` |
| Expired token | `401 Unauthorized` |
| Valid token, wrong role | `403 Forbidden` |
| Valid token, correct role | Request passes through |

## 4. Business roles

Three roles control access at the endpoint level:

| Role | Description |
|---|---|
| `ADMIN` | Full platform access |
| `OPERADOR` | Inventory and order management |
| `CLIENTE` | Own cart and own orders only |

Full permission matrix -> [docs/security/roles-matrix.md](roles-matrix.md)

## 5. IAM - least privilege

Each Lambda has its own IAM role with only the exact actions it needs.
No Lambda shares roles. No wildcard `*` in actions.

Full IAM policies -> [docs/security/iam-policies.md](iam-policies.md)

Key rules from the project requirements:

- IAM roles must follow least privilege principle
- No global administrative permissions without written technical justification
- No `AdministratorAccess` policy attached to any Lambda role

## 6. WAF rules

WAF is attached to CloudFront and filters all traffic before it reaches API Gateway.

| Rule | Protection |
|---|---|
| `AWSManagedRulesSQLiRuleSet` | SQL injection |
| `AWSManagedRulesCommonRuleSet` | XSS and common attacks |
| Rate limit | Max 1000 requests per 5 minutes per IP |

WAF is deployed in `Count` mode first, then switched to `Block` after validating no false positives in CloudWatch logs.

## 7. Mandatory test cases

### Case 1 - Access without permissions

```text
Request: DELETE /products/{id}
Token rol: CLIENTE
Expected: 403 Forbidden

Response:
{
  "error": "FORBIDDEN",
  "message": "You do not have permission to perform this action",
  "statusCode": 403
}
```

Evidence location: docs/evidence/case1-forbidden.png
