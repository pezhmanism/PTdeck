# Contributing

Open an issue with the host Windows version, Node.js version, client device and browser. Include orientation, full-screen state and concise reproduction steps for layout bugs. Mask private information in screenshots and logs.

Run locally with `node server.cjs`. Use `node --check server.cjs` to check the host script. Test edits in the desktop view, iPad landscape and wide Android landscape and portrait. Keep the app usable when Windows cannot provide a telemetry field or icon. Check the [release test matrix](docs/RELEASING.md) for end-to-end checks.

Keep personal runtime files under `data/` out of commits. See [Architecture](docs/ARCHITECTURE.md) for the source layout.

