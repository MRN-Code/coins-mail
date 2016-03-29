'use strict';

const async = require('async');
const cons = require('consolidate');
const fs = require('fs');
const inlineCss = require('inline-css');
const nodeSass = require('node-sass');
const noop = require('lodash/noop');
const path = require('path');

/**
 * COINS Mail.
 * @module
 *
 * @param {string} [templateName=generic]
 * @param {Object} locals Local parameters to pass to Twig templates
 * @param {Function} [callback] Optional callback with Node-style arguments
 * @returns {Promise}
 */
function coinsMail(templateName, locals, callback) {
  let _templateName;
  let _locals;
  let _callback;

  if (templateName instanceof Object) {
    _templateName = coinsMail.DEFAULT_TEMPLATE_DIR;
    _locals = templateName;

    if (locals instanceof Function) {
      _callback = locals;
    }
  } else {
    _templateName = templateName;

    if (locals instanceof Object) {
      _locals = locals;
    }

    if (callback instanceof Function) {
      _callback = callback;
    }
  }

  if (!_templateName) {
    throw new Error('Requires a template name');
  }

  if (!_locals) {
    throw new Error('Requires local parameters');
  }

  if (!_callback) {
    _callback = noop;
  }

  return new Promise((resolve, reject) => {
    const templatePath = path.resolve(
      __dirname, '..', coinsMail.TEMPLATES_DIR, _templateName
    );

    async.parallel({
      html: (cb1) => {
        async.parallel({
          css: (cb1a) => {
            async.waterfall([
              (cb1a1) => {
                fs.readFile(
                  path.join(templatePath, coinsMail.SASS_FILENAME),
                  'utf-8',
                  cb1a1
                );
              },
              (sass, cb1a2) => {
                if (sass.length === 0) {
                  cb1a(null);
                } else {
                  nodeSass.render({
                    data: sass,
                  }, cb1a2);
                }
              },
            ], cb1a);
          },
          html: (cb1b) => {
            cons.twig(
              path.join(templatePath, coinsMail.HTML_FILENAME),
              _locals,
              cb1b
            );
          },
        }, (error, results) => {
          if (error) {
            cb1(error);
          } else {
            inlineCss(results.html, {
              extraCss: results.css,
              url: templatePath,
            })
              .then(html => cb1(null, html))
              .catch(err => cb1(err));
          }
        });
      },
      text: (cb2) => {
        cons.twig(
          path.join(templatePath, coinsMail.TEXT_FILENAME),
          _locals,
          cb2
        );
      },
    }, (error, results) => {
      if (error) {
        _callback(error);
        reject(error);
      } else {
        _callback(null, results);
        resolve(results);
      }
    });
  });
}

/**
 * Directory containing templates.
 *
 * This is useful for manipulating the path for testing.
 *
 * @property {string}
 */
coinsMail.TEMPLATES_DIR = 'templates';

/**
 * Default template directory.
 *
 * @property {string}
 */
coinsMail.DEFAULT_TEMPLATE_DIR = 'default';

/**
 * HTML filename.
 *
 * @property {string}
 */
coinsMail.HTML_FILENAME = 'html.twig';

/**
 * Sass filename.
 *
 * @property {string}
 */
coinsMail.SASS_FILENAME = 'styles.scss';

/**
 * Text filename.

 * @property {string}
 */
coinsMail.TEXT_FILENAME = 'text.twig';

module.exports = coinsMail;
