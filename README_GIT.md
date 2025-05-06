# Git Best Practices

- These are my (@csjcode's) ideas based on how I've worked on other teams.
- Since we didn't have anything I made this (it's a typical workflow to avoid code collisions)
- I'm totally up to changes, but let's discuss first so we can collaborate better.


## Dev Branching instructions

We have a `dev` branch that is used for development and testing, before going to LIVE production.

`dev` branch is where we merge our feature branches (eg. 2025050-fix-credits-page) when approved.

- **Do not** work directly on the `main` branch. Thats what is live, released.
- **Do not** push directly to `main` or `dev` without a Pull Request (PR). This ensures that all changes are reviewed and approved before being merged into the main codebase.
- **Do not** merge your own PRs. Another developer should review and approve the PR before merging.

- If you are working on a new feature, create a branch from `dev` -- not `main`.
- This is to ensure that you are working with the latest code and not on an outdated version of `main`.
- The `dev` branch is where we can test new features before merging them into `main`.

Example of working on new code from dev and then a PR from you feature branch back to dev:

```
git checkout dev  # Switch to dev
git pull origin dev  # Get the latest changes
git checkout -b YYYYMMDD-feature-description  # Create a new branch from dev (use that filename format)
```

Make your changes, then stage and commit them:

```
git add .  # Stage all changes
git commit -m "Added validator page functionality"
```
Push your branch to the remote repository:

```
git push origin YYYYMMDD-feature-description
```

PR: Then go to GitHub and create a Pull Request (PR) from `YYYYMMDD-feature-description` → `dev` .

- Make sure your feature branch is working locally and on the test deployment URL.

Tips:
* Use descriptive commit messages.
* Run `npm run ready` to check for code style issues before committing.

---

### More info on Branching/Updates

- Make a branch from dev for any modifications you make.
- Also, I created a general "dev" branch.
- If making modifications, make a branch off dev with the date in format YYYYMMDD + feature (so it sorts better)
- Like YYYYMMDD-add-validator-page and
- Commit that branch with your work as needed. (YYYYMMDD-add-validator-page)

#### Example of checkout and branching

```
git checkout dev  # Switch to the main branch
git pull origin dev  # Ensure your local main branch is up to date from remote
git checkout -b YYYYMMDD-feature-description  # Create a new branch

example branch name:
`20250411-fix-responsiveness`

use that date format and lower case with dashes is preferred.

```

After making your modifications, stage and commit them (or use your IDE)

```
git add .  # Stage all changes
git commit -m "Added validator page functionality"
```

Push your branch to the remote repository:

```
git push origin YYYYMMDD-feature-description
```

Keep updated regularly:

1. For remote backup
2. So other can see what is going on (they may be working on related code)

### To push LIVE: Pull Request to make things live

- Make sure your feature branch is
  (1) `npm run dev` working locally,
  (2) `npx tsc --noEmit` to confirm no typescript errors (testnet/blog allow `npm run ready` a combo of this and build)
  (3) `npm run lint` to confirm no linting errors
  (4) `npm run test` to confirm all tests are passing
  (5) `npm run build` to confirm compiling on build
  (6) deploy on a test deployment url and it's working remotely.

If all good...

- Push feature branch to remote.

- Go to GitHub,

- Create a Pull Request (PR) from `YYYYMMDD-feature-description` → `dev` (or `main` depending on what we agree for workflow).

We can discuss the best workflow for our git branching, but this is one common way:

- Make a PR to merge into `dev` branch (think of it as a `dev` code review branch) which we can then review, and then merge into main.

- `dev` branch is our review branch. You PR target should be ready to merge your feature branch into `dev`, but do not actually merge until review.

- Another dev should then code review the PR and approve. Reason: so we know what's going on witht he code and don't overwrite each other.

- Then when approved the original dev merges and closes the PR.

#### Notes

- We are using `git merge` **not** `git rebase`. Don't rebase, unless as a team we decide to change merge strategy, it confuses things if people are doing it their own way.

- Before merging, make sure your branch is up to date with the latest changes from main or dev (whichever is the merging target). This avoids conflicts later.
- Manually resolve conflicts



---

Example merge after approval to dev or main main:

```
git checkout dev  # Switch to dev
git pull origin dev  # Get the latest changes
git merge YYYYMMDD-feature-description  # Merge your branch into dev
```

Or if merging into main (after approved in dev and ready for release)

```
git checkout main  # Switch to main
git pull origin main  # Get the latest changes
git YYYYMMDD-feature-description  # Merge your branch
```
