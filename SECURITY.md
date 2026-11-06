# Security

PTdeck is intended for a trusted LAN. It listens on the PC's network interfaces and serves plain HTTP. Traffic, including the pairing code and session cookie, can be observed by someone able to monitor that network. Do not port-forward the service or publish it through a tunnel. Use private-network firewall rules.

A six-digit code pairs a browser. Attempts are rate-limited, and a server restart changes the code. A paired browser can launch configured shortcuts, control the current media session, read status and modify the shared task list. Shortcut configuration and access to the pairing code are restricted to the PC dashboard at the loopback address.

The host creates `data/key`, which is a persistent session secret. It also stores custom shortcuts in `data/buttons.json` and tasks in `data/tasks.json` when saved. Do not commit or distribute this directory. To revoke all pairings, stop the host, remove only `data/key`, then start the host and pair trusted devices again.

Report suspected vulnerabilities privately to the repository maintainer. Include the version and reproduction steps. Omit pairing codes, session keys and personal device information from public issues.

