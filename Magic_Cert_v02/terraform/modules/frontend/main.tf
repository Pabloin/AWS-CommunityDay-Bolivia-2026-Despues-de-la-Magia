# Frontend Module - S3 Static Website

resource "aws_s3_bucket" "website" {
  bucket = "${var.project_name}-frontend-${var.environment}"

  tags = {
    Component = "frontend"
    Purpose   = "static-website"
  }
}

resource "aws_s3_bucket_website_configuration" "website" {
  bucket = aws_s3_bucket.website.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"  # For SPA routing
  }
}

resource "aws_s3_bucket_public_access_block" "website" {
  bucket = aws_s3_bucket.website.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "website" {
  bucket = aws_s3_bucket.website.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.website.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.website]
}

resource "aws_s3_bucket_cors_configuration" "website" {
  bucket = aws_s3_bucket.website.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Upload built frontend files
resource "null_resource" "build_and_deploy_frontend" {
  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    command = <<-EOT
      set -e
      cd ${path.module}/../../../Magic_Cert_v01
      
      # Create .env.production with API URL
      echo "VITE_API_URL=${var.api_url}" > .env.production
      
      # Install dependencies if needed
      if [ ! -d "node_modules" ]; then
        npm install
      fi
      
      # Build
      npm run build
      
      # Sync to S3
      aws s3 sync dist/ s3://${aws_s3_bucket.website.id} --delete --profile magic-account
    EOT
    
    interpreter = ["/bin/bash", "-c"]
  }

  depends_on = [
    aws_s3_bucket.website,
    aws_s3_bucket_policy.website
  ]
}
