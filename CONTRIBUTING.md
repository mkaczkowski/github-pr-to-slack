# Contributing to GitHub PR to Slack

Thank you for considering contributing to GitHub PR to Slack! This document outlines the process for contributing to this project.

## Code of Conduct

By participating in this project, you are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md).

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report. Following these guidelines helps maintainers understand your report, reproduce the behavior, and find related reports.

Before creating bug reports, please check [the issue list](https://github.com/mkaczkowski/github-pr-to-slack/issues) as you might find that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title** for the issue to identify the problem.
- **Describe the exact steps which reproduce the problem** in as many details as possible.
- **Provide specific examples to demonstrate the steps**. Include links to files or GitHub projects, or copy/pasteable snippets, which you use in those examples.
- **Describe the behavior you observed after following the steps** and point out what exactly is the problem with that behavior.
- **Explain which behavior you expected to see instead and why.**
- **Include screenshots and animated GIFs** which show you following the described steps and clearly demonstrate the problem.
- **If the problem wasn't triggered by a specific action**, describe what you were doing before the problem happened.

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion, including completely new features and minor improvements to existing functionality.

- **Use a clear and descriptive title** for the issue to identify the suggestion.
- **Provide a step-by-step description of the suggested enhancement** in as many details as possible.
- **Provide specific examples to demonstrate the steps**. Include copy/pasteable snippets which you use in those examples.
- **Describe the current behavior** and **explain which behavior you expected to see instead** and why.
- **Include screenshots and animated GIFs** which help you demonstrate the steps or point out the part of the extension which the suggestion is related to.
- **Explain why this enhancement would be useful** to most users.

### Pull Requests

- Fill in the required template
- Do not include issue numbers in the PR title
- Include screenshots and animated GIFs in your pull request whenever possible
- Follow the [JavaScript](#javascript-styleguide) and [CSS](#css-styleguide) styleguides
- Include thoughtfully-worded, well-structured tests
- Document new code
- End all files with a newline

You do not need to bump the version or edit `CHANGELOG.md` in your pull request.
Maintainers do both when cutting a release, so that a version number is only
claimed once the release is actually published.

## Development Process

### Setting Up the Development Environment

1. Fork the repository
2. Clone your fork: `git clone https://github.com/mkaczkowski/github-pr-to-slack.git`
3. Install dependencies: `npm install`
4. Build the extension: `npm run build`
5. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` directory

### Development Workflow

1. Create a new branch for your feature or bugfix: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Run tests: `npm test`
4. Build the extension: `npm run build`
5. Test your changes in Chrome
6. Commit your changes with a descriptive commit message
7. Push to your fork: `git push origin feature/your-feature-name`
8. Submit a pull request

### Releasing

Releases are cut by maintainers. The process, covering the version bump, the
changelog entry, packaging the store archive with `npm run package`, and
publishing the tag, is documented in the
[Releasing section of the README](README.md#releasing).

## Styleguides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

### JavaScript Styleguide

All JavaScript code is linted with [ESLint](https://eslint.org/) and formatted with [Prettier](https://prettier.io/).

- Use 2 spaces for indentation
- Prefer the object spread operator (`{...anotherObj}`) to `Object.assign()`
- Prefer arrow functions over function expressions
- Use template literals instead of string concatenation
- Prefer destructuring from arrays and objects
- Use meaningful variable names

### CSS Styleguide

- Use 2 spaces for indentation
- Use dashes instead of camelCasing in class names
- Use BEM naming convention for classes
- Avoid using IDs for styling
- Use variables for colors and other repeated values

## Additional Notes

### Issue and Pull Request Labels

This section lists the labels we use to help us track and manage issues and pull requests.

- `bug` - Issues that are bugs
- `documentation` - Issues or PRs related to documentation
- `duplicate` - Issues that are duplicates of other issues
- `enhancement` - Issues that are feature requests
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `invalid` - Issues that are invalid or non-reproducible
- `question` - Issues that are questions
- `wontfix` - Issues that won't be fixed

Thank you for contributing to GitHub PR to Slack!
