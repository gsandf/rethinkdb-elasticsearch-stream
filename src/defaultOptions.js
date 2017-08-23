export default {
  // If the Elasticsearch instance should be populated with the existing RethinkDB data
  backfill: true,

  // Connection details for an Elasticsearch instance
  elasticsearch: {
    host: '127.0.0.1',
    port: 9200
  },

  // Connection details for the RethinkDB instance to be copied
  // See [rethinkdbdash](https://github.com/neumino/rethinkdbdash) for all possible options.
  rethinkdb: {
    host: '127.0.0.1',
    port: 28015
  },

  // Tables to duplicate and watch for changes
  tables: [],

  // If the Elasticsearch instance should be updated when RethinkDB emits a changefeed event
  watch: true
};
