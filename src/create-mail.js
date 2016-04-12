'use strict';

const BookshelfModel = require('bookshelf/lib/model.js');
const joi = require('joi');

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
  templateName: joi.string().default('default'),
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
 * @param {Object} options
 * @param {string} options.email
 * @param {string} options.fromLabel
 * @param {(string|string[])} options.recipients
 * @param {string} options.replyTo
 * @param {Date} options.sendTime
 * @param {string} options.subject
 * @returns {Object}
 */
function optionToAttributes(option) {
  const email = Array.isArray(option.recipients) ?
    option.recipients :
    [option.recipients];

  return {
    disclaimer_text: null,
    from_label: option.fromLabel,
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
    use_coins_template: true,
  };
}

/**
 * Create mail.
 * @module
 *
 * @param {BookshelfModel} Mail Wired up bookshelf.js model that backs the
 * `mrs_mail` table
 * @param {(Object|Object[])} options Single mail or colletion of mails to send
 * @property {string} options.fromLabel
 * @property {(string|string[])} options.recipients Single recipient email
 * address or a collection of email addresses
 * @property {string} options.replyTo Email address to 'replyTo'
 * @property {string} options.subject Email subject
 * @property {Object} options.templateLocals
 * @property {Date} [options.sendTime=Date.now()] Time to send the email
 * @property {string} [options.templateName=default] Name of email template to
 * use
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

  if (result.error) {
    return Promise.reject(result.error);
  } else if (Array.isArray(result.value)) {
    const mails = Mail.collection().add(result.value.map(optionToAttributes));

    return Promise.all(mails.invoke('save'));
  }

  return Mail.forge(optionToAttributes(result.value)).save();
}

module.exports = createMail;
