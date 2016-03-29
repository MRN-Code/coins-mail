'use strict';

const coinsMail = require('../src/index.js');
const http = require('http');
const livereload = require('livereload');
const path = require('path');

/**
 * Template locals for testing.
 *
 * @property {Object}
 */
/* eslint-disable max-len */
const locals = {
  html: {
    greeting: 'Lorem Ispum Dolor',
    messageBody: '<p>Etiam tempus aliquam purus, sit amet tempor nibh faucibus ut. Nulla facilisi. Morbi nec eros pharetra, semper sapien in, varius magna.</p><p>Sed vitae facilisis sem, varius tempor orci. Aliquam erat volutpat. Donec cursus a nulla ac rhoncus. Sed ullamcorper erat ligula. Aenean sodales lorem sit amet neque pulvinar, nec facilisis mi maximus. Vestibulum ante mauris, porttitor id pellentesque vel, imperdiet lacinia erat.</p><p>Nunc pellentesque neque dui, id ornare lacus ornare eu.</p>',
  },
  text: {
    greeting: 'Lorem Ipsum Dolor',
    messageBody: 'Etiam tempus aliquam purus, sit amet tempor nibh faucibus ut. Nulla facilisi. Morbi nec eros pharetra, semper sapien in, varius magna.\n\nSed vitae facilisis sem, varius tempor orci. Aliquam erat volutpat. Donec cursus a nulla ac rhoncus. Sed ullamcorper erat ligula. Aenean sodales lorem sit amet neque pulvinar, nec facilisis mi maximus. Vestibulum ante mauris, porttitor id pellentesque vel, imperdiet lacinia erat.\n\nNunc pellentesque neque dui, id ornare lacus ornare eu.',
  },
};
/* eslint-enable max-len */

/**
 * Get output.
 *
 * @param {Object} results Results from `coinsMail`
 * @returns {string}
 */
function getOutput(results) {
  const style = `
    background: #fff;
    box-sizing: border-box;
    color: #000;
    font: normal 14px/150% Monaco, monospace;
    padding: 1em;
    white-space: pre-line;
    width: 100%;
  `.replace(/\s+/g, ' ');

  return `${results.html}
    <pre style="${style}">${results.text}</pre>
    <script>
      document.write(
        '<script src="http://' + (location.host || 'localhost').split(':')[0] +
        ':35729/livereload.js?snipver=1"></' + 'script>'
      )
    </script>`;
}

const port = 3000;
const server = http.createServer((request, response) => {
  coinsMail(locals)
    .then(results => response.end(getOutput(results)))
    .catch(error => {
      response.writeHead(500);
      response.end(error.message);
    });
});

const livereloadServer = livereload.createServer({
  exts: ['scss', 'twig'],
});

livereloadServer.watch(path.resolve(__dirname, '..', coinsMail.TEMPLATES_DIR));

server.listen(port, (error) => {
  /* eslint-disable no-console */
  if (error) {
    console.error(error);
    server.close();
  } else {
    console.log('Server listening on: http://localhost:%s', port);
  }
  /* eslint-enable no-console */
});
