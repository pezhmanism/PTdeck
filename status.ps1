param([ValidateSet('status','previous','playpause','next')][string]$Action = 'status')
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$managerType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime]
$mediaType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties,Windows.Media.Control,ContentType=WindowsRuntime]
$asTask = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
  $_.Name -eq 'AsTask' -and $_.IsGenericMethodDefinition -and $_.GetParameters().Count -eq 1 -and
  $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
} | Select-Object -First 1
function Resolve-Operation($operation, [Type]$resultType) {
  $task = $asTask.MakeGenericMethod($resultType).Invoke($null, @($operation))
  if (!$task.Wait(2500)) { throw 'Media request timed out.' }
  $task.Result
}
$music = $null
try {
  $manager = Resolve-Operation ($managerType::RequestAsync()) $managerType
  $session = $manager.GetCurrentSession()
  if ($session -and $Action -ne 'status') {
    switch ($Action) {
      previous { $operation = $session.TrySkipPreviousAsync() }
      playpause { $operation = $session.TryTogglePlayPauseAsync() }
      next { $operation = $session.TrySkipNextAsync() }
    }
    if (!(Resolve-Operation $operation ([bool]))) { throw 'Playback command declined.' }
    return
  }
  if ($Action -ne 'status') { throw 'No active media session.' }
  if ($session) {
    $info = Resolve-Operation ($session.TryGetMediaPropertiesAsync()) $mediaType
    $timeline = $session.GetTimelineProperties()
    $playing = [string]$session.GetPlaybackInfo().PlaybackStatus -eq 'Playing'
    $position = $timeline.Position.TotalSeconds
    if ($playing -and $timeline.LastUpdatedTime.Year -gt 2000) {
      $position += [Math]::Max(0, ([DateTimeOffset]::UtcNow - $timeline.LastUpdatedTime).TotalSeconds)
    }
    $music = @{title=$info.Title;artist=$info.Artist;playing=$playing;position=$position;duration=$timeline.EndTime.TotalSeconds}
  }
} catch {
  if ($Action -ne 'status') { throw }
}
Add-Type -AssemblyName System.Windows.Forms
$power = [Windows.Forms.SystemInformation]::PowerStatus
$battery = $null
if (!($power.BatteryChargeStatus -band [Windows.Forms.BatteryChargeStatus]::NoSystemBattery) -and $power.BatteryChargeStatus -ne [Windows.Forms.BatteryChargeStatus]::Unknown) {
  $battery = [Math]::Round($power.BatteryLifePercent * 100)
}
$rx = 0; $tx = 0
foreach ($nic in [Net.NetworkInformation.NetworkInterface]::GetAllNetworkInterfaces()) {
  if ($nic.OperationalStatus -ne 'Up' -or $nic.NetworkInterfaceType -notin @('Ethernet','Wireless80211')) { continue }
  try { $stats = $nic.GetIPv4Statistics(); $rx += $stats.BytesReceived; $tx += $stats.BytesSent } catch {}
}
$internet = $null
try {
  $network = [Windows.Networking.Connectivity.NetworkInformation,Windows.Networking.Connectivity,ContentType=WindowsRuntime]
  $profile = $network::GetInternetConnectionProfile()
  $internet = $null -ne $profile -and [string]$profile.GetNetworkConnectivityLevel() -eq 'InternetAccess'
} catch {}
$gpu = $null
try {
  $samples = Get-CimInstance Win32_PerfFormattedData_GPUPerformanceCounters_GPUEngine -OperationTimeoutSec 3 -ErrorAction Stop
  if ($samples) {
    $engines = $samples | Group-Object { $_.Name -replace '^pid_\d+_', '' }
    $peak = $engines | ForEach-Object { ($_.Group | Measure-Object UtilizationPercentage -Sum).Sum } | Measure-Object -Maximum
    $gpu = [Math]::Max(0, [Math]::Min(100, [Math]::Round($peak.Maximum)))
  }
} catch {}
@{internet=$internet;gpu=$gpu;music=$music;battery=$battery;charging=([string]$power.PowerLineStatus -eq 'Online');rx=$rx;tx=$tx} | ConvertTo-Json -Compress -Depth 4





