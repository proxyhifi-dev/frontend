import { PercentFormatPipe } from './percent-format.pipe';

describe('PercentFormatPipe', () => {
  it('formats percent values with default decimals', () => {
    const pipe = new PercentFormatPipe();
    expect(pipe.transform(12.3456)).toBe('12.35%');
  });

  it('adds sign when requested', () => {
    const pipe = new PercentFormatPipe();
    expect(pipe.transform(5, 1, true)).toBe('+5.0%');
    expect(pipe.transform(-3, 1, true)).toBe('-3.0%');
  });

  it('handles empty values', () => {
    const pipe = new PercentFormatPipe();
    expect(pipe.transform(undefined)).toBe('—');
  });
});
