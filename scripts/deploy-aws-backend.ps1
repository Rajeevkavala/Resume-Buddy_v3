# ==============================================================================
# ResumeBuddy v3 - AWS Graviton EC2 Automated Deployment Script
# Region: ap-south-1 (Mumbai)
# ==============================================================================

$Region = "ap-south-1"
$KeyName = "resumebuddy-key"
$SgName = "resumebuddy-sg"
$InstanceType = "t4g.small"
$AmiId = "ami-006af69bbc199ff79" # Ubuntu Server 24.04 LTS ARM64 in ap-south-1

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Starting ResumeBuddy AWS Graviton Deployment in $Region" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# 1. Check Caller Identity
$identity = aws sts get-caller-identity --output json | ConvertFrom-Json
Write-Host "Authenticated as IAM User/Role: $($identity.Arn)" -ForegroundColor Green

# 2. Ensure Key Pair
Write-Host "`n[Step 1/6] Checking EC2 Key Pair ($KeyName)..." -ForegroundColor Yellow
$keyJson = aws ec2 describe-key-pairs --region $Region --filters "Name=key-name,Values=$KeyName" --output json 2>$null
$existingKeys = $null
if ($keyJson) {
    $existingKeys = ($keyJson | ConvertFrom-Json).KeyPairs
}

if (-not $existingKeys -or $existingKeys.Count -eq 0) {
    Write-Host "Generating new Key Pair: $KeyName..." -ForegroundColor Green
    $keyMaterial = aws ec2 create-key-pair --region $Region --key-name $KeyName --query 'KeyMaterial' --output text
    $keyPath = Join-Path (Get-Location) "resumebuddy-key.pem"
    [System.IO.File]::WriteAllText($keyPath, $keyMaterial)
    Write-Host "Saved private key to $keyPath" -ForegroundColor Green
} else {
    Write-Host "Key pair $KeyName already exists in $Region." -ForegroundColor Green
}

# 3. Ensure Default VPC & Security Group
Write-Host "`n[Step 2/6] Checking VPC and Security Group..." -ForegroundColor Yellow
$defaultVpcId = (aws ec2 describe-vpcs --region $Region --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text).Trim()
Write-Host "Default VPC ID: $defaultVpcId" -ForegroundColor Green

$sgId = (aws ec2 describe-security-groups --region $Region --filters "Name=group-name,Values=$SgName" "Name=vpc-id,Values=$defaultVpcId" --query "SecurityGroups[0].GroupId" --output text).Trim()
if (-not $sgId -or $sgId -eq "None") {
    Write-Host "Creating Security Group: $SgName..." -ForegroundColor Green
    $sgId = (aws ec2 create-security-group --region $Region --group-name $SgName --description "ResumeBuddy Backend Graviton SG" --vpc-id $defaultVpcId --query "GroupId" --output text).Trim()
    
    Write-Host "Adding Inbound Rules (Port 22, 80, 443)..." -ForegroundColor Green
    aws ec2 authorize-security-group-ingress --region $Region --group-id $sgId --protocol tcp --port 22 --cidr 0.0.0.0/0 | Out-Null
    aws ec2 authorize-security-group-ingress --region $Region --group-id $sgId --protocol tcp --port 80 --cidr 0.0.0.0/0 | Out-Null
    aws ec2 authorize-security-group-ingress --region $Region --group-id $sgId --protocol tcp --port 443 --cidr 0.0.0.0/0 | Out-Null
    Write-Host "Security Group created with ID: $sgId" -ForegroundColor Green
} else {
    Write-Host "Security Group $SgName already exists with ID: $sgId" -ForegroundColor Green
}

# 4. Check if an active instance already exists
Write-Host "`n[Step 3/6] Checking for existing instances..." -ForegroundColor Yellow
$existingInstances = aws ec2 describe-instances --region $Region --filters "Name=tag:Name,Values=resumebuddy-backend-graviton" "Name=instance-state-name,Values=running,pending" --query "Reservations[*].Instances[*].InstanceId" --output text
$instanceId = $null

if ($existingInstances -and $existingInstances -ne "None" -and [string]::IsNullOrWhiteSpace($existingInstances) -eq $false) {
    $instanceId = ($existingInstances -split "\s+")[0].Trim()
    Write-Host "Found existing active instance: $instanceId" -ForegroundColor Green
} else {
    Write-Host "Launching new AWS Graviton ($InstanceType) EC2 instance..." -ForegroundColor Green
    $userDataPath = "file://scripts/user-data.sh"
    $blockDevicePath = "file://scripts/block-device-mapping.json"
    $tagSpecPath = "file://scripts/tag-specifications.json"
    
    $runResultJson = aws ec2 run-instances `
        --region $Region `
        --image-id $AmiId `
        --instance-type $InstanceType `
        --key-name $KeyName `
        --security-group-ids $sgId `
        --user-data $userDataPath `
        --block-device-mappings $blockDevicePath `
        --tag-specifications $tagSpecPath `
        --output json

    $runResult = $runResultJson | ConvertFrom-Json
    $instanceId = $runResult.Instances[0].InstanceId
    Write-Host "Launched EC2 Instance: $instanceId" -ForegroundColor Green
}

# 5. Wait for instance to enter running state
Write-Host "`n[Step 4/6] Waiting for instance ($instanceId) to reach 'running' state..." -ForegroundColor Yellow
aws ec2 wait instance-running --region $Region --instance-ids $instanceId
Write-Host "Instance $instanceId is now running!" -ForegroundColor Green

# 6. Allocate / Associate Elastic IP
Write-Host "`n[Step 5/6] Managing Elastic IP (Static Public IPv4)..." -ForegroundColor Yellow
$existingEipsJson = aws ec2 describe-addresses --region $Region --filters "Name=tag:Name,Values=resumebuddy-backend-eip" --output json
$existingEips = $null
if ($existingEipsJson) {
    $existingEips = ($existingEipsJson | ConvertFrom-Json).Addresses
}

$allocationId = $null
$publicIp = $null

if ($existingEips -and $existingEips.Count -gt 0) {
    $allocationId = $existingEips[0].AllocationId
    $publicIp = $existingEips[0].PublicIp
    Write-Host "Reusing existing Elastic IP: $publicIp ($allocationId)" -ForegroundColor Green
} else {
    Write-Host "Allocating new Elastic IP..." -ForegroundColor Green
    $eipTagPath = "file://scripts/eip-tag-specifications.json"
    $eipResultJson = aws ec2 allocate-address --region $Region --domain vpc --tag-specifications $eipTagPath --output json
    $eipResult = $eipResultJson | ConvertFrom-Json
    $allocationId = $eipResult.AllocationId
    $publicIp = $eipResult.PublicIp
    Write-Host "Allocated Elastic IP: $publicIp ($allocationId)" -ForegroundColor Green
}

# Associate EIP with the instance
Write-Host "Associating Elastic IP $publicIp with instance $instanceId..." -ForegroundColor Yellow
aws ec2 associate-address --region $Region --instance-id $instanceId --allocation-id $allocationId --allow-reassociation | Out-Null
Write-Host "Elastic IP successfully associated!" -ForegroundColor Green

# 7. Print Deployment Summary
Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "  RESUMEBUDDY AWS BACKEND DEPLOYMENT PROVISIONED! " -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Region:             $Region" -ForegroundColor White
Write-Host "Instance ID:        $instanceId" -ForegroundColor White
Write-Host "Instance Type:      $InstanceType (ARM64 Graviton)" -ForegroundColor White
Write-Host "Elastic IP (IPv4):  $publicIp" -ForegroundColor Yellow
Write-Host "Security Group:     $sgId" -ForegroundColor White
Write-Host "Private Key:        resumebuddy-key.pem" -ForegroundColor White
Write-Host "----------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "Namify DNS Update Requirement:" -ForegroundColor Yellow
Write-Host "  In Namify (manage.get.tech) -> Add/Update A Record:" -ForegroundColor White
Write-Host "  Host: api" -ForegroundColor White
Write-Host "  Destination IPv4: $publicIp" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Cyan
