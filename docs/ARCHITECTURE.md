# Architecture

The Windows host is a dependency-free Node.js HTTP server. It serves a single HTML dashboard with CSS and browser JavaScript. One host shares its configuration and to-do list across paired clients.

| File | Responsibility |
| --- | --- |
| `server.cjs` | HTTP routes, pairing, shortcut validation and launch, telemetry caching and local state |
| `index.html` | Dashboard, shortcut editor, pairing UI and adaptive layouts |
| `status.ps1` | Windows media sessions, system power, network counters, internet status and GPU engine metrics |
| `bluetooth.ps1` | Connected Bluetooth device enumeration and reported battery levels |
| `icon.ps1` | Windows icon extraction, requesting up to 256-pixel PNGs |
| `Start-Deck.cmd` | Launch from Explorer or Command Prompt |

The host queries status every four seconds and Bluetooth roughly every 20 seconds. The browser fetches status from the host. The GPU card uses the busiest engine's utilization after grouping process counters by engine. App icons are cached in memory for the lifetime of the process.

The dashboard switches layouts using device and viewport information. iPad and wide Android landscape paginate shortcuts independently. Windows local administration uses the loopback address. Regular clients pair with a six-digit code and receive a session cookie.

Runtime files live in `data/` next to the launcher. See [Security](../SECURITY.md) before copying or packaging that directory.

