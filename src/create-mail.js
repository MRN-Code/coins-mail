'use strict';

const assign = require('lodash.assign');
const BookshelfModel = require('bookshelf/lib/model.js');
const joi = require('joi');
const template = require('./template.js');

/**
 * Mail schema.
 *
 * Schema for `createMail`'s `options` argument.
 *
 * @const {joi}
 */
const mailSchema = joi.object().keys({
  fromLabel: joi.string().required(),
  recipients: joi.alternatives().try(
    joi.string().email(),
    joi.array().items(joi.string().email())
  ).required(),
  replyTo: joi.string().email().required(),
  sendTime: joi.date().min(Date.now() - 100).default(Date.now()),
  subject: joi.string().required(),
  templateLocals: joi.object().required(),
  templateName: joi.string(),
});

/**
 * Map option to attributes.
 *
 * This maps author-friendly parameters to column names in `mrs_mail`. Table
 * columns:
 *
 *   * mail_id: serial (auto)
 *   * study_id: unused
 *   * use_coins_template: `true` for everything
 *   * from_label: Place of mail origin (ex: "Participant Portal"), not used in
 *     template
 *   * recipients: JSON of mails' recipients. Ex:
 *     ```
 *     {"email":["jon.steele77@gmail.com"]}
 *     ```
 *   * reply_to_address: Single email address
 *   * subject: In-email subject
 *   * text_body: Raw text body
 *   * html_body: Raw html body
 *   * disclaimer_text: no longer used
 *   * menu_link_key: no longer used
 *   * send_time: Time to send email
 *   * sent: Mail daemon ONLY, populated when mail is sent
 *
 * @param {Object} option
 * @param {string} option.email
 * @param {string} option.fromLabel
 * @param {string} option.html Email's HTML content
 * @param {(string|string[])} options.recipients
 * @param {string} option.replyTo
 * @param {Date} option.sendTime
 * @param {string} option.subject
 * @param {string} option.text Email's text content
 * @returns {Object}
 */
function optionToAttributes(option) {
  const email = Array.isArray(option.recipients) ?
    option.recipients :
    [option.recipients];

  return {
    disclaimer_text: null,
    from_label: option.fromLabel,
    html_body: option.html,
    mail_id: null,
    menu_link_key: null,
    recipients: {
      email: email, // eslint-disable-line object-shorthand
    },
    reply_to_address: option.replyTo,
    send_time: option.sendTime,
    sent: null,
    study_id: null,
    subject: option.subject,
    text_body: option.text,
    use_coins_template: true,
  };
}

/**
 * Create mail.
 * @module
 *
 * @example <caption>Single email</caption>
 * createMail(MyMailModel, {
 *   fromLabel: 'Test Application',,
 *   recipients: [
 *     'recipient-1@mrn.org',
 *     'recipeint-2@mrn.org',
 *     'recipient-3@mrn.org',
 *     // ...
 *   ],
 *   replyTo: 'reply-address@mrn.org',
 *   sendTime: Date.now() + 24 * 60 * 60 * 1000,
 *   subject: 'Test Subject',
 *   templateLocals: {
 *     html: {
 *       myHtmlTemplateVar: 'value',
 *     },
 *     text: {
 *       myTextTemplateVar: 'value',
 *     },
 *   },
 *   templateName: 'my-template',
 * })
 *   .then(savedModel => console.log(savedModel))
 *   .catch(error => console.error(error));
 *
 * @example <caption>Multiple emails</caption>
 * createMail(MyMailModel, [{
 *   fromLabel: 'Test Application 1',
 *   recipients: 'recipient-1@mrn.org'
 *   replyTo: 'reply-address@mrn.org',
 *   subject: 'Test Subject 1',
 *   templateLocals: // ...
 * }, {
 *   fromLabel: 'Test Application 2',
 *   recipients: 'recipient-2@mrn.org'
 *   replyTo: 'reply-address@mrn.org',
 *   subject: 'Test Subject 2',
 *   templateLocals: // ...
 * }, {
 *   fromLabel: 'Test Application 3',
 *   recipients: 'recipient-3@mrn.org'
 *   replyTo: 'reply-address@mrn.org',
 *   subject: 'Test Subject 3',
 *   templateLocals: // ...
 * }])
 *   .then(savedModels => {
 *     savedModels.forEach(savedModel => console.log(savedModel))
 *   })
 *   .catch(error => console.error(error));
 *
 * @param {BookshelfModel} Mail Wired up bookshelf.js model that backs the
 * `mrs_mail` table
 * @param {(Object|Object[])} options Single mail or collection of mails to
 * send.
 * @property {string} options.fromLabel Added to the `from_label` column. This
 * is typically the name of application sending the email.
 * @property {(string|string[])} options.recipients Single recipient email
 * address or a collection of email addresses.
 * @property {string} options.replyTo Email address to use in the email’s
 * 'reply to' field.
 * @property {string} options.subject Email’s subject field
 * @property {Object} options.templateLocals Hash to pass to `getTemplate`. The
 * keys/values depend on the email template in use (see `options.templateName`).
 * @property {Date} [options.sendTime=Date.now()] Time to send the email.
 * @property {string} [options.templateName=default] Name of email template to
 * use.
 * @returns {Promise} bookshelf.Model
 */
function createMail(Mail, options) {
  if (
    !Mail ||
    !(Mail instanceof Object) ||
    !(Mail.prototype instanceof BookshelfModel)
  ) {
    return Promise.reject(new Error('Expected Mail to be a model'));
  }

  // Validate `options`
  // TODO: Figure out how to use joi.alternatives on this
  const result = Array.isArray(options) ?
    joi.validate(options, joi.array().items(mailSchema.required())) :
    joi.validate(options, mailSchema.required());
  const error = result.error;
  const value = result.value;

  /* eslint-disable arrow-body-style */
  if (error) {
    return Promise.reject(error);
  } else if (Array.isArray(value)) {
    return Promise.all(value.map(option => {
      return (
        option.templateName ?
          template.getTemplate(option.templateName, option.templateLocals) :
          template.getTemplate(option.templateLocals)
      );
    }))
      .then(contents => contents.map((content, index) => {
        return optionToAttributes(assign({}, value[index], content));
      }))
      .then(attributes => {
        return Promise.all(Mail.collection().add(attributes).invoke('save'));
      });
  }

  return (
    value.templateName ?
      template.getTemplate(value.templateName, value.templateLocals) :
      template.getTemplate(value.templateLocals)
  )
    .then(content => {
      return Mail
        .forge(optionToAttributes(assign({}, result.value, content)))
        .save();
    });
  /* eslint-enable arrow-body-style */
}

module.exports = createMail;
