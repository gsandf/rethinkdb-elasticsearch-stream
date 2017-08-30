import rethinkdbdash from 'rethinkdbdash';

export const elasticsearch = {
  host: 'elasticsearch',
  port: 9200,
  url: 'http://elasticsearch:9200'
};

export const rethinkdb = {
  host: 'rethinkdb',
  port: 28015,
  silent: true
};

export const r = rethinkdbdash(rethinkdb);

export { default as data } from './data';
