import test from 'ava';
import urlString from './url-string';

test('urlString: returns URL string from object', t => {
  t.is(
    urlString({ host: 'localhost', port: 80, protocol: 'http' }),
    'http://localhost:80'
  );

  t.is(
    urlString({ host: 'test.com', port: 123, protocol: 'https' }),
    'https://test.com:123'
  );

  t.is(
    urlString({ host: '123.255.91.45', port: 5555 }),
    'http://123.255.91.45:5555'
  );

  t.is(urlString({ port: 4321 }), 'http://127.0.0.1:4321');
});
