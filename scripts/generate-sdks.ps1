# SDK Generation Script
$specUrl = "http://localhost:4000/swagger/json"
$root = (Get-Item -Path ".").FullName
$pythonOut = "$root/packages/sdks/python"
$tsOut = "$root/packages/sdks/typescript"

Write-Host "Using spec from $specUrl"

# 1. Generate Python SDK
Write-Host "Generating Python SDK..."
npx @openapitools/openapi-generator-cli generate `
    -i $specUrl `
    -g python `
    -o $pythonOut `
    --skip-validate-spec `
    --additional-properties=packageName=openrouter_sdk

# 2. Generate TypeScript SDK
Write-Host "Generating TypeScript SDK..."
npx @openapitools/openapi-generator-cli generate `
    -i $specUrl `
    -g typescript `
    -o $tsOut `
    --skip-validate-spec `
    --additional-properties=npmName=@promptrouter/sdk

Write-Host "SDK generation complete!"
