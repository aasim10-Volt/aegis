# Contributing to AEGIS

Thanks for helping with AEGIS. This guide keeps the work consistent while the project is still small.

## Before you start

The prototype is a single HTML file, so most changes are easy to test. Open `aegis-platform-v2.html` in a browser, make your change, and refresh. There is no build step to wait on.

## Branches

Use short, descriptive branch names with a prefix:

- `feature/` for new work, for example `feature/appeals-modal`
- `fix/` for bug fixes
- `docs/` for documentation
- `chore/` for tooling and cleanup

## Commits

Keep commit messages clear and in the present tense. A short summary line is enough for most changes.

```
Add keyboard support to the notifications panel
Fix sidebar drawer not closing on mobile
Update setup guide with local server steps
```

## Pull requests

Before opening a pull request, check that:

- The page still loads with no console errors
- The change works on mobile width, not just desktop
- New buttons and controls do something and give the user feedback
- You did not introduce new colours outside the existing palette
- Animations are subtle and do not block interaction
- Any new interactive element is reachable with the keyboard and has a label

Describe what changed and why. Screenshots help for anything visual.

## Code style

- Keep the colour palette as it is. The tokens are defined at the top of the stylesheet.
- Reuse the existing classes (`card`, `btn`, `tag`, `stat-card`, and so on) instead of writing one-off styles.
- Keep JavaScript functions small and named for what they do.
- Avoid adding a second animation library. The project uses anime.js, and adding more would hurt load time for little gain.
- Respect `prefers-reduced-motion`. Animations should not run for users who opt out.

## Reporting issues

Open an issue with steps to reproduce, what you expected, and what happened. Note the browser and whether you were on mobile or desktop.
