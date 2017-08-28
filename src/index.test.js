import test from 'ava';
import elasticsearchStream from '.';

test('title', t => {
  elasticsearchStream({
    elasticsearch: { host: 'elasticsearch', port: 9200 },
    rethinkdb: { host: 'rethinkdb', port: 28015, silent: true },
    tables: [
      {
        db: 'lochinvar',
        table: 'users',
        transform: ({ db, document, table }) => {
          if (document.email) {
            return { email: document.email };
          }
        }
      }
    ],
    watch: false
  });

  t.pass();
});
