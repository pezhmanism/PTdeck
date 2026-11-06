# Release checklist

## Verify a clean copy

- [ ] Extract into a writable folder and start the host with Node.js LTS on Windows 10 and Windows 11.
- [ ] Open the PC editor and confirm the pairing code appears. Pair from a second device and verify an unpaired browser cannot retrieve status or launch shortcuts.
- [ ] Verify that switching PC shortcut pages keeps the player in place, including on a partially filled last page.
- [ ] Add a shortcut, reload the device page and launch it. Check both a Windows icon and a fallback tile.
- [ ] Add, complete and delete a task. Browse months and test a calendar with six rows.
- [ ] Check media controls with an active Windows session and the empty player state.
- [ ] Verify GPU, battery and Bluetooth fields on the test PC. Check how missing readings appear.
- [ ] On iPad, test both orientations, page dots, swipe and full screen. On a wide Android phone, test landscape, portrait, full screen and the three widget tabs.
- [ ] Record exact Windows, browser and device versions used.

## Publish on GitHub

1. Create a repository named `ptdeck`. Commit the contents of this directory at the repository root.
2. Review the license and ownership line before publishing.
3. Add screenshots using the [capture checklist](screenshots/README.md), then uncomment the image links in the root README.
4. Confirm the staged file list excludes `data/`, logs, archives and personal files.
5. After the clean-copy checks, tag the first release `v0.1.0` and use the changelog for the GitHub release notes.


