/* jshint node: true */
/* global beforeEach, afterEach, describe, it */

'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const nock = require('nock');

chai.use(chaiAsPromised);

// var should = chai.should();
chai.should();

describe('GitHubPublisher', () => {
  const GitHubPublisher = require('../');

  let token;
  let user;
  let repo;
  let file;
  let content;
  let base64;
  let path;
  let publisher;
  let createdSha;
  let githubCreationResponse;

  beforeEach(() => {
    nock.disableNetConnect();

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

  afterEach(() => {
    nock.cleanAll();
  });

  describe('retrieve', () => {
    it('should retrieve the content from GitHub', () => {
      const sha = 'abc123';
      const mock = nock('https://api.github.com/')
        .get(path)
        .reply(200, { content: base64, sha });

      return publisher.retrieve(file).then(result => {
        mock.done();
        result.should.have.property('content', content);
        result.should.have.property('sha', sha);
      });
    });

    it('should handle errors from GitHub', () => {
      const mock = nock('https://api.github.com/')
        .get(path)
        .reply(400, {});

      return publisher.retrieve(file).then(result => {
        mock.done();
        result.should.equal(false);
      });
    });

    it('should specify branch if provided', () => {
      const branch = 'foo-bar';

      publisher = new GitHubPublisher(token, user, repo, branch);

      const mock = nock('https://api.github.com/')
        .get(path + '?ref=' + branch)
        .reply(200, {});

      return publisher.retrieve(file).then(result => {
        mock.done();
        result.should.not.equal(false);
      });
    });
  });

  describe('publish', () => {
    it('should send the content to GitHub', () => {
      const mock = nock('https://api.github.com/')
        .matchHeader('user-agent', val => val && val[0] === user)
        .matchHeader('authorization', val => val && val[0] === 'Bearer ' + token)
        .matchHeader('accept', val => val && val[0] === 'application/vnd.github.v3+json')
        .put(path, {
          message: 'new content',
          content: base64
        })
        .reply(201, githubCreationResponse);

      return publisher.publish(file, content).then(result => {
        mock.done();
        result.should.equal(createdSha);
      });
    });

    it('should specify branch if provided', () => {
      const branch = 'foo-bar';

      publisher = new GitHubPublisher(token, user, repo, branch);

      const mock = nock('https://api.github.com/')
        .put(path, {
          message: 'new content',
          content: base64,
          branch
        })
        .reply(201, githubCreationResponse);

      return publisher.publish(file, content).then(result => {
        mock.done();
        result.should.equal(createdSha);
      });
    });

    it('should handle errors from GitHub', () => {
      const mock = nock('https://api.github.com/')
        .put(path)
        .reply(400, {});

      return publisher.publish(file, content).then(result => {
        mock.done();
        result.should.equal(false);
      });
    });

    it('should fail on duplicate error if not forced', () => {
      const mock = nock('https://api.github.com/')
        .put(path)
        .reply(422, {});

      return publisher.publish(file, content).then(result => {
        mock.done();
        result.should.equal(false);
      });
    });

    it('should succeed on duplicate error if forced', () => {
      const sha = 'abc123';
      const mock = nock('https://api.github.com/')
        .put(path, {
          message: 'new content',
          content: base64
        })
        .reply(422, {})

        .get(path)
        .reply(200, { sha })

        .put(path, {
          message: 'new content',
          content: base64,
          sha
        })
        .reply(201, githubCreationResponse);

      return publisher.publish(file, content, true).then(result => {
        mock.done();
        result.should.equal(createdSha);
      });
    });

    it('should accept raw buffers as content', () => {
      const contentBuffer = Buffer.from('abc123');

      const mock = nock('https://api.github.com/')
        .put(path, {
          message: 'new content',
          content: contentBuffer.toString('base64')
        })
        .reply(201, githubCreationResponse);

      return publisher.publish(file, contentBuffer).then(() => {
        mock.done();
      });
    });

    it('should allow customizeable commit messages', () => {
      publisher = new GitHubPublisher(token, user, repo);

      const mock = nock('https://api.github.com/')
        .put(path, {
          message: 'foobar',
          content: base64
        })
        .reply(201, githubCreationResponse);

      return publisher.publish(file, content, { message: 'foobar' }).then(result => {
        mock.done();
        result.should.equal(createdSha);
      });
    });
  });
});
