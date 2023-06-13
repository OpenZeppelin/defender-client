# Defender Client Packages

[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/OpenZeppelin/defender-client/badge)](https://api.securityscorecards.dev/projects/github.com/OpenZeppelin/defender-client)
[![OpenSSF Best Practices](https://bestpractices.coreinfrastructure.org/projects/7395/badge)](https://bestpractices.coreinfrastructure.org/projects/7395)
[![Scorecard supply-chain security](https://github.com/OpenZeppelin/defender-client/actions/workflows/scorecard.yml/badge.svg)](https://github.com/OpenZeppelin/defender-client/actions/workflows/scorecard.yml)
[![Stable Git Release](https://github.com/OpenZeppelin/defender-client/actions/workflows/stable.yml/badge.svg)](https://github.com/OpenZeppelin/defender/actions/workflows/stable.yml)
[![RC Git Release](https://github.com/OpenZeppelin/defender-client/actions/workflows/rc.yml/badge.svg)](https://github.com/OpenZeppelin/defender/actions/workflows/rc.yml)
[![CI](https://github.com/OpenZeppelin/defender-client/actions/workflows/ci.yml/badge.svg)](https://github.com/OpenZeppelin/defender-client/actions/workflows/ci.yml)
[![SLSA 3](https://slsa.dev/images/gh-badge-level3.svg)](https://slsa.dev)

Monorepo that contains Defender typescript clients. Check out the individual packages for more info:

- [defender-admin-client](packages/admin)
- [defender-autotask-client](packages/autotask-client)
- [defender-autotask-utils](packages/autotask-utils)
- [defender-kvstore-client](packages/kvstore)
- [defender-relay-client](packages/relay)
- [defender-sentinel-client](packages/sentinel)

## Development Setup

Checkout the repo and run `yarn && yarn build`.

## Testing

Run `yarn test` to run unit tests across all packages.

## Linting

Run `yarn lint` at the project root.

## Publish

### Defender Client

> We Use `lerna` for publishing a new version of all Defender Client packages (excludes Platform Deploy Client as it is versioned separately).

- We use github actions for CI/CD to tag, release & publish the packages. See details about workflows below.

### Platform Deploy Client

Change to the `packages/deploy` directory, login to npm, and publish using the native `yarn publish` command as shown below. We are not tagging versions for the time being as they conflict with previous Defender Client releases. Note this process is being introduced for the Platform Deploy Client v0 release, but will be migrated to a new Platform Client-specific repository.

To prepare a publish:

```bash
npm login
cd packages/deploy
git checkout master
git pull origin master
yarn build
```

To publish a release candidate:

```
yarn publish --new-version <version> --tag next # version should be of format 0.5.1-rc.1
```

And to publish the final release:

```
yarn publish --no-git-tag-version
# enter new version at prompt
git add package.json
git commit -m 'Bump Platform Deploy Client version to {version here}'
git push origin master
```

## Examples

The `examples` repo has sample code for both clients. Note that most examples rely on dotenv for loading API keys and secrets. Note that you can set the following environment variables to control to which instance your client will connect to, which is useful for testing against your Defender development instance:

```bash
# Example config
# relay signer
DEFENDER_RELAY_SIGNER_API_URL=
DEFENDER_RELAY_SIGNER_POOL_ID=
DEFENDER_RELAY_SIGNER_POOL_CLIENT_ID=
# relay client
DEFENDER_RELAY_API_URL=
DEFENDER_RELAY_POOL_ID=
DEFENDER_RELAY_POOL_CLIENT_ID=
# admin client
DEFENDER_ADMIN_API_URL=
DEFENDER_ADMIN_POOL_ID=
DEFENDER_ADMIN_POOL_CLIENT_ID=
# autotask client
DEFENDER_AUTOTASK_API_URL=
DEFENDER_AUTOTASK_POOL_ID=
DEFENDER_AUTOTASK_POOL_CLIENT_ID=
# sentinel client
DEFENDER_SENTINEL_API_URL=
DEFENDER_SENTINEL_POOL_ID=
DEFENDER_SENTINEL_POOL_CLIENT_ID=
```

---

### CI/CD

- We use github actions for CI/CD. See [workflows](.github/workflows) for more info.
  - `ci.yml` - runs on every push to any branch --> runs tests.
  - `rc.yml` - runs on every push to master --> creates a rc tag --> creates a pre-release draft.
  - `stable.yml` - Manual trigger workflow --> creates a stable tag --> creates a latest release --> publishes to npm.
  - `release.yml` - Manual trigger workflow --> create a git release for a given tag.
  - `publish.yml` - Manual trigger workflow ( for any given tag ) --> publishes to npm.

---

### Determinstic Builds & Secure Publishes

- We use [slsa framework](https://slsa.dev/) _pronounced "salsa"_ for reproducible builds & secure pushes. Verification is done using [provenance](https://slsa.dev/provenance/v1)

---

### Known Issues [Resolution in progress]

- `lerna publish` with github actions fails due to npm permission issues due to using 2fa. Currently we use `NPM_TOKEN` in github actions which throws forbidden error. To overcome we use 2fa from local machine to publish the packages.
