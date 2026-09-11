# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-09-11

Versions 1.2.2 and 1.2.3 were bumped in the repository but never published, so
their changes ship here as part of 1.3.0.

### Added

- Author line in the Slack message, so the preview names who opened the PR.

### Fixed

- Reviewer names are read from the PR's reviewers list rather than a broader
  page lookup, which previously pulled in entries that were not reviewers.
- Reviewers and authors rendered by GitHub as `Display Name (username)` are now
  resolved to the handle alone, so mentions stay `@username` instead of the
  display name and handle concatenated together. The handle is taken from the
  profile link or hovercard URL where available, falling back to the visible
  text.
- Messaging between the content script and the background service worker is
  reliable again; the popup no longer fails silently when the worker has been
  suspended.
- A failed Slack configuration check is reported as a failure instead of being
  shown as "not configured", which previously hid the real error.

## [1.2.1] - 2025-03-09

Initial public release tracked in this changelog. See the
[v1.2.1 release](https://github.com/mkaczkowski/github-pr-to-slack/releases/tag/v1.2.1)
for details.

[1.3.0]: https://github.com/mkaczkowski/github-pr-to-slack/compare/v1.2.1...v1.3.0
[1.2.1]: https://github.com/mkaczkowski/github-pr-to-slack/releases/tag/v1.2.1
