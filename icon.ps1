param([string]$Target)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
if (![IO.Path]::IsPathRooted($Target)) {
  $command = Get-Command $Target -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
  if (!$command) { exit 1 }
  $Target = $command.Source
}
$index = 0
if ($Target.EndsWith('.lnk', [StringComparison]::OrdinalIgnoreCase)) {
  $shortcut = (New-Object -ComObject WScript.Shell).CreateShortcut($Target)
  $Target = $shortcut.TargetPath
  if ($shortcut.IconLocation -match '^(.+),\s*(-?\d+)$') {
    $iconFile = [Environment]::ExpandEnvironmentVariables($Matches[1].Trim('"'))
    if (Test-Path -LiteralPath $iconFile -PathType Leaf) {
      $Target = $iconFile
      $index = [int]$Matches[2]
    }
  }
}
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class DeckShellIcon {
    [DllImport("shell32.dll", CharSet = CharSet.Unicode)]
    public static extern int SHDefExtractIcon(string file, int index, uint flags, out IntPtr large, IntPtr small, uint size);
    [DllImport("user32.dll")]
    public static extern bool DestroyIcon(IntPtr icon);
}
"@
$handle = [IntPtr]::Zero
$icon = $null
$bitmap = $null
$stream = New-Object IO.MemoryStream
try {
  $result = [DeckShellIcon]::SHDefExtractIcon($Target, $index, 0, [ref]$handle, [IntPtr]::Zero, 256)
  if ($result -eq 0 -and $handle -ne [IntPtr]::Zero) {
    $icon = [Drawing.Icon]::FromHandle($handle)
  } else {
    $icon = [Drawing.Icon]::ExtractAssociatedIcon($Target)
  }
  if (!$icon) { exit 1 }
  $bitmap = $icon.ToBitmap()
  $bitmap.Save($stream, [Drawing.Imaging.ImageFormat]::Png)
  [Convert]::ToBase64String($stream.ToArray())
} finally {
  $stream.Dispose()
  if ($bitmap) { $bitmap.Dispose() }
  if ($icon) { $icon.Dispose() }
  if ($handle -ne [IntPtr]::Zero) { [void][DeckShellIcon]::DestroyIcon($handle) }
}

