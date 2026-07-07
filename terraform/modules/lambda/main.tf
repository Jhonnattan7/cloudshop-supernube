# zippea el folder tal cual esta, node_modules incluido
# hay que correr npm install en el source_dir antes de terraform apply
data "archive_file" "package" {
  type        = "zip"
  source_dir  = var.source_dir
  output_path = "${path.module}/${var.function_name}.zip"
}

resource "aws_lambda_function" "this" {
  function_name    = var.function_name
  filename         = data.archive_file.package.output_path
  source_code_hash = data.archive_file.package.output_base64sha256
  handler          = var.handler
  runtime          = var.runtime
  role             = var.role_arn
  timeout          = var.timeout
  memory_size      = var.memory_size

  environment {
    variables = var.environment
  }

  tags = var.tags
}
