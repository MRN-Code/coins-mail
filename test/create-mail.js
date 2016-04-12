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

/**
 * Valid options.
 *
 * @const {Object}
 */
const validOptions = {
  fromLabel: 'Test Application',
  recipients: 'nidev@mrn.org',
  replyTo: 'nidev@mrn.org',
  subject: 'Test Subject',
  templateLocals: {},
};

tape('validates model', t => {
  t.plan(3);

  createMail()
    .then(() => t.fail('resolves without args'))
    .catch(() => t.pass('rejects without args'));

  createMail({})
    .then(() => t.fail('resolves with bad model'))
    .catch(() => t.pass('rejects with bad model'));

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
  t.plan(12);

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
        error.details[0].context.key,
        'fromLabel',
        'rejects with empty fromLabel'
      );
    });

  createWith({ recipients: '' })
    .then(() => t.fail('resolves with empty recipients'))
    .catch(error => {
      t.equal(
        error.details[0].context.key,
        'recipients',
        'rejects with empty recipients'
      );
    });

  createWith({ recipients: 'bad-email-address.mrn.org' })
    .then(() => t.fail('resolves with invalid recipients'))
    .catch(error => {
      t.equal(
        error.details[0].context.key,
        'recipients',
        'rejects with invalid recipients'
      );
    });

  createWith({ replyTo: '' })
    .then(() => t.fail('resolves with empty replyTo'))
    .catch(error => {
      t.equal(
        error.details[0].context.key,
        'replyTo',
        'rejects with empty replyTo'
      );
    });

  createWith({ replyTo: 'invalid-crazy-email.yahoos.net' })
    .then(() => t.fail('resolves with invalid replyTo'))
    .catch(error => {
      t.equal(
        error.details[0].context.key,
        'replyTo',
        'rejects with invalid replyTo'
      );
    });

  createWith({ sendTime: 'morning' })
    .then(() => t.fail('resolves with invalid sendTime'))
    .catch(error => {
      t.equal(
        error.details[0].context.key,
        'sendTime',
        'rejects with invalid sendTime'
      );
    });

  createWith({ sendTime: Date.now() - 60 * 1000 })
    .then(() => t.fail('resolves with out-of-range sendTime'))
    .catch(error => {
      t.equal(
        error.details[0].context.key,
        'sendTime',
        'rejects with out-of-range sendTime'
      );
    });

  createWith({ subject: '' })
    .then(() => t.fail('resolves with empty subject'))
    .catch(error => {
      t.equal(
        error.details[0].context.key,
        'subject',
        'rejects with empty subject'
      );
    });

  createWith({ templateLocals: undefined })
    .then(() => t.fail('resolves with bad templateLocals'))
    .catch(error => {
      t.equal(
        error.details[0].context.key,
        'templateLocals',
        'rejects with bad templateLocals'
      );
    });

  createWith()
    .then(() => t.pass('resolves with valid options'))
    .catch(() => t.fail('rejects with valid options'));

  createWith({
    recipients: [
      'nidev@mrn.org',
      'support@mrn.org',
      'info@mrn.org',
    ],
  })
    .then(() => t.pass('resolves with multiple recipients'))
    .catch(() => t.fail('rejects with multiple recipients'));

  createMail(TestModel, [
    assign({}, validOptions),
    assign({}, validOptions),
  ])
    .then(() => t.pass('resolves with multiple options'))
    .catch(() => t.fail('rejects with multiple options'));
});

tape('validates options :: teardown', t => {
  TestModel.prototype.save.restore();
  t.end();
});

tape('default options', t => {
  const forgeSpy = sinon.spy(TestModel, 'forge');
  const saveStub = sinon.stub(TestModel.prototype, 'save');

  saveStub.returns(Promise.resolve());

  t.plan(12);

  createMail(TestModel, validOptions)
    .then(() => {
      const args = forgeSpy.firstCall.args[0];

      t.equal(args.disclaimer_text, null, 'sets disclaimer text null');
      t.ok(args.from_label, validOptions.fromLabel, 'sets from label');
      t.equal(args.mail_id, null, 'sets mail id null');
      t.equal(args.menu_link_key, null, 'sets menu link key null');
      t.deepEqual(
        args.recipients,
        { email: [validOptions.recipients] },
        'sets recipients'
      );
      t.equal(args.reply_to_address, validOptions.replyTo, 'sets reply to');

      // TODO: Better send time date check
      t.ok(typeof args.send_time === 'number', 'sets default send time');
      t.equal(args.sent, null, 'sets sent null');
      t.equal(args.study_id, null, 'sets study id null');
      t.equal(args.subject, validOptions.subject, 'sets subject');
      t.equal(args.use_coins_template, true, 'sets use coins template true');
    })
    .catch(t.end)
    .then(() => {
      forgeSpy.restore();
      saveStub.restore();
      t.pass('Test teardown');
    });
});
