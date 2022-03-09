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

Use `lerna` for publishing a new version of all packages. 

The following publishes a release candidate with the npm tag `next`:

```
yarn run lerna publish v1.3.0-rc.4 --preid rc --dist-tag next --pre-dist-tag next --exact
```

And to publish the final release:

```
yarn run lerna publish --exact
```

## Examples

The `examples` repo has sample code for both clients. Note that most examples rely on dotenv for loading API keys and secrets. Note that you can set the following environment variables to control to which instance your client will connect to, which is useful for testing against your Defender development instance:

```
# Example config for the staging stack
DEFENDER_RELAY_API_URL=https://rjabxxgll8.execute-api.us-east-1.amazonaws.com/stg/
DEFENDER_RELAY_POOL_ID=us-east-1_fUC95KvPl
DEFENDER_RELAY_POOL_CLIENT_ID=jj6l7lk0mqaqndip1uk8c25l1
DEFENDER_ADMIN_API_URL=https://9j6aedbm6j.execute-api.us-east-1.amazonaws.com/stg/
DEFENDER_ADMIN_POOL_ID=us-east-1_pvjTSNl94
DEFENDER_ADMIN_POOL_CLIENT_ID=1ogvjnp52dd8p8mk2a7cdnj04e
DEFENDER_AUTOTASK_API_URL=https://9j6aedbm6j.execute-api.us-east-1.amazonaws.com/stg/
DEFENDER_AUTOTASK_POOL_ID=us-east-1_pvjTSNl94
DEFENDER_AUTOTASK_POOL_CLIENT_ID=1ogvjnp52dd8p8mk2a7cdnj04e
DEFENDER_SENTINEL_API_URL=https://9j6aedbm6j.execute-api.us-east-1.amazonaws.com/stg/
DEFENDER_SENTINEL_POOL_ID=us-east-1_pvjTSNl94
DEFENDER_SENTINEL_POOL_CLIENT_ID=1ogvjnp52dd8p8mk2a7cdnj04e
```
