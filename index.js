'use strict';

const fetch = require('node-fetch');

class GitHubPublisher {
  constructor (token, user, repo, branch) {
    this.token = token;
    this.user = user;
    this.repo = repo;
    this.branch = branch;
  }

  getBaseHeaders () {
    return {
      authorization: 'Bearer ' + this.token,
      accept: 'application/vnd.github.v3+json',
      'user-agent': this.user
    };
  }

  getRequest (path) {
    const options = {
      method: 'GET',
      headers: Object.assign({}, this.getBaseHeaders())
    };

    let url = 'https://api.github.com' + path;

    if (this.branch) {
      url += '?ref=' + encodeURIComponent(this.branch);
    }

    return fetch(url, options);
  }

  putRequest (path, data) {
    const options = {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: Object.assign({
        'content-type': 'application/json'
      }, this.getBaseHeaders())
    };

    const url = 'https://api.github.com' + path;

    return fetch(url, options);
  }

  base64 (text) {
    const data = text instanceof Buffer ? text : Buffer.from(text);
    return data.toString('base64');
  }

  base64decode (text) {
    return Buffer.from(text, 'base64').toString('utf8');
  }

  getPath (file) {
    return '/repos/' + this.user + '/' + this.repo + '/contents/' + file;
  }

  async retrieveRaw (file) {
    const res = await this.getRequest(this.getPath(file));

    if (!res.ok) return false;

    const { content, sha } = await res.json();

    return { content, sha };
  }

  async retrieve (file) {
    const result = await this.retrieveRaw(file);

    if (!result) return false;

    return {
      content: result.content ? this.base64decode(result.content) : undefined,
      sha: result.sha
    };
  }

  async publish (file, content, options) {
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

    const res = await this.putRequest(this.getPath(file), data);

    if (!res.ok && res.status === 422 && options.force === true) {
      const currentData = await this.retrieve(file);

      if (!currentData || !currentData.sha) {
        return false;
      }

      return this.publish(file, content, {
        ...options,
        force: undefined,
        sha: currentData.sha
      });
    }

    const body = await res.json();

    if (res.ok === false) {
      // Only reason to not return "res.ok" directly in the previous step is to get some debugging capabilities.
      // This is only temporary – should either be based on a Bunyan-like logger och simplify it by removing it
      console.log('GitHub Error', body);
      return false;
    }

    if (res.ok === undefined) {
      return body;
    }

    return body.content.sha;
  }
}

module.exports = GitHubPublisher;
