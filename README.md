# GitHub Publish

[![Build Status](https://travis-ci.org/voxpelli/node-github-publish.svg?branch=master)](https://travis-ci.org/voxpelli/node-github-publish)
[![Coverage Status](https://coveralls.io/repos/voxpelli/node-github-publish/badge.svg)](https://coveralls.io/r/voxpelli/node-github-publish)
[![Dependency Status](https://gemnasium.com/voxpelli/node-github-publish.svg)](https://gemnasium.com/voxpelli/node-github-publish)

Publishes a file to a repository through the GitHub Contents API

## Requirements

Requires io.js or Node 0.12

## Installation

```bash
npm install github-publish --save
```

## Current status

**Stable, but not feature complete**

Currently missing support for deletes.

## Usage

```javascript
var GitHubPublisher = require('github-publish');

var publisher = new GitHubPublisher('token123', 'voxpelli', 'voxpelli.github.com');

publisher.publish('_post/2015-07-17-example-post.md', 'file content').then(function (result) {
  // If "result" is truthy then the post was successfully published
});
```

## Classes

* **GitHubPublisher(token, username, repo)** – creates a publisher object with an [access token](https://developer.github.com/v3/#authentication) for the GitHub API, the `username` of the owner of the repository to publish to and the name of the repository itself as `repo`.

## `GitHubPublisher` methods

* **retrieve(filename)** – returns a `Promise` that resolves with either an object containing the `content` and `sha` of the existing file or with `false` if no such file exists in the repository
* **publish(filename, content, [options])** – publishes the specified `content` as the `filename` to the `repo` of the publisher object. `content` should be either a `string` or a `Buffer`. Returns a `Promise` which resolves to the `sha` of the created object on success and to `false` on failure (failure is likely caused by a collision with a pre-existing file, as long as one haven't specified that it should be overridden).

## `publish()` options

* **force** – whether to replace any pre-existing file no matter what
* **message** – a custom commit message. Default is `new content`
* **sha** – the sha of an existing file that one wants to replace
