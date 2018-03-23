# rethinkdb-elasticsearch-stream

> 🔄 sync RethinkDB tables to Elasticsearch using [changefeeds](https://rethinkdb.com/docs/changefeeds/javascript/)

[![Build Status](https://travis-ci.org/gsandf/rethinkdb-elasticsearch-stream.svg?branch=master)](https://travis-ci.org/gsandf/rethinkdb-elasticsearch-stream)
[![Greenkeeper badge](https://badges.greenkeeper.io/gsandf/rethinkdb-elasticsearch-stream.svg)](https://greenkeeper.io/)

A JavaScript-based replacement for the deprecated [Elasticsearch RethinkDB River](https://github.com/rethinkdb/elasticsearch-river-rethinkdb) plugin.  This can populate your Elasticsearch instance using data from a RethinkDB instance, keep it up to date using changefeeds, and allow you to modify the documents before they're copied.

**✨ Features:**

- **Simple:** specify connections and tables to copy as-is to Elasticsearch
- **Flexible:** accepts a transform function for each table to modify what's copied
- **[Tested](https://travis-ci.org/gsandf/rethinkdb-elasticsearch-stream)**

## Usage

**Simple example:**

```js
import rethinkdbElasticsearchStream from 'rethinkdb-elasticsearch-stream'

await rethinkdbElasticsearchStream({
  backfill: true,
  elasticsearch: { host: '127.0.0.1', port: 9200 },
  rethinkdb: { host: '127.0.0.1', port: 28015 },
  tables: [{ db: 'megacorp', table: 'users' }],
  watch: true
});
```

**Everything:**

```js
import rethinkdbElasticsearchStream from 'rethinkdb-elasticsearch-stream'

await rethinkdbElasticsearchStream({
  // If the Elasticsearch instance should be populated with existing RethinkDB data
  backfill: true,

  // Connection details for an Elasticsearch instance
  elasticsearch: {
    host: '127.0.0.1',
    port: 9200,
    // (optional) protocol for connection (`http` or `https`).  Defaults to `http`.
    protocol: 'http'
  },

  // Connection details for the RethinkDB instance to be copied
  // See `rethinkdbdash` (https://github.com/neumino/rethinkdbdash) for all possible options.
  rethinkdb: {
    host: '127.0.0.1',
    port: 28015,
    // (optional) protocol for connection (`http` or `https`).  Defaults to `http`.
    protocol: 'http'
  },

  // Tables to duplicate and watch for changes
  tables: [
    {
      // Database containing table
      db: 'megacorp',
      // (optional) Handle when a document is deleted in Rethink
      // This is detected when the new value for a document is null
      // If this is not specified, a DELETE is sent to Elasticsearch for the
      // id of the old value
      deleteTransform: async ({db, document, oldDocument, table }) => {
        if (await someImportantCheck()) {
          return oldDocument;
        }

        // this is the default behavior for a delete
        return {
          // import { _delete } from 'rethinkdb-elasticsearch-stream';
          //
          // this is a special Symbol that tells the library that this should
          // be a DELETE. It can also be used in the regular transform function
          _delete
          id: oldDocument.id,
        }
      },
      // (optional) Type field for Elasticsearch.  This is similar to a "table" in
      // RethinkDB, and is the second portion of the URL path (index/db is the first).
      esType: 'webUsers',
      // (optional) ID field.  If specified, changes are upserted into Elasticsearch
      // Note: Elasticsearch-specific field names cannot be used (e.g. `_id`)
      // If that's important to you, open an issue.
      idKey: 'id',
      // Table to copy
      table: 'users',
      // (optional) Modify what will be saved in Elasticsearch.
      // This can be either a function or a Promise.
      // If `null` or `undefined` is returned, the document is not saved.
      // `db` and `table` are specified for convenience
      transform: async ({ db, document, oldDocument, table }) => {
        await doSomethingImportant()
        return document;
      }
    }
  ],

  // If the Elasticsearch instance should be updated when RethinkDB emits a changefeed event
  watch: true
});
```

## Install

With [Yarn](https://yarnpkg.com/en/) _or_ [npm](https://npmjs.org/) installed, run:

```bash
yarn add rethinkdb-elasticsearch-stream

# ...or, if using `npm`
npm install rethinkdb-elasticsearch-stream
```

## See Also

rethinkdb-elasticsearch-stream was inspired by:

- [Elasticsearch RethinkDB River (deprecated)](https://github.com/rethinkdb/elasticsearch-river-rethinkdb)
- [`bhurlow/rubber`](https://github.com/bhurlow/rubber)

## License

MIT
