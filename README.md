# NOTICE
This repo was moved into the quarterback mono repo
https://github.com/MRN-Code/quarterback/tree/master/packages/coins-mail

<img src="https://raw.githubusercontent.com/MRN-Code/coins-mail/master/img/coins-mail@2x.jpg" width="450" height="105" alt="COINS Mail" />

_HTML and text email templates for COINS._

## Example

### Create Mail

The `createMail` is coins-mail’s chief export. It expects a configured [Bookshelf.js](http://bookshelfjs.org/) model:

```js
const knex = require('knex')({
  /* DB config ... */
});
const bookshelf = require('bookshelf')(knex);
const createMail = require('coins-mail').createMail;

const MyMailModel = bookshelf.Model.extend({
  tableName: 'my_table_name',
});

createMail(MyMailModel, options); // returns Promise
```

`createMail` returns a Promise. In the case of a single mail option, this is the result of calling [`save` on a Bookshelf.js model](http://bookshelfjs.org/#Model-instance-save). In the case of a collection of mail options, this is the result of [invoking `save` on the Bookshelf collection](http://bookshelfjs.org/#Collection-static-forge).

#### Options:

`options` can be either a mail options object or a collection of these objects:

* `fromLabel` (string): Added to the `from_label` column. This is typically the name of application sending the email.
* `recipients` (string or array of strings): Single recipient email address or a collection of email addresses.
* `replyTo` (string): Email address to use in the email’s 'reply to' field.
* `subject` (string): Email’s subject field.
* `templateLocals` (object): Hash to pass to `getTemplate`. The keys/values depend on the email template in use (see `templateName`).
* `sendTime` (string, defaults to `Date.now()`): Time to send the email.
* `templateName` (string, defaults to “default“): Name of email template to use.

#### Single email

```js
  createMail(MyMailModel, {
    fromLabel: 'Test Application',,
    recipients: [
      'recipient-1@mrn.org',
      'recipeint-2@mrn.org',
      'recipient-3@mrn.org',
      // ...
    ],
    replyTo: 'reply-address@mrn.org',
    sendTime: Date.now() + 24 * 60 * 60 * 1000,
    subject: 'Test Subject',
    templateLocals: {
      html: {
        myHtmlTemplateVar: 'value',
      },
      text: {
        myTextTemplateVar: 'value',
      },
    },
    templateName: 'my-template',
  })
    .then(savedModel => console.log(savedModel))
    .catch(error => console.error(error));
```

#### Multiple emails
```js

createMail(MyMailModel, [{
  fromLabel: 'Test Application 1',
  recipients: 'recipient-1@mrn.org'
  replyTo: 'reply-address@mrn.org',
  subject: 'Test Subject 1',
  templateLocals: // ...
}, {
  fromLabel: 'Test Application 2',
  recipients: 'recipient-2@mrn.org'
  replyTo: 'reply-address@mrn.org',
  subject: 'Test Subject 2',
  templateLocals: // ...
}, {
  fromLabel: 'Test Application 3',
  recipients: 'recipient-3@mrn.org'
  replyTo: 'reply-address@mrn.org',
  subject: 'Test Subject 3',
  templateLocals: // ...
}])
  .then(savedModels => {
    savedModels.forEach(savedModel => console.log(savedModel));
  })
  .catch(error => console.error(error));
```

### Template

```js
const getTemplate = require('coins-mail').getTemplate;

getTemplate({
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

`getTemplate` also returns a `Promise`:

```js
getTemplate(myLocals)
  .then(result => {
    console.log('HTML:', result.html);
    console.log('Text:', result.text);
  })
  .catch(error => console.error(error));
```

## License

MIT. See [LICENSE](./LICENSE) for details.
