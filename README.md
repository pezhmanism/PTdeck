# PTdeck

Use an iPad or Android phone as a touch dashboard for a Windows PC. Open apps, control supported media sessions and keep system status, a calendar and a to-do list in view.

## Windows downloads

- **Portable ZIP (Windows x64)** — Extract the whole ZIP and run `PTdeck.exe`.
- **Setup EXE (Windows x64)** — Run Setup to install for your Windows account and add a Start menu shortcut.

Both bundles include Node.js and open the PC dashboard in your default browser. The PC header shows the address to open on your phone. Leave the host window open while using the dashboard. See [Windows packaging](docs/WINDOWS-PACKAGING.md) for details.

## Run from source

1. Install [Node.js 24 LTS](https://nodejs.org/en/download) on the Windows PC. A supported Node.js LTS installation and Windows PowerShell are required. There are no npm packages to install.
2. Download and extract the project into a writable folder. Double-click `Start-Deck.cmd` and leave the window open. If Windows Firewall asks, allow access on your trusted private network.
3. On the PC, open [http://127.0.0.1:8050/](http://127.0.0.1:8050/). Find the six-digit code to the right of **Edit shortcuts**.
4. On your phone or tablet, open the address under **Open on your phone** in the PC dashboard. Both devices need to be on the same trusted network. Enter the six-digit code when prompted.

## Features

| Area | What you can do |
| --- | --- |
| App deck | Add up to 100 Windows shortcuts from the PC editor. The PC dashboard displays 16 borderless shortcuts per page above a player that stays in place. The dashboard uses Windows icons when available and falls back to letter tiles. |
| iPad | Four-by-four app pages, a fixed player and a sidebar with system metrics, calendar and tasks. |
| Wide Android | The landscape layout for phones around 20:9 shows 12 shortcuts per page and tabs for the calendar, tasks and Bluetooth. Android portrait uses a scrolling layout with borderless app icons. |
| Media | See the active Windows media session and use its play, pause and skip controls when supported by the player. |
| PC status | See the PC name and IP, CPU, RAM, GPU, network activity and host battery when available. Network rates reflect PC traffic. |
| Calendar and tasks | Browse a monthly calendar and manage a shared to-do list stored on the PC. |
| Bluetooth | See connected devices and battery percentages when Windows reports them. |

## Screenshots

[Screen capture checklist](docs/screenshots/README.md)

<!-- Add screenshots here after placing the files in docs/screenshots.
![iPad landscape dashboard](docs/screenshots/ipad-landscape.png)
![Motorola G landscape dashboard](docs/screenshots/moto-g-landscape.png)
![Motorola G portrait dashboard](docs/screenshots/moto-g-portrait.png)
-->

## Compatibility

Windows 10 and 11 are the intended hosts. The dashboard was developed on Windows and tried on an iPad and a Motorola G. See the [compatibility notes](docs/USER-GUIDE.md#compatibility-and-limitations) for unverified browser versions and device-dependent features.

Run PTdeck on a trusted local network. Keep port 8050 off the public internet. See [Security](SECURITY.md) for the access model and data storage.

## Documentation

- [User guide and troubleshooting](docs/USER-GUIDE.md)
- [Architecture and maintenance](docs/ARCHITECTURE.md)
- [Release and screenshot checklist](docs/RELEASING.md)
- [Contribution guide](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

## Credit

The dashboard concept was inspired by [OldPhoneDeck](https://github.com/GLAUCOMA82/OldPhoneDeck) by GLAUCOMA82. PTdeck uses its own Windows host and dashboard implementation.




