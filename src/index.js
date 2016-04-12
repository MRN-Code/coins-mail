'use strict';

const createMail = require('./create-mail.js');
const template = require('./template.js');

module.exports = {
  createMail: createMail, // eslint-disable-line object-shorthand
  template: template.getTemplate,
};

