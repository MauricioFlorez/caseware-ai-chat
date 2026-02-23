/**
 * Stream event contract per contracts/mock-stream-api.md.
 * Discriminated union for delta, done, error.
 */

export type StreamEventDelta = {
  type: 'delta';
  text: string;
};

export type StreamEventDone = {
  type: 'done';
};

export type StreamEventError = {
  type: 'error';
  message: string;
};

export type StreamEvent = StreamEventDelta | StreamEventDone | StreamEventError;
