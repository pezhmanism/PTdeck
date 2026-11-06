# Windows packaging

The portable ZIP contains PTdeck.exe, the dashboard files and the official Windows x64 Node.js runtime. Extract the complete ZIP before running the launcher. Setup contains the same payload and copies it into the current user's Local AppData folder under PTdeck, then creates a Start menu shortcut. Both start the same host and open the default browser after port binding succeeds. No separate Node.js installation is needed.

The executables are unsigned. To remove a per-user installation, close its host window and remove the PTdeck Start menu shortcut and the PTdeck folder under Local AppData. Back up its data folder first if you want to retain shortcuts and tasks. A portable copy keeps its data next to its launcher.

## Build

On Windows x64, obtain and extract the official Windows x64 Node.js ZIP and verify it against the published SHA-256 checksum. Run the following in PowerShell from the source root, using a fresh output directory.

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\packaging\Build-Windows.ps1 -NodeDirectory C:\path\to\node-win-x64 -OutputDirectory C:\path\to\build-output
```

The build uses the Windows .NET Framework C# compiler. Publish the generated portable ZIP and Setup EXE as release assets and keep their bundled Node.js license. See the [official Node.js distribution](https://nodejs.org/dist/).

