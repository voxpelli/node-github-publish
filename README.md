# GitHub Publish

[![npm version](https://img.shields.io/npm/v/github-publish.svg?style=flat)](https://www.npmjs.com/package/github-publish)
[![npm downloads](https://img.shields.io/npm/dm/github-publish.svg?style=flat)](https://www.npmjs.com/package/github-publish)
[![Module type: ESM](https://img.shields.io/badge/module%20type-esm-brightgreen)](https://github.com/voxpelli/badges-cjs-esm)
[![Types in JS](https://img.shields.io/badge/types_in_js-yes-brightgreen)](https://github.com/voxpelli/types-in-js)
[![neostandard javascript style](https://img.shields.io/badge/code_style-neostandard-7fffff?style=flat&labelColor=ff80ff)](https://github.com/neostandard/neostandard)
[![Follow @voxpelli@mastodon.social](https://img.shields.io/mastodon/follow/109247025527949675?domain=https%3A%2F%2Fmastodon.social&style=social)](https://mastodon.social/@voxpelli)

Publishes a file to a repository through the GitHub Contents API

## Installation

### NPM
```bash
npm install github-publish
```

## Current status

**Stable, but not feature complete**

Currently missing support for deletes.

## Usage

```javascript
import { GitHubPublisher } from 'github-publish';

const publisher = new GitHubPublisher('token123', 'voxpelli', 'voxpelli.github.com');

const result = await publisher.publish('_post/2015-07-17-example-post.md', 'file content');

// If "result" is truthy then the post was successfully published
```

## Classes

* **GitHubPublisher(token, username, repo, [branch])** – creates a publisher object with an [access token](https://developer.github.com/v3/#authentication) for the GitHub API, the `username` of the owner of the repository to publish to and the name of the repository itself as `repo`.

## `GitHubPublisher` methods

* **retrieve(filename)** – returns a `Promise` that resolves with either an object containing the `content` and `sha` of the existing file or with `false` if no such file exists in the repository
* **publish(filename, content, [options])** – publishes the specified `content` as the `filename` to the `repo` of the publisher object. `content` should be either a `string` or a `Buffer`. Returns a `Promise` which resolves to the `sha` of the created object on success and to `false` on failure (failure is likely caused by a collision with a pre-existing file, as long as one haven't specified that it should be overridden).

## `publish()` options

* **force** – whether to replace any pre-existing file no matter what
* **message** – a custom commit message. Default is `new content`
* **sha** – the sha of an existing file that one wants to replace
