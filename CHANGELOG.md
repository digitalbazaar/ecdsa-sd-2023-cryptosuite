# @digitalbazaar/ecdsa-sd-2023-cryptosuite Changelog

## 1.1.0 - 2023-08-dd

### Changed
- Use `@digitalbazaar/di-sd-primitives@3`. Existing use cases that worked
  before should continue to work, but the new primitives support more
  use cases, such as better selection of items within arrays.

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
