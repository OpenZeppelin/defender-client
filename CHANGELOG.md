# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## 1.2.1 (2021-11-16)

### Added

- Add API support for sentinels

## 1.2.0 (2020-12-10)

### Added

- `gasPrice` and `validUntil` are supported for a transaction send request

## 1.1.1 (2020-11-30)

### Added

- JSON RPC query endpoint

## 1.1.0 (2020-11-26)

### Added

- Add support for new json rpc Defender endpoint

## 1.0.1 (2020-11-04)

### Fixed

- Fix issue introduced by aws cognito auth library update

## 1.0.0 (2020-11-04)

### Added

- Add support for the `getRelayer` method to retrieve a relayer's info
- Support `from`less DefenderRelaySigner using `getRelayer` API

## 0.2.8 (2020-26-10)

### Fixed

- Fix README

## 0.2.7 (2020-23-10)

### Added

- Renew Id token upon expiration

### Changed

- Better error message for Relayer Params

### Fixed

- Handle initialization errors correctly

## 0.2.6 (2020-12-09)

### Fixed

- Change node-fetch import to work correctly with webpack bundling

## 0.2.5 (2020-10-09)

### Added

- Support no credentials autotasks relayer

## 0.1.0 (2020-07-20))

### Added

- Initial release
