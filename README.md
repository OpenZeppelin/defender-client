# Defender Clients

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

Use `lerna` for publishing a new version of all Defender Client packages (excludes Platform Deploy Client as it is versioned separately).

The following publishes a release candidate with the npm tag `next`:

```
yarn run lerna publish v1.3.0-rc.4 --preid rc --dist-tag next --pre-dist-tag next --exact
```

And to publish the final release:

```
yarn run lerna publish --exact --force-publish
```

### Platform Deploy Client

Change to the `packages/deploy` directory, login to npm, and publish using the native `yarn publish` command as shown below. We are not tagging versions for the time being as they conflict with previous Defender Client releases. Note this process is being introduced for the Platform Deploy Client v0 release, but will be migrated to a new Platform Client-specific repository.

```
npm login
cd packages/deploy
git checkout master
git pull origin master
yarn publish --no-git-tag-version
# enter new version at prompt
git add package.json
git commit -m 'Bump Platform Deploy Client version to {version here}'
git push origin master
```

## Examples

The `examples` repo has sample code for both clients. Note that most examples rely on dotenv for loading API keys and secrets. Note that you can set the following environment variables to control to which instance your client will connect to, which is useful for testing against your Defender development instance:

```
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
