'use strict';

const cheerio = require('cheerio');
const getTemplate = require('../src/template.js').getTemplate;
const tape = require('tape');

/**
 * Get valid `locals` param for `template`.
 *
 * @returns {Object}
 */
function getValidLocals() {
  return {
    html: {
      messageBody: 'hello',
    },
    text: {
      messageBody: 'hello',
    },
  };
}

tape('errors', t => {
  t.throws(getTemplate, 'throws with no args');
  t.throws(getTemplate.bind('bogus-template'), 'throws with no locals');
  t.throws(
    getTemplate.bind('bogus-template', 'bogus-locals'),
    'throws with non-object locals'
  );
  t.throws(getTemplate.bind({ text: {} }), 'throws without HTML locals');
  t.throws(getTemplate.bind({ html: {} }), 'throws without text locals');
  t.end();
});

tape('Promise interface', t => {
  const mail = getTemplate(getValidLocals());

  t.plan(3);

  t.ok(mail instanceof Promise, 'returns a Promise');

  mail
    .then(result => {
      t.ok('text' in result, 'returns text');
      t.ok('html' in result, 'returns HTML');
    })
    .catch(t.end);
});

tape('callback interface', t => {
  t.plan(3);

  getTemplate('default', getValidLocals(), (error, result) => {
    if (error) {
      t.fail(error);
    } else {
      t.ok('text' in result, 'returns text');
      t.ok('html' in result, 'returns HTML');
    }
  });
  getTemplate(getValidLocals(), (error, result) => {
    if (error) {
      t.fail(error);
    } else {
      t.ok(result, 'works without template name');
    }
  });
});

tape('integration', t => {
  const locals = {
    text: {
      body: 'Hello!\n\nThis is the sample text body.',
      link: 'http://coins.mrn.org/',
    },
    html: {
      body: '<h1>Hello!</h1><p>This is the sample HTML body.</p>',
      link: 'http://coins.mrn.org/',
    },
  };

  // Setup
  const originalTemplatesDir = getTemplate.TEMPLATES_DIR;
  const originalDefaultTemplateDir = getTemplate.DEFAULT_TEMPLATE_DIR;

  getTemplate.TEMPLATES_DIR = 'test';
  getTemplate.DEFAULT_TEMPLATE_DIR = 'fixture-template';

  t.plan(4);

  getTemplate(locals)
    .then(results => {
      const $ = cheerio.load(results.html);

      t.equal(
        results.text.indexOf(locals.text.body),
        0,
        'Renders locals into text template'
      );
      t.ok(
        (
          $('h1').text() === 'Hello!' &&
          $('p').text() === 'This is the sample HTML body.' &&
          $('a').attr('href') === locals.html.link
        ),
        'Renders locals into HTML template'
      );

      // Based on content found in test/fixture-template/styles.scss
      t.ok(
        (
          $('h1').attr('style').indexOf('color') > -1 &&
          $('p').attr('style').indexOf('margin:.5em') === 0
        ),
        'injects CSS into HTML'
      );
      t.ok(
        $('a').attr('style').indexOf('-webkit-filter') > -1,
        'prefixes CSS properties'
      );
    })
    .catch(t.end)
    .then(() => {
      // Teardown
      getTemplate.TEMPLATES_DIR = originalTemplatesDir;
      getTemplate.DEFAULT_TEMPLATE_DIR = originalDefaultTemplateDir;
    });
});
