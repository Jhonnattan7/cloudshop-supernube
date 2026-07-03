locals {
  prefix          = "${var.project_name}-${var.environment}"
  frontend_bucket = "${local.prefix}-frontend"
  state_bucket    = "${var.project_name}-terraform-state"
  event_bus_name  = "${local.prefix}-event-bus"

  common_tags = {
    Project     = "cloudshop-supernube"
    Environment = var.environment
    Team        = "g01"
    ManagedBy   = "terraform"
  }
}
