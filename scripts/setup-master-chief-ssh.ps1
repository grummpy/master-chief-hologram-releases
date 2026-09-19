# Run once from an elevated Windows PowerShell window.
$ErrorActionPreference = 'Stop'
$controllerIp = '192.168.4.42'
$publicKey = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAID6BmwFw/hZ0W8m6aZ95dZVVUsNIQuvAIpXCv1BfEYGq master-chief-mac-to-windows'

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = [Security.Principal.WindowsPrincipal]::new($identity)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw 'Open PowerShell with Run as administrator, then rerun this script.'
}

$capability = Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH.Server*' | Select-Object -First 1
if (-not $capability -or $capability.State -ne 'Installed') {
  Add-WindowsCapability -Online -Name 'OpenSSH.Server~~~~0.0.1.0' | Out-Null
}

Set-Service -Name sshd -StartupType Automatic
Start-Service sshd

# Windows OpenSSH uses this file for members of the local Administrators group.
$keyFile = Join-Path $env:ProgramData 'ssh\administrators_authorized_keys'
New-Item -ItemType Directory -Force -Path (Split-Path $keyFile) | Out-Null
$existing = if (Test-Path $keyFile) { Get-Content $keyFile -ErrorAction SilentlyContinue } else { @() }
if ($existing -notcontains $publicKey) { Add-Content -LiteralPath $keyFile -Value $publicKey -Encoding ascii }
& icacls.exe $keyFile /inheritance:r /grant '*S-1-5-32-544:F' /grant '*S-1-5-18:F' | Out-Null

# Remove the broad installer-created inbound rule and allow only this Mac.
Get-NetFirewallRule -Name 'OpenSSH-Server-In-TCP' -ErrorAction SilentlyContinue | Disable-NetFirewallRule
Get-NetFirewallRule -DisplayName 'Master Chief SSH from Mac' -ErrorAction SilentlyContinue | Remove-NetFirewallRule
# Windows commonly classifies home Wi-Fi as Public. Keep the source locked to the
# controller Mac while allowing the rule to work regardless of that classification.
New-NetFirewallRule -DisplayName 'Master Chief SSH from Mac' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 22 -RemoteAddress $controllerIp -Profile Any | Out-Null

Restart-Service sshd
Write-Host 'Master Chief SSH is installed as an automatic Windows background service.'
Write-Host "Authorized controller: $controllerIp"
Write-Host "Windows user: $env:USERNAME"
Write-Host 'You may close PowerShell. The SSH service will continue in the background and start with Windows.'
