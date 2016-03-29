<img src="https://raw.githubusercontent.com/MRN-Code/coins-mail/master/img/coins-mail@2x.jpg" width="450" height="105" alt="COINS Mail" />

_HTML and text email templates for COINS._

## Example

```js
const coinsMail = require('coins-mail');

coinsMail({
  html: {
    myHtmlTemplateVar: '<h1>Hi!</h1> <p>Insert this html…</p>',
  },
  text: {
    myTextTemplateVar: 'Alternative!\n\nFor the text version…',
  },
}, (error, result) => {
  if (error) {
    console.error(error);
  } else {
    console.log('HTML:', result.html);
    console.log('Text:', result.text);
  }
});
```

`coinsMail` also returns a `Promise`:

```js
coinsMail(myLocals)
  .then(result => {
    console.log('HTML:', result.html);
    console.log('Text:', result.text);
  })
  .catch(error => console.error(error));
```

## License

MIT. See [LICENSE](./LICENSE) for details.
