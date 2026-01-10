import { RMultiplePipe } from './r-multiple.pipe';

describe('RMultiplePipe', () => {
  it('formats r-multiple values with suffix', () => {
    const pipe = new RMultiplePipe();
    expect(pipe.transform(1.234)).toBe('+1.23R');
  });

  it('omits sign when disabled', () => {
    const pipe = new RMultiplePipe();
    expect(pipe.transform(-0.5, 2, false)).toBe('-0.50R');
  });

  it('handles empty values', () => {
    const pipe = new RMultiplePipe();
    expect(pipe.transform(undefined)).toBe('—');
  });
});
