import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeUrl,
  parseStored,
  formatBookmark,
  generateSlug,
  addBookmark,
} from '../src/lib/bookmarks.ts';

test('URL with and without https:// normalises to the same value', () => {
  const a = normalizeUrl('www.example.com');
  const b = normalizeUrl('https://www.example.com');
  assert.equal(a, 'https://www.example.com');
  assert.equal(a, b);
  assert.equal(normalizeUrl('not a url'), null);
  assert.equal(normalizeUrl('javascript://x'), null);
});

test('loading bad stored values recovers without throwing', () => {
  const good = { url: 'https://a.com', slug: 'mona-7fk2' };
  assert.deepEqual(parseStored(null), []);
  assert.deepEqual(parseStored(''), []);
  assert.deepEqual(parseStored('{not json'), []);
  assert.deepEqual(parseStored('{"url":"https://a.com"}'), []);
  assert.deepEqual(parseStored('"str"'), []);
  assert.deepEqual(parseStored('["https://a.com","x"]'), []);
  assert.deepEqual(parseStored('[null, 1, {"url":1,"slug":"mona-1"}, {"url":"https://a.com"}]'), []);
  assert.deepEqual(parseStored(JSON.stringify([good, { url: 'https://b.com', slug: 'bad' }])), [good]);
});

test('bookmark formats as "<url> :: <slug>"', () => {
  assert.equal(
    formatBookmark({ url: 'https://www.example.com', slug: 'mona-7fk2' }),
    'https://www.example.com :: mona-7fk2',
  );
});

test('slug is mona- plus base62 and adding avoids duplicates', () => {
  assert.match(generateSlug(), /^mona-[0-9a-zA-Z]{4}$/);
  const first = addBookmark([], 'example.com');
  assert.equal(first.list.length, 1);
  assert.equal(addBookmark(first.list, 'https://example.com').list.length, 1);
  assert.equal(addBookmark(first.list, '').added, null);
});
