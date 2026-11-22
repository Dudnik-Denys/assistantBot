import { expect, test } from 'bun:test';
import { buildPrefixTsQuery } from '#core/notes/search.ts';

test('buildPrefixTsQuery', () => {
	expect(buildPrefixTsQuery('Погода  Киев')).toBe('погода:* & киев:*');
	expect(buildPrefixTsQuery("a' | b & !c")).toBe('a:* & b:* & c:*');
	expect(buildPrefixTsQuery('github.com/foo')).toBe('github:* & com:* & foo:*');
	expect(buildPrefixTsQuery('  !!! ')).toBeNull();
});
