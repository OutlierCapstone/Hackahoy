[CmdletBinding()]
param(
  [ValidateSet('Status', 'RestoreInfo')]
  [string]$Action = 'Status'
)

$ErrorActionPreference = 'Stop'
$expectedAccount = '591359168371'
$region = 'us-east-1'
$snapshotId = 'snap-0f1f25ee509333d6c'

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

if ($Action -eq 'RestoreInfo') {
  [pscustomobject]@{
    Region          = $region
    SnapshotId      = $snapshotId
    Architecture    = 'x86_64'
    Virtualization  = 'hvm'
    RootDeviceName  = '/dev/sda1'
    EnaSupport      = $true
    BootMode        = 'uefi-preferred'
    InstanceType    = 't3a.medium'
    KeyName         = 'hackahoy'
    SecurityGroupId = 'sg-00aaff80198a8f601'
    SubnetId        = 'subnet-0a34bbf353a796de0'
  } | Format-List
  Write-Host 'Restore the archived snapshot to the standard tier before creating a volume or registering an AMI.'
  exit 0
}

aws ec2 describe-snapshots `
  --region $region `
  --snapshot-ids $snapshotId `
  --query 'Snapshots[0].{SnapshotId:SnapshotId,State:State,StorageTier:StorageTier,VolumeSizeGiB:VolumeSize,StartTime:StartTime}' `
  --output table
Assert-AwsExit 'Snapshot status'

aws ec2 describe-snapshot-tier-status `
  --region $region `
  --filters "Name=snapshot-id,Values=$snapshotId" `
  --query 'SnapshotTierStatuses[0].{StorageTier:StorageTier,Operation:LastTieringOperationStatus,Progress:LastTieringProgress}' `
  --output table
Assert-AwsExit 'Snapshot tier status'
