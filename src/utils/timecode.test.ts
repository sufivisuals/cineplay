import { expect, test, describe } from 'bun:test';
import { secondsToTimecode, frameToSeconds, secondsToFrame } from './timecode';

describe('SMPTE Timecode Math Engine', () => {
  test('converts seconds to timecode accurately for 24 fps', () => {
    const tc = secondsToTimecode(4.0, 24);
    expect(tc.formatted).toBe('00:00:04:00');
    expect(tc.totalFrames).toBe(96);
  });

  test('converts seconds to timecode accurately for 23.976 fps', () => {
    const tc = secondsToTimecode(10.0, 23.976);
    expect(tc.totalFrames).toBe(239);
    expect(tc.seconds).toBe(9);
  });

  test('converts frame number to seconds', () => {
    const secs = frameToSeconds(48, 24);
    expect(secs).toBe(2.0);
  });

  test('converts seconds to frame count', () => {
    const frame = secondsToFrame(5.5, 30);
    expect(frame).toBe(165);
  });
});
