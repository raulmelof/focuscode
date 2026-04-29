import { formatTime } from '../formatTime';

describe('formatTime', () => {
  it('formats exactly 0 seconds correctly', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('formats exactly 1 minute correctly', () => {
    expect(formatTime(60)).toBe('01:00');
  });

  it('formats partial minutes correctly', () => {
    expect(formatTime(65)).toBe('01:05');
  });

  it('formats large numbers correctly', () => {
    expect(formatTime(3600)).toBe('60:00');
  });
});
