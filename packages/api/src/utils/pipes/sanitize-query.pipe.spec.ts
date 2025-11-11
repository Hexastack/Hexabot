/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { SanitizeQueryPipe } from './sanitize-query.pipe';

describe('SanitizeQueryPipe', () => {
  let pipe: SanitizeQueryPipe;

  beforeEach(() => {
    pipe = new SanitizeQueryPipe(20); // max length 20 for testing
  });

  it('should return empty string for non-string input', () => {
    expect(SanitizeQueryPipe.sanitize(123 as any)).toBe('');
    expect(SanitizeQueryPipe.sanitize(null)).toBe('');
    expect(SanitizeQueryPipe.sanitize(undefined)).toBe('');
  });

  it('should trim whitespace', () => {
    expect(SanitizeQueryPipe.sanitize('  hello  ')).toBe('hello');
  });

  it('should remove control characters and DEL', () => {
    const input = 'hello\u0000\u001F\u007Fworld';
    expect(SanitizeQueryPipe.sanitize(input)).toBe('helloworld');
  });

  it('should remove dangerous characters', () => {
    const input = 'price$ = {100}; \\ /';
    expect(SanitizeQueryPipe.sanitize(input)).toBe('price  =  100');
  });

  it('should remove quotes', () => {
    const input = `"hello" 'world'`;
    expect(SanitizeQueryPipe.sanitize(input)).toBe('hello   world');
  });

  it('should remove regex/meta characters', () => {
    const input = '^*?+()[]|';
    expect(SanitizeQueryPipe.sanitize(input)).toBe('');
  });

  it('should enforce maxLength', () => {
    const input = 'new-query-performed'; // 21 chars
    expect(SanitizeQueryPipe.sanitize(input, 10)).toBe('new-query-');
  });

  it('should combine all sanitizations', () => {
    const input = `  $hello^world* 'test' {abc} \\ `;
    const sanitized = SanitizeQueryPipe.sanitize(input);
    expect(sanitized).toBe('hello world   test   abc');
  });

  describe('transform (instance method)', () => {
    it('should call sanitize with the instance maxLength', () => {
      const input = 'new-query-performed'; // 21 chars
      expect(pipe.transform(input, {} as any)).toBe(
        'new-query-performed'.slice(0, 20),
      );
    });

    it('should handle non-string input', () => {
      expect(pipe.transform(42, {} as any)).toBe('');
    });
  });
});
