'use strict';

const coinsMail = require('../src/index.js');
const tape = require('tape');

tape('errors', t => {
  t.throws(coinsMail, 'throws with no args');
  t.throws(coinsMail.bind('bogus-template'), 'throws with no locals');
  t.throws(
    coinsMail.bind('bogus-template', 'bogus-locals'),
    'throws with non-object locals'
  );
  t.end();
});

tape('Promise interface', t => {
  const mail = coinsMail({ messageBody: 'hello' });

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
  const locals = {
    messageBody: 'hello',
  };

  t.plan(3);

  coinsMail('default', locals, (error, result) => {
    if (error) {
      t.fail(error);
    } else {
      t.ok('text' in result, 'returns text');
      t.ok('html' in result, 'returns HTML');
    }
  });
  coinsMail(locals, (error, result) => {
    if (error) {
      t.fail(error);
    } else {
      t.ok(result, 'works without template name');
    }
  });
});
