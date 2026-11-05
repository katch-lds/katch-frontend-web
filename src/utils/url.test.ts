/**
 * @jest-environment node
 */
import { trimTrailingSlashes } from './url';

describe('trimTrailingSlashes', () => {
  it.each([
    ['http://localhost:5180', 'http://localhost:5180'],
    ['http://localhost:5180/', 'http://localhost:5180'],
    ['https://api.test///', 'https://api.test'],
    ['', ''],
    ['///', ''],
  ])('converte %p em %p', (input, expected) => {
    expect(trimTrailingSlashes(input)).toBe(expected);
  });
});
