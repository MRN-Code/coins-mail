/**
 * Create mail tests.
 *
 * Tests for the `createMail` function.
 */
'use strict';

const assign = require('lodash.assign');
const bookshelf = require('bookshelf')();
const createMail = require('../src/create-mail.js');
const sinon = require('sinon');
const tape = require('tape');

const TestModel = bookshelf.Model.extend({
  tableName: 'test_model',
});

tape('validates model', t => {
  t.plan(3);

  createMail()
    .then(() => t.fail('resolves without args'))
    .catch(() => t.pass('rejects without args'));

  createMail({})
    .then(() => t.fail('resolves with bad model'))
    .catch(() => t.pass('rejects with bad model'));

  // createMail(new BookshelfModel())
  createMail(TestModel)
    .then(() => t.fail('resolves with bad options'))
    .catch(error => {
      /**
       * Joi validation will cause the resulting promise to be rejected. As
       * long as the error is a Joi error the model is good.
       */
      t.ok(error.isJoi, 'accepts bookshelf model');
    });
});

tape('validates options :: setup', t => {
  /**
   * Stub the model's `#save` method so that Bookshelf.js doesn't attempt to
   * use knex and throw all sorts of errors.
   */
  const stub = sinon.stub(TestModel.prototype, 'save');

  stub.returns(Promise.resolve());

  t.end();
});

tape('validates options', t => {
  t.plan(8);

  const validOptions = {
    fromLabel: 'Test Application',
    recipients: 'nidev@mrn.org',
    replyTo: 'nidev@mrn.org',
    subject: 'Test Subject',
    templateLocals: {},
  };

  function createWith(override) {
    return createMail(
      TestModel,
      assign({}, validOptions, override)
    );
  }

  createWith({ fromLabel: '' })
    .then(() => t.fail('resolves with empty fromLabel'))
    .catch(error => {
      t.equal(
        error.details[1].context.key,
        'fromLabel',
        'rejects with empty fromLabel'
      );
    });

  createWith({ recipients: '' })
    .then(() => t.fail('resolves with empty recipients'))
    .catch(error => {
      t.equal(
        error.details[1].context.key,
        'recipients',
        'rejects with empty recipients'
      );
    });

  createWith({ recipients: 'bad-email-address.mrn.org' })
    .then(() => t.fail('resolves with invalid recipients'))
    .catch(error => {
      t.equal(
        error.details[1].context.key,
        'recipients',
        'rejects with invalid recipients'
      );
    });

  createWith({ replyTo: '' })
    .then(() => t.fail('resolves with empty replyTo'))
    .catch(error => {
      t.equal(
        error.details[1].context.key,
        'replyTo',
        'rejects with empty replyTo'
      );
    });

  createWith({ replyTo: 'invalid-crazy-email.yahoos.net' })
    .then(() => t.fail('resolves with invalid replyTo'))
    .catch(error => {
      t.equal(
        error.details[1].context.key,
        'replyTo',
        'rejects with invalid replyTo'
      );
    });

  createWith({ subject: '' })
    .then(() => t.fail('resolves with empty subject'))
    .catch(error => {
      t.equal(
        error.details[1].context.key,
        'subject',
        'rejects with empty subject'
      );
    });

  createWith({ templateLocals: undefined })
    .then(() => t.fail('resolves with bad templateLocals'))
    .catch(error => {
      t.equal(
        error.details[1].context.key,
        'templateLocals',
        'rejects with bad templateLocals'
      );
    });

  createWith()
    .then(() => t.pass('resolves with valid options'))
    .catch(t.end);
});

tape('validates options :: teardown', t => {
  TestModel.prototype.save.restore();
  t.end();
});

