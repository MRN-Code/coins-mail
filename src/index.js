'use strict';

const createMail = require('./create-mail.js');
const template = require('./template.js');

module.exports = {
  /* eslint-disable object-shorthand */
  createMail: createMail,
  template: template,
  /* eslint-enable object-shorthand */
};
