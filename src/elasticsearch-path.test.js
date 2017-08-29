import test from 'ava';
import elasticsearchPath from './elasticsearch-path';

test('elasticsearchPath: return a root path if nothing supplied', t => {
  t.is(elasticsearchPath(), '/');
  t.is(elasticsearchPath({}), '/');
  t.is(elasticsearchPath({ unrelated: 53 }), '/');
});

test('elasticsearchPath: return path with db if only db supplied', t => {
  t.is(elasticsearchPath({ db: 'cool' }), '/cool');
  t.is(elasticsearchPath({ db: 'super-corporate' }), '/super-corporate');
});

test('elasticsearchPath: do not allow table but no db', t => {
  t.throws(() => elasticsearchPath({ table: 'nodb' }));
});

test('elasticsearchPath: return path with db and table if both supplied', t => {
  t.is(elasticsearchPath({ db: 'pets', table: 'goats' }), '/pets/goats');
});

test('elasticsearchPath: should only accept string types', t => {
  t.throws(() => elasticsearchPath({ db: 43 }), TypeError);
  t.throws(() => elasticsearchPath({ table: NaN }), TypeError);
  t.throws(() => elasticsearchPath({ db: null, table: 2 }), TypeError);
});
