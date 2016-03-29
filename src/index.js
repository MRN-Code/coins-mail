'use strict';

const async = require('async');
const autoprefixer = require('autoprefixer');
const cons = require('consolidate');
const fs = require('fs');
const inlineCss = require('inline-css');
const minify = require('html-minifier').minify;
const nodeSass = require('node-sass');
const noop = require('lodash.noop');
const path = require('path');
const postcss = require('postcss');

/**
 * Convert Sass to CSS.
 *
 * @param {string} sass
 * @param {Function} cb Node-style callback
 */
function sassToCss(sass, cb) {
  if (sass.length === 0) {
    cb(null);
  } else {
    nodeSass.render(
      {
        data: sass,
      },

      /**
       * Result contains a `css` buffer:
       * {@link https://www.npmjs.com/package/node-sass#result-object}
       */
      (error, result) => {
        if (error) {
          cb(error);
        } else {
          cb(null, result.css.toString());
        }
      }
    );
  }
}

/**
 * PostCSS returns a Promise-y `LazyResult`:
 * {@link https://github.com/postcss/postcss/blob/master/docs/api.md#lazyresult-class}
 */
function autoprefixCss(css, cb) {
  if (!css) {
    cb(null);
  } else {
    postcss([autoprefixer({
      browsers: 'last 2 versions',
      remove: false,
    })])
      .process(css)
      .then(result => cb(null, result.css))
      .catch(cb);
  }
}

/**
 * Add (inline) CSS to HTML.
 *
 * @param {Object} params
 * @param {string} params.css
 * @param {string} params.html
 * @param {string} params.templatePath
 * @param {Function} cb Node-style callback
 */
function addCss(params, cb) {
  inlineCss(params.html, {
    extraCss: params.css,
    url: params.templatePath,
  })
    .then(html => cb(null, html))
    .catch(cb);
}

/**
 * Minify HTML.
 *
 * {@link https://github.com/kangax/html-minifier}
 *
 * @param {string} html
 * @param {Function} cb Node-style callback
 */
function minifyHtml(html, cb) {
  cb(null, minify(html, {
    collapseWhitespace: true,
    conservativeCollapse: true,
    minifyCSS: true,
    removeComments: true,
  }));
}

/**
 * COINS Mail.
 * @module
 *
 * @example
 * coinsMail({
 *   html: {
 *     myHtmlTemplateVar: '<h1>Hi!</h1> <p>Insert this html…</p>',
 *   },
 *   text: {
 *     myTextTemplateVar: 'Alternative!\n\nFor the text version…',
 *   },
 * }, (error, result) => {
 *   if (error) {
 *     console.error(error);
 *   } else {
 *     console.log('HTML:', result.html);
 *     console.log('Text:', result.text);
 *   }
 * });
 *
 * @param {string} [templateName=generic]
 * @param {Object} locals Local parameters to pass to Twig templates
 * @param {Object} locals.html Local parameters to apply to the HTML template
 * @param {Object} locals.text Local parameters to apply to the text template
 * @param {Function} [callback] Optional callback with Node-style arguments
 * @returns {Promise}
 */
function coinsMail(templateName, locals, callback) {
  let _callback;
  let _locals;
  let _templateName;

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
  } else if (!('html' in _locals)) {
    throw new Error('Requires local parameters for HTML');
  } else if (!('text' in _locals)) {
    throw new Error('Requires local parameters for text');
  }

  if (!_callback) {
    _callback = noop;
  }

  const templatePath = path.resolve(
    __dirname, '..', coinsMail.TEMPLATES_DIR, _templateName
  );

  return new Promise((resolve, reject) => {
    async.parallel({
      html: cb1 => {
        async.waterfall([
          cb1a => {
            async.parallel({
              css: cb1a1 => {
                async.waterfall([
                  cb1a1a => {
                    fs.readFile(
                      path.join(templatePath, coinsMail.SASS_FILENAME),
                      'utf-8',
                      cb1a1a
                    );
                  },
                  (sass, cb1a1b) => sassToCss(sass, cb1a1b),
                  (css, cb1a1c) => autoprefixCss(css, cb1a1c),
                ], cb1a1);
              },
              html: cb1a2 => {
                cons.twig(
                  path.join(templatePath, coinsMail.HTML_FILENAME),
                  _locals.html,
                  cb1a2
                );
              },
            }, cb1a);
          },
          (results, cb1b) => {
            addCss({
              css: results.css,
              html: results.html,
              templatePath: templatePath, // eslint-disable-line object-shorthand
            }, cb1b);
          },
          (html, cb1c) => minifyHtml(html, cb1c),
        ], cb1);
      },
      text: cb2 => {
        cons.twig(
          path.join(templatePath, coinsMail.TEXT_FILENAME),
          _locals.text,
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
