import { ErrorWithCause } from 'pony-cause';
import { request } from 'undici';

// FIXME: Why is there a "#private;" field exported in the types?
export class GitHubPublisher {
  /** @type {string} */
  #token;
  /** @type {string} */
  #user;
  /** @type {string} */
  #repo;
  /** @type {string|undefined} */
  #branch;

  /**
   * @param {string} token
   * @param {string} user
   * @param {string} repo
   * @param {string|undefined} [branch]
   */
  constructor (token, user, repo, branch) {
    this.#token = token;
    this.#user = user;
    this.#repo = repo;
    this.#branch = branch;
  }

  #getBaseHeaders () {
    return {
      authorization: 'Bearer ' + this.#token,
      accept: 'application/vnd.github.v3+json',
      'user-agent': this.#user,
    };
  }

  /**
   * @param {string} path
   * @returns {Promise<{ ok: boolean, json: () => Promise<unknown>, status: number }>}
   */
  async #getRequest (path) {
    let url = 'https://api.github.com' + path;

    if (this.#branch) {
      url += '?ref=' + encodeURIComponent(this.#branch);
    }

    const { body, statusCode } = await request(url, { headers: this.#getBaseHeaders() });

    return {
      json: /** @returns {Promise<unknown>} */ () => body.json(),
      ok: statusCode < 300,
      status: statusCode,
    };
  }

  /**
   * @param {string} path
   * @param {Record<string,unknown>} data
   * @returns {Promise<{ ok: boolean, json: () => Promise<unknown>, status: number }>}
   */
  async #putRequest (path, data) {
    const options = {
      body: JSON.stringify(data),
      headers: {
        ...this.#getBaseHeaders(),
        'content-type': 'application/json',
      },
    };

    const url = 'https://api.github.com' + path;

    const { body, statusCode } = await request(url, options);

    return {
      json: /** @returns {Promise<unknown>} */ () => body.json(),
      ok: statusCode < 300,
      status: statusCode,
    };
  }

  /**
   * @param {string|Buffer} text
   * @returns {string}
   */
  #base64 (text) {
    const data = text instanceof Buffer ? text : Buffer.from(text);
    return data.toString('base64');
  }

  /**
   * @param {string} text
   * @returns {string}
   */
  #base64decode (text) {
    return Buffer.from(text, 'base64').toString('utf8');
  }

  /**
   * @param {string} file
   * @returns {string}
   */
  #getPath (file) {
    return '/repos/' + this.#user + '/' + this.#repo + '/contents/' + file;
  }

  /**
   * @param {string} file
   * @returns {Promise<false|{ content: string, sha: string }>}
   */
  async #retrieveRaw (file) {
    const res = await this.#getRequest(this.#getPath(file))
      .catch(/** @param {unknown} err */ err => {
        throw new ErrorWithCause('Failed to retrieve file from GitHub', { cause: err });
      });
    if (!res.ok) return false;

    const body = await res.json();

    // TODO: Throw an error instead?
    if (!body || typeof body !== 'object') return false;

    const { content, sha } = /** @type {{ content?: string, sha?: string }} */ (body);

    // TODO: Throw an error instead?
    if (content === undefined || sha === undefined) return false;

    return { content, sha };
  }

  /**
   * @param {string} file
   * @returns {Promise<false|{ content: string|undefined, sha: string }>}
   */
  async retrieve (file) {
    const result = await this.#retrieveRaw(file);

    if (!result) return false;

    return {
      content: result.content ? this.#base64decode(result.content) : undefined,
      sha: result.sha,
    };
  }

  /**
   * @param {string} file
   * @param {string|Buffer} content
   * @param {object} options
   * @param {boolean} [options.force]
   * @param {string} [options.message]
   * @param {string} [options.sha]
   * @returns {Promise<string|false>}
   */
  async publish (file, content, options = {}) {
    const { force, message, sha } = options;

    const data = {
      message: message || 'new content',
      content: this.#base64(content),
      ...(sha ? { sha } : {}),
      ...(this.#branch ? { branch: this.#branch } : {}),
    };

    const res = await this.#putRequest(this.#getPath(file), data);

    if (!res.ok && res.status === 422 && force === true) {
      const currentData = await this.retrieve(file);

      if (!currentData || !currentData.sha) {
        return false;
      }

      return this.publish(file, content, {
        ...options,
        force: undefined,
        sha: currentData.sha,
      });
    }

    const body = await res.json();

    if (res.ok === false) {
      console.log('GitHub Error', body);
      return false;
    }

    if (!body || typeof body !== 'object') {
      console.log('Invalid body returned:', body);
      return false;
    }

    const { content: { sha: createdSha } = {} } = /** @type {{ content?: { sha?: string }}} */ (body);

    if (!createdSha) {
      console.log('Invalid sha returned. Full body:', body);
      return false;
    }

    return createdSha;
  }
}
