# User guide

## Shortcuts

Open the local PC address shown in the launcher. In **Edit shortcuts**, add a display name and a Windows executable, shortcut or file path. Use an executable name such as `notepad.exe` or a full path. Enter the path without surrounding quotes. Click **Save shortcuts**, then reload the dashboard on the phone or tablet. The host opens the target as the Windows user running PTdeck.

On the PC dashboard, click the page dots below the 16-slot app grid. On iPad and wide Android landscape, swipe the app grid or tap its page dots when there are multiple pages.

## Full screen

On Android in Chrome, tap the full-screen icon next to the PC name. Tap it again or use Android Back to exit.

On iPad in Safari, try the full-screen icon. You can also use **Share → Add to Home Screen**, enable **Open as Web App** if shown, and launch from the new icon. Pair again if the Home Screen app asks for a code.

## Compatibility and limitations

- Windows 10 and 11 are target hosts. A clean-install test across both Windows versions is pending.
- iPad Safari and Motorola G Chrome were used during design. Other iOS, iPadOS and Android devices should be checked on their actual browsers. Android 4.0–4.3 compatibility has not been verified.
- Availability of full screen depends on the browser. The dedicated Android landscape layout is selected by the device aspect ratio and orientation.
- Media controls work with players that expose the corresponding Windows media session actions.
- GPU readings require Windows GPU engine counters. A dash indicates unavailable data. Connected Bluetooth devices may supply a name without a battery level. PC battery status requires a reported system battery.
- The calendar is a local month view. It does not sync events.
- Network numbers show the PC's live traffic in Mbps. They are not a speed test.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Page times out | Check that the startup window is still open, use the current network address printed there, and confirm both devices can reach each other. Guest Wi-Fi may isolate clients. |
| Pairing prompt repeats | Get the current six-digit code from the Windows dashboard and allow cookies. Restarting the server generates a fresh code. Existing pairings use a persistent session key. |
| Port is already in use | Stop the existing instance. To use another port, run `set DECK_PORT=8052` and then `Start-Deck.cmd` from Command Prompt. Use the addresses printed by the launcher. |
| Shortcut fails | Check its exact target on the PC and try opening the same target directly in Windows. |
| Wrong display mode | Turn off rotation lock and rotate the device. On a supported wide Android phone, landscape activates the compact layout. |

To stop the host, press **Ctrl+C** in its window. To back up shortcuts and tasks, copy `data/buttons.json` and `data/tasks.json` if present. Keep those backups private.


