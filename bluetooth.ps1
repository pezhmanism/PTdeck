$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$type = [Windows.Devices.Enumeration.DeviceInformation,Windows.Devices.Enumeration,ContentType=WindowsRuntime]
$collection = [Windows.Devices.Enumeration.DeviceInformationCollection,Windows.Devices.Enumeration,ContentType=WindowsRuntime]
$asTask = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
  $_.Name -eq 'AsTask' -and $_.IsGenericMethodDefinition -and $_.GetParameters().Count -eq 1 -and
  $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
} | Select-Object -First 1
$selectors = @(
  [Windows.Devices.Bluetooth.BluetoothDevice,Windows.Devices.Bluetooth,ContentType=WindowsRuntime]::GetDeviceSelectorFromConnectionStatus(1),
  [Windows.Devices.Bluetooth.BluetoothLEDevice,Windows.Devices.Bluetooth,ContentType=WindowsRuntime]::GetDeviceSelectorFromConnectionStatus(1)
)
$batteryKey = 'System.Devices.BatteryLife'
$addressKey = 'System.Devices.Aep.DeviceAddress'
$kind = [Windows.Devices.Enumeration.DeviceInformationKind,Windows.Devices.Enumeration,ContentType=WindowsRuntime]::AssociationEndpoint
$devices = @{}
foreach ($selector in $selectors) {
  $operation = $type::FindAllAsync($selector, [string[]]@($batteryKey,$addressKey), $kind)
  $task = $asTask.MakeGenericMethod($collection).Invoke($null, @($operation))
  if (!$task.Wait(2500)) { throw 'Bluetooth lookup timed out' }
  foreach ($device in $task.Result) {
    if (!$device.Name) { continue }
    $address = $device.Properties[$addressKey]
    $id = if ($address) { $address } else { $device.Id }
    $battery = $device.Properties[$batteryKey]
    if ($battery -isnot [ValueType] -or $battery -lt 0 -or $battery -gt 100) { $battery = $null }
    if (!$devices.ContainsKey($id) -or $null -ne $battery) {
      $devices[$id] = @{name=$device.Name;battery=$battery}
    }
  }
}
ConvertTo-Json -Compress -InputObject @($devices.Values | Sort-Object { $_.name })


