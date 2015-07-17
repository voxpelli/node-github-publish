/* jshint node: true */

'use strict';

var _ = require('lodash');
var fetch = require('node-fetch');
var VError = require('verror');

var GitHubPublisher = function (token, user, repo, branch) {
  this.token = token;
  this.user = user;
  this.repo = repo;
  this.branch = branch;
};

GitHubPublisher.prototype.getBaseHeaders = function () {
  return {
    'authorization': 'Bearer ' + this.token,
    'accept': 'application/vnd.github.v3+json',
    'user-agent': this.user,
  };
};

GitHubPublisher.prototype.getRequest = function (path) {
  var options = {
    method: 'GET',
    headers: _.assign({}, this.getBaseHeaders()),
  };

  var url = 'https://api.github.com' + path;


  if (this.branch) {
    url += '?ref=' + encodeURIComponent(this.branch);
  }

  return fetch(url, options);
};

GitHubPublisher.prototype.putRequest = function (path, data) {
  var options = {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: _.assign({
      'content-type': 'application/json',
    }, this.getBaseHeaders()),
  };

  var url = 'https://api.github.com' + path;

  return fetch(url, options);
};

GitHubPublisher.prototype.base64 = function (text) {
  var data = new Buffer(text);
  return data.toString('base64');
};

GitHubPublisher.prototype.getPath = function (file) {
  return '/repos/' + this.user + '/' + this.repo + '/contents/' + file;
};

GitHubPublisher.prototype.retrieve = function (file) {
  return this.getRequest(this.getPath(file))
    .then(function (res) {
      return res.ok ? res.json() : false;
    })
    .then(function (res) {
      return res ? _.pick(res, ['content', 'sha']) : res;
    });
};

GitHubPublisher.prototype.publish = function (file, content, force) {
  var that = this;
  var data = {
    message: 'new content',
    content: this.base64(content),
  };

  if (_.isString(force)) {
    data.sha = force;
  }

  if (this.branch) {
    data.branch = this.branch;
  }

  return this.putRequest(this.getPath(file), data)
    .then(function (res) {
      if (!res.ok && res.status === 422 && force === true) {
        return that.retrieve(file)
          .then(function (currentData) {
            return currentData && currentData.sha ? that.publish(file, content, currentData.sha) : false;
          });
      }
      return res.json().then(function (body) {
        return {
          ok: res.ok,
          body: body,
        };
      });
    })
    .then(function (res) {
      if (res.ok === false) {
        // Only reason to not return "res.ok" directly in the previous step is to get some debugging capabilities.
        // This is only temporary – should either be based on a Bunyan-like logger och simplify it by removing it
        console.log('GitHub Error', res.body);
        return false;
      }
      return res.ok === undefined ? res : res.body.content.sha;
    })
    .catch(function (err) {
      throw new VError(err, 'Failed to call GitHub');
    });
};

module.exports = GitHubPublisher;
