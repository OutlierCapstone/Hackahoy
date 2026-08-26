[CmdletBinding()]
param(
  [ValidateSet('Status', 'Start', 'Stop')]
  [string]$Action = 'Status'
)

$ErrorActionPreference = 'Stop'
$expectedAccount = '591359168371'
$region = 'us-east-1'
$instanceId = 'i-07be6630da21e2859'

function Assert-AwsExit([string]$operation) {
  if ($LASTEXITCODE -ne 0) {
    throw "$operation failed with exit code $LASTEXITCODE. Run 'aws login' and retry."
  }
}

$account = [string](aws sts get-caller-identity --query Account --output text)
Assert-AwsExit 'AWS identity check'
if ($account.Trim() -ne $expectedAccount) {
  throw "Refusing to operate on AWS account $($account.Trim()); expected $expectedAccount."
}

if ($Action -eq 'Start') {
  aws ec2 start-instances --region $region --instance-ids $instanceId --no-cli-pager | Out-Null
  Assert-AwsExit 'EC2 start'
  aws ec2 wait instance-running --region $region --instance-ids $instanceId
  Assert-AwsExit 'EC2 running waiter'
}

if ($Action -eq 'Stop') {
  aws ec2 stop-instances --region $region --instance-ids $instanceId --no-cli-pager | Out-Null
  Assert-AwsExit 'EC2 stop'
  aws ec2 wait instance-stopped --region $region --instance-ids $instanceId
  Assert-AwsExit 'EC2 stopped waiter'
}

aws ec2 describe-instances `
  --region $region `
  --instance-ids $instanceId `
  --query 'Reservations[0].Instances[0].{State:State.Name,InstanceId:InstanceId,Type:InstanceType,PublicIp:PublicIpAddress,RootVolume:BlockDeviceMappings[0].Ebs.VolumeId}' `
  --output table
Assert-AwsExit 'EC2 status'
