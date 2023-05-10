## 4.0.0 (2023-05-10)

* **Breaking change:** Now requires Node v16 (as v14 and older [has reached end-of-life](https://github.com/nodejs/Release))
* **Breaking change:** Is now an ESM module ([see this](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c))
* **Breaking change:** Made private methods actually private
* **Improvements:** Moved to `undici` from `node-fetch`and replaced `nock` with the `MockAgent` in `undici`
* **Improvements:** Added 100% type coverage + generates type declarations for publishing

## 4.0.0-3 (2022-07-13)

* **Breaking change:** Now requires Node v14.18
* **Improvements:** Update `pony-cause` to version with ESM-module
* **Internal:** Updated dev dependencies to latest versions

## 4.0.0-2 (2022-04-24)

* **Fix:** Restore Node 14 compatibility: Replaced the `fetch` implementation from `undici` with its core `request()`, since it only supports `fetch` on Node 16 and later

## 4.0.0-1 (2022-04-24)

* **Breaking change:** Now requires Node v14
* **Breaking change:** Is now an ESM module ([see this](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c))
* **Breaking change:** Made private methods actually private
* **Improvements:** Moved to `undici` from `node-fetch`and replaced `nock` with the `MockAgent` in `undici`
* **Improvements:** Added 100% type coverage + generates type declarations for publishing

## 4.0.0-0 (2020-04-28)

* **Breaking change:** Now requires Node v12 (Twice the Node version!)

## 3.0.0 (2018-01-03)

* **Breaking change:** Old `retrieve()` is now `retrieveRaw()` and new `retrieve()` returns mimicks `publish()` in that it returns the decoded content
* **Improvements:** Updated dev dependencies
* **Improvements:** Updated Travis test targets

## 2.0.0 (2016-10-23)

* **Breaking change:** Now requires Node v6
* **Improvements:** Updated dev dependencies and moved to a Grunt-less, [semistandard](https://github.com/Flet/semistandard)-based setup through [ESLint](http://eslint.org/)
* **Improvements:** Updated Travis definition and test targets
* **Minor:** Added `yarn.lock` to `.gitignore` as this is a library and [libraries don't use lock files](https://github.com/yarnpkg/yarn/issues/838#issuecomment-253362537)

## 1.1.0 (2015-07-21)


#### Features

* **main:** allow custom commit messages ([796a397c](https://github.com/voxpelli/node-github-publish/commit/796a397ce17f7b34595a53c9237f7f1d001b6b13))


### 1.0.1 (2015-07-20)


#### Bug Fixes

* **main:** explicitly support Buffers as input ([c07bd364](https://github.com/voxpelli/node-github-publish/commit/c07bd3646d2fcb29ec45b70d20043073f5204236))


## 1.0.0 (2015-07-17)


#### Bug Fixes

* **main:** limit the result of a retrieve ([afd5d8c7](https://github.com/voxpelli/node-github-publish/commit/afd5d8c7c0daa40d7d2274d4e4296dbfe2cac8c2))


#### Features

* **main:** return the created sha on success ([c215ac6d](https://github.com/voxpelli/node-github-publish/commit/c215ac6d59cfaaf9c25100eb3d02b170d6f708da))


### 0.1.4 (2015-07-07)


### 0.1.3 (2015-07-07)


#### Features

* **main:** retrieve + force publish capabilities ([65186835](https://github.com/bloglovin/node-github-publish/commit/65186835109ea781a3229d8a24f712fdbc2c88ba))
