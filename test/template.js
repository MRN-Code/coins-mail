'use strict';

const cheerio = require('cheerio');
const coinsMail = require('../src/template.js');
const tape = require('tape');

/**
 * Get valid `locals` param for `coinsMail`.
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
  t.throws(coinsMail, 'throws with no args');
  t.throws(coinsMail.bind('bogus-template'), 'throws with no locals');
  t.throws(
    coinsMail.bind('bogus-template', 'bogus-locals'),
    'throws with non-object locals'
  );
  t.throws(coinsMail.bind({ text: {} }), 'throws without HTML locals');
  t.throws(coinsMail.bind({ html: {} }), 'throws without text locals');
  t.end();
});

tape('Promise interface', t => {
  const mail = coinsMail(getValidLocals());

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

  coinsMail('default', getValidLocals(), (error, result) => {
    if (error) {
      t.fail(error);
    } else {
      t.ok('text' in result, 'returns text');
      t.ok('html' in result, 'returns HTML');
    }
  });
  coinsMail(getValidLocals(), (error, result) => {
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
  const originalTemplatesDir = coinsMail.TEMPLATES_DIR;
  const originalDefaultTemplateDir = coinsMail.DEFAULT_TEMPLATE_DIR;

  coinsMail.TEMPLATES_DIR = 'test';
  coinsMail.DEFAULT_TEMPLATE_DIR = 'fixture-template';

  t.plan(4);

  coinsMail(locals)
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
      coinsMail.TEMPLATES_DIR = originalTemplatesDir;
      coinsMail.DEFAULT_TEMPLATE_DIR = originalDefaultTemplateDir;
    });
});
