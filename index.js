/* jshint node: true */

'use strict';

const fetch = require('node-fetch');
const VError = require('verror');

const GitHubPublisher = function (token, user, repo, branch) {
  this.token = token;
  this.user = user;
  this.repo = repo;
  this.branch = branch;
};

GitHubPublisher.prototype.getBaseHeaders = function () {
  return {
    'authorization': 'Bearer ' + this.token,
    'accept': 'application/vnd.github.v3+json',
    'user-agent': this.user
  };
};

GitHubPublisher.prototype.getRequest = function (path) {
  const options = {
    method: 'GET',
    headers: Object.assign({}, this.getBaseHeaders())
  };

  let url = 'https://api.github.com' + path;

  if (this.branch) {
    url += '?ref=' + encodeURIComponent(this.branch);
  }

  return fetch(url, options);
};

GitHubPublisher.prototype.putRequest = function (path, data) {
  const options = {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: Object.assign({
      'content-type': 'application/json'
    }, this.getBaseHeaders())
  };

  const url = 'https://api.github.com' + path;

  return fetch(url, options);
};

GitHubPublisher.prototype.base64 = function (text) {
  const data = text instanceof Buffer ? text : new Buffer(text);
  return data.toString('base64');
};

GitHubPublisher.prototype.getPath = function (file) {
  return '/repos/' + this.user + '/' + this.repo + '/contents/' + file;
};

GitHubPublisher.prototype.retrieve = function (file) {
  return this.getRequest(this.getPath(file))
    .then(res => res.ok ? res.json() : false)
    .then(res => res ? { content: res.content, sha: res.sha } : res);
};

GitHubPublisher.prototype.publish = function (file, content, options) {
  const that = this;
  const optionsType = typeof options;

  // Legacy support
  if (optionsType === 'string') {
    options = { sha: options };
  } else if (optionsType === 'boolean') {
    options = { force: options };
  } else {
    options = Object.assign({}, options || {});
  }

  const data = {
    message: options.message || 'new content',
    content: this.base64(content)
  };

  if (options.sha) {
    data.sha = options.sha;
  }

  if (this.branch) {
    data.branch = this.branch;
  }

  return this.putRequest(this.getPath(file), data)
    .then(res => {
      if (!res.ok && res.status === 422 && options.force === true) {
        return this.retrieve(file)
          .then(currentData => {
            delete options.force;
            options.sha = currentData.sha;
            return currentData && currentData.sha ? that.publish(file, content, options) : false;
          });
      }
      return res.json()
        .then(body => ({
          ok: res.ok,
          body: body
        }));
    })
    .then(res => {
      if (res.ok === false) {
        // Only reason to not return "res.ok" directly in the previous step is to get some debugging capabilities.
        // This is only temporary – should either be based on a Bunyan-like logger och simplify it by removing it
        console.log('GitHub Error', res.body);
        return false;
      }
      return res.ok === undefined ? res : res.body.content.sha;
    })
    .catch(err => Promise.reject(new VError(err, 'Failed to call GitHub')));
};

module.exports = GitHubPublisher;
