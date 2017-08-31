import axios from 'axios';
import rethinkdbdash from 'rethinkdbdash';
import backfillTable from './backfill-table';
import defaultOptions from './defaultOptions';
import ensureTables from './ensure-tables';
import urlString from './url-string';
import watchTable from './watch-table';

// The base URL for the Elasticsearch server
let elasticsearchBaseUrl;
// A handle to the RethinkDB driver instance
let r;

async function init(extraOptions) {
  const options = {
    ...defaultOptions,
    ...extraOptions
  };

  elasticsearchBaseUrl = urlString(options.elasticsearch);
  r = rethinkdbdash(options.rethinkdb);

  // If an error is thrown, try to cleanup connection pool before throwing error to handler
  try {
    await ensureConnections(options.elasticsearch);
    await ensureTables(r, options.tables);
  } catch (e) {
    await cleanup();
    throw e;
  }

  if (options.watch) {
    options.tables.forEach(tableDetails =>
      watchTable(r, { baseURL: elasticsearchBaseUrl, ...tableDetails })
    );
  }

  if (options.backfill) {
    const backfillPromises = options.tables.map(tableDetails =>
      backfillTable(r, {
        baseURL: elasticsearchBaseUrl,
        ...tableDetails
      })
    );

    await Promise.all(backfillPromises);
  }

  // If nothing is to be done, cleanup connections and exit
  if (!options.watch) {
    cleanup();
  }
}

async function cleanup() {
  return r.getPoolMaster().drain();
}

/**
 * Make sure a connection can be made to the services needed.
 */
async function ensureConnections() {
  // `rethinkdbdash` hanldes RethinkDB's connection pools, so we're ignoring that for now
  const elasticsearchResponse = await axios.get(elasticsearchBaseUrl);
  const elasticsearchHealthy =
    typeof elasticsearchResponse.data.cluster_uuid === 'string';

  if (!elasticsearchHealthy) {
    throw new Error('Could not connect to Elasticsearch server');
  }
}

export default init;
