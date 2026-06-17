# Releasing @chamoux/diorama

## One-time setup

1. **npm account + 2FA.** Create an account as `chamoux` at https://www.npmjs.com/signup,
   verify your email, then enable 2FA in publish mode:
   ```bash
   npm login
   npm profile enable-2fa auth-and-writes
   ```
   Save the recovery codes.

2. **First publish (manual, required before OIDC).** Scoped packages default to private,
   and a published version is a prerequisite for trusted publishing:
   ```bash
   pnpm --filter @chamoux/diorama build
   cd packages/diorama && npm publish --access public
   ```

3. **Register the GitHub Trusted Publisher.** On npmjs.com → `@chamoux/diorama` →
   Settings → Trusted Publisher → add a GitHub Actions publisher:
   - Organization / user: `chamoux`
   - Repository: `diorama`
   - Workflow filename: `publish.yml`

   After this, CI publishes with no token and provenance is automatic.

## Every release

1. Make sure `main` is green:
   ```bash
   pnpm --filter @chamoux/diorama test
   ```
2. Bump the version (creates a commit + tag). Stay pre-1.0 until the API is frozen:
   ```bash
   pnpm --filter @chamoux/diorama exec npm version patch   # or: minor
   ```
3. Push with tags:
   ```bash
   git push --follow-tags
   ```
4. The `v*` tag triggers `.github/workflows/publish.yml`, which builds, tests, and
   publishes via OIDC trusted publishing (provenance is automatic).
5. Verify:
   ```bash
   npm view @chamoux/diorama version
   npm audit signatures
   ```

## Pre-releases

Bump to e.g. `0.1.0-beta.0` and publish with an explicit tag so it stays off `latest`:

```bash
npm publish --tag next
```
