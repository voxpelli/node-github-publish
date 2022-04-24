import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { MockAgent, setGlobalDispatcher } from 'undici';

import { GitHubPublisher } from '../index.js';

chai.use(chaiAsPromised);

chai.should();

describe('GitHubPublisher', () => {
  /** @type {import('undici').MockAgent} */
  let mockAgent;
  /** @type {string} */
  let token;
  /** @type {string} */
  let user;
  /** @type {string} */
  let repo;
  /** @type {string} */
  let file;
  /** @type {string} */
  let content;
  /** @type {string} */
  let base64;
  /** @type {string} */
  let path;
  /** @type {import('../index').GitHubPublisher} */
  let publisher;
  /** @type {string} */
  let createdSha;
  /** @type {{ content: { sha: string }}} */
  let githubCreationResponse;

  beforeEach(() => {
    mockAgent = new MockAgent();
    mockAgent.disableNetConnect();
    setGlobalDispatcher(mockAgent);

    token = 'abc123';
    user = 'username';
    repo = 'repo';
    file = 'test.txt';
    content = 'Morbi leo risus, porta ac consectetur ac, vestibulum at.';
    base64 = Buffer.from(content).toString('base64');
    path = '/repos/' + user + '/' + repo + '/contents/' + file;
    createdSha = '95b966ae1c166bd92f8ae7d1c313e738c731dfc3';
    githubCreationResponse = { content: { sha: createdSha } };

    publisher = new GitHubPublisher(token, user, repo);
  });

  afterEach(async () => {
    await mockAgent.close();
  });

  describe('retrieve', () => {
    it('should retrieve the content from GitHub', async () => {
      const sha = 'abc123';

      mockAgent.get('https://api.github.com')
        .intercept({ path })
        .reply(200, { content: base64, sha });

      const result = await publisher.retrieve(file);

      result.should.have.property('content', content);
      result.should.have.property('sha', sha);
    });

    it('should handle errors from GitHub', async () => {
      mockAgent.get('https://api.github.com')
        .intercept({ path })
        .reply(400, {});

      const result = await publisher.retrieve(file);

      result.should.equal(false);
    });

    it('should specify branch if provided', async () => {
      const branch = 'foo-bar';

      publisher = new GitHubPublisher(token, user, repo, branch);

      mockAgent.get('https://api.github.com')
        .intercept({ path: path + '?ref=' + branch })
        .reply(200, { sha: 'abc123', content: 'old content' });

      const result = await publisher.retrieve(file);

      result.should.not.equal(false);
    });
  });

  describe('publish', () => {
    it('should send the content to GitHub', async () => {
      mockAgent.get('https://api.github.com')
        // FIXME: Re-enable this Nock feature with Undici MockAgent
        // .matchHeader('user-agent', val => val && val[0] === user)
        // .matchHeader('authorization', val => val && val[0] === 'Bearer ' + token)
        // .matchHeader('accept', val => val && val[0] === 'application/vnd.github.v3+json')
        .intercept({
          method: 'PUT',
          path,
          body: JSON.stringify({
            message: 'new content',
            content: base64,
          })
        })
        .reply(201, githubCreationResponse);

      const result = await publisher.publish(file, content);

      result.should.equal(createdSha);
    });

    it('should specify branch if provided', async () => {
      const branch = 'foo-bar';

      publisher = new GitHubPublisher(token, user, repo, branch);

      mockAgent.get('https://api.github.com')
        .intercept({
          method: 'PUT',
          path,
          body: JSON.stringify({
            message: 'new content',
            content: base64,
            branch,
          })
        })
        .reply(201, githubCreationResponse);

      const result = await publisher.publish(file, content);

      result.should.equal(createdSha);
    });

    it('should handle errors from GitHub', async () => {
      mockAgent.get('https://api.github.com')
        .intercept({ method: 'PUT', path })
        .reply(400, {});

      const result = await publisher.publish(file, content);

      result.should.equal(false);
    });

    it('should fail on duplicate error if not forced', async () => {
      mockAgent.get('https://api.github.com')
        .intercept({ method: 'PUT', path })
        .reply(422, {});

      const result = await publisher.publish(file, content);

      result.should.equal(false);
    });

    it('should succeed on duplicate error if forced', async () => {
      const sha = 'abc123';

      mockAgent.get('https://api.github.com')
        .intercept({
          method: 'PUT',
          path,
          body: JSON.stringify({
            message: 'new content',
            content: base64,
          })
        })
        .reply(422, {});

      mockAgent.get('https://api.github.com')
        .intercept({ method: 'GET', path })
        .reply(200, { sha, content: 'old content' });

      mockAgent.get('https://api.github.com')
        .intercept({
          method: 'PUT',
          path,
          body: JSON.stringify({
            message: 'new content',
            content: base64,
            sha,
          })
        })
        .reply(201, githubCreationResponse);

      const result = await publisher.publish(file, content, { force: true });

      result.should.equal(createdSha);
    });

    it('should accept raw buffers as content', async () => {
      const contentBuffer = Buffer.from('abc123');

      mockAgent.get('https://api.github.com')
        .intercept({
          method: 'PUT',
          path,
          body: JSON.stringify({
            message: 'new content',
            content: contentBuffer.toString('base64')
          }),
        })
        .reply(201, githubCreationResponse);

      await publisher.publish(file, contentBuffer);
    });

    it('should allow customizeable commit messages', async () => {
      publisher = new GitHubPublisher(token, user, repo);

      mockAgent.get('https://api.github.com')
        .intercept({
          method: 'PUT',
          path,
          body: JSON.stringify({
            message: 'foobar',
            content: base64
          }),
        })
        .reply(201, githubCreationResponse);

      const result = await publisher.publish(file, content, { message: 'foobar' });

      result.should.equal(createdSha);
    });
  });
});
