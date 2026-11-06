param([Parameter(Mandatory=$true)][string]$NodeDirectory, [Parameter(Mandatory=$true)][string]$OutputDirectory)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$project = Split-Path -Parent $PSScriptRoot
$compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
$stage = Join-Path $OutputDirectory 'portable'
$runtime = Join-Path $stage 'runtime'
New-Item -ItemType Directory -Force $runtime | Out-Null
foreach ($file in 'server.cjs','index.html','status.ps1','bluetooth.ps1','icon.ps1','LICENSE') {
    Copy-Item -LiteralPath (Join-Path $project $file) -Destination $stage
}
Copy-Item -LiteralPath (Join-Path $NodeDirectory 'node.exe') -Destination $runtime
Copy-Item -LiteralPath (Join-Path $NodeDirectory 'LICENSE') -Destination (Join-Path $runtime 'NODE-LICENSE.txt')
$portable = Join-Path $OutputDirectory 'PTdeck-v0.1.0-Windows-x64-Portable.zip'
$setup = Join-Path $OutputDirectory 'PTdeck-v0.1.0-Windows-x64-Setup.exe'
& $compiler /nologo /target:exe /platform:x64 "/out:$stage\PTdeck.exe" (Join-Path $PSScriptRoot 'Launcher.cs')
if ($LASTEXITCODE) { throw 'Launcher compilation failed.' }
if (Test-Path -LiteralPath $portable) { Remove-Item -LiteralPath $portable }
[IO.Compression.ZipFile]::CreateFromDirectory($stage,$portable,[IO.Compression.CompressionLevel]::Optimal,$false)
& $compiler /nologo /target:winexe /platform:x64 /r:System.Windows.Forms.dll /r:System.IO.Compression.dll /r:System.IO.Compression.FileSystem.dll /r:Microsoft.CSharp.dll "/resource:$portable,PTdeckPayload" "/out:$setup" (Join-Path $PSScriptRoot 'Installer.cs')
if ($LASTEXITCODE) { throw 'Installer compilation failed.' }
Get-Item -LiteralPath $portable,$setup

