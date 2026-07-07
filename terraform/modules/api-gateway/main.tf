resource "aws_api_gateway_rest_api" "api" {
  name        = var.api_name
  description = "CloudShop Enterprise API"
  tags        = var.tags
}

resource "aws_api_gateway_deployment" "deployment" {
  rest_api_id = aws_api_gateway_rest_api.api.id

  # sin esto, terraform nunca vuelve a desplegar cuando se agregan rutas
  # por fuera de este modulo (raiz define los recursos de cada servicio)
  triggers = {
    redeployment = var.redeploy_trigger
  }

  depends_on = [
    aws_api_gateway_rest_api.api
  ]

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "stage" {
  deployment_id = aws_api_gateway_deployment.deployment.id
  rest_api_id   = aws_api_gateway_rest_api.api.id
  stage_name    = var.stage_name
  tags          = var.tags
}

resource "aws_api_gateway_method_settings" "settings" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  stage_name  = aws_api_gateway_stage.stage.stage_name
  method_path = "*/*"

  settings {
    logging_level      = "INFO"
    data_trace_enabled = true
    metrics_enabled    = true
  }
}
