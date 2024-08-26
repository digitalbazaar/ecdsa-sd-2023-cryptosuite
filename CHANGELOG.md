# @digitalbazaar/ecdsa-sd-2023-cryptosuite Changelog

## 3.4.1 - 2024-08-26

### Fixed
- Use `@digitalbazaar/di-sd-primitives@3.0.4` to get latest bug fixes.

## 3.4.0 - 2024-08-17

### Added
- Add `createConfirmCryptosuite()` to enable confirming base proofs.

## 3.3.0 - 2024-08-17

### Added
- Allow a different required algorithm (non-default) to be specified
  when creating sign and verify suites.

## 3.2.1 - 2024-01-30

### Fixed
- Encode `Map` objects in CBOR using the Map tag, not the object tag.

## 3.2.0 - 2024-01-17

### Added
- Support proof encodings that use CBOR tag 64 for Uint8Array instead
  of simpler major type 2 byte string.

## 3.1.2 - 2024-01-12

### Fixed
- Ensure promise is awaited when finding matching proof for disclosure.

## 3.1.1 - 2024-01-11

### Fixed
- Fix typo in `mandatoryIndexes` validation error message.

## 3.1.0 - 2023-11-15

### Changed
- Update dependencies:
  - Use `cborg@4`.

## 3.0.1 - 2023-11-13

### Fixed
- Fix bug where a single matching proof would be rejected
  during disclosure if non-matching proofs were also
  present.

## 3.0.0 - 2023-11-13

### Changed
- **BREAKING**: Use `data-integrity` v2 context.
- Use `@digitalbazaar/data-integrity@2.0` and
  `@digitalbazaar/data-integrity-context@2.0` in test.

## 2.0.1 - 2023-08-23

### Fixed
- Fix key encoding bug.

## 2.0.0 - 2023-08-15

### Changed
- **BREAKING**: Require node 18+.
- Use `@digitalbazaar/di-sd-primitives@3`. Existing use cases that worked
  before should continue to work, but the new primitives support more
  use cases, such as better selection of items within arrays.
- Removed now unnecessary special treatment of VCs with `credentialSubject`
  that is not an object.

## 1.0.2 - 2023-05-21

### Fixed
- Ensure label map is properly compressed.

## 1.0.1 - 2023-05-19

### Fixed
- Ensure non-mandatory indexes are shifted by mandatory ones.
- Use `@digitalbazaar/di-sd-primitives@2.0.1`.

## 1.0.0 - 2023-05-19

### Added
- Initial version.
