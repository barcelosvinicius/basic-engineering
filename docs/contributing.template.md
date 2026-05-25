# How to Contribute — [PROJECT]

> Thank you for contributing! Read this guide before opening a PR.

## Environment setup

<!-- CUSTOMIZE -->
```bash
# Prerequisites
[list: Node.js, Java, Docker, etc.]

# Setup
git clone [url]
cd [project]
cp .env.example .env
# Fill .env with development values

# Start environment
[command to start the stack]
```

## Contribution flow

```
1. Open an issue describing the change
2. Wait for discussion and approval (for large changes)
3. Create a branch: git checkout -b feature/RF-XX-description
4. Implement and write tests
5. Ensure CI passes locally
6. Open a PR using the template
7. Wait for code review
8. Incorporate feedback and merge
```

## Commit standards (Conventional Commits)

```
feat(scope): add feature X
fix(scope): fix bug Y
docs(scope): update documentation Z
test(scope): add tests for W
refactor(scope): extract logic from V into service
chore(deps): update dependency X to v2.0
ci: add coverage step to the pipeline
```

## PR acceptance criteria

- [ ] Tests passing (green CI)
- [ ] Code coverage ≥ project target
- [ ] No new lint warnings
- [ ] Documentation updated if needed
- [ ] PR template completed
- [ ] At least 1 reviewer approval

## Reporting bugs

Use the bug report template at `.github/ISSUE_TEMPLATE/bug-report.yml`.

Required information:
- Steps to reproduce
- Expected vs current behavior
- Relevant screenshots or logs
- System version

## Code of conduct

<!-- CUSTOMIZE -->
This project maintains a respectful and collaborative environment.
Constructive technical feedback is always welcome.
Disrespectful behavior will not be tolerated.
