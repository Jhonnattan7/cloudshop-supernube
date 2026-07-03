resource "aws_cloudwatch_event_bus" "this" {
  name = var.bus_name
  tags = var.tags
}

resource "aws_cloudwatch_event_rule" "order_created" {
  name           = "order-created-rule"
  description    = "Capture ORDER_CREATED events"
  event_bus_name = aws_cloudwatch_event_bus.this.name

  event_pattern = jsonencode({
    source        = ["cloudshop.orders"]
    "detail-type" = ["ORDER_CREATED"]
  })
}

resource "aws_cloudwatch_event_target" "order_created_target" {
  rule           = aws_cloudwatch_event_rule.order_created.name
  event_bus_name = aws_cloudwatch_event_bus.this.name
  arn            = var.events_lambda_arn
}

resource "aws_cloudwatch_event_rule" "order_cancelled" {
  name           = "order-cancelled-rule"
  description    = "Capture ORDER_CANCELLED events"
  event_bus_name = aws_cloudwatch_event_bus.this.name

  event_pattern = jsonencode({
    source        = ["cloudshop.orders"]
    "detail-type" = ["ORDER_CANCELLED"]
  })
}

resource "aws_cloudwatch_event_target" "order_cancelled_target" {
  rule           = aws_cloudwatch_event_rule.order_cancelled.name
  event_bus_name = aws_cloudwatch_event_bus.this.name
  arn            = var.events_lambda_arn
}

resource "aws_cloudwatch_event_rule" "product_deleted" {
  name           = "product-deleted-rule"
  description    = "Capture PRODUCT_DELETED events"
  event_bus_name = aws_cloudwatch_event_bus.this.name

  event_pattern = jsonencode({
    source        = ["cloudshop.catalog"]
    "detail-type" = ["PRODUCT_DELETED"]
  })
}

resource "aws_cloudwatch_event_target" "product_deleted_target" {
  rule           = aws_cloudwatch_event_rule.product_deleted.name
  event_bus_name = aws_cloudwatch_event_bus.this.name
  arn            = var.events_lambda_arn
}
