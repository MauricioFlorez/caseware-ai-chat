/**
 * Environment configuration. Single access point; validate at startup, fail fast.
 * No process.env elsewhere in application code.
 */

function getEnv(name: string): string {
  const v = process.env[name];
  if (v === undefined || v === '') {
    throw new Error(`Missing or empty required environment variable: ${name}`);
  }
  return v;
}

function getEnvOptional(name: string, defaultValue: string): string {
  const v = process.env[name];
  return v !== undefined && v !== '' ? v : defaultValue;
}

const PORT_RAW = getEnv('PORT');
const PORT = parseInt(PORT_RAW, 10);
if (Number.isNaN(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error(`Invalid PORT: ${PORT_RAW}. Must be 1-65535.`);
}

const STREAM_CHUNK_SIZE_RAW = getEnvOptional('STREAM_CHUNK_SIZE', '50');
const STREAM_CHUNK_SIZE = parseInt(STREAM_CHUNK_SIZE_RAW, 10);
if (Number.isNaN(STREAM_CHUNK_SIZE) || STREAM_CHUNK_SIZE < 1) {
  throw new Error(`Invalid STREAM_CHUNK_SIZE: ${STREAM_CHUNK_SIZE_RAW}. Must be a positive number.`);
}

const STREAM_CHUNK_BY = getEnvOptional('STREAM_CHUNK_BY', 'word');
if (STREAM_CHUNK_BY !== 'word' && STREAM_CHUNK_BY !== 'size') {
  throw new Error(`Invalid STREAM_CHUNK_BY: ${STREAM_CHUNK_BY}. Must be "word" or "size".`);
}

const CORS_ORIGIN = getEnvOptional('CORS_ORIGIN', 'http://localhost:4200');

export const config = {
  PORT,
  STREAM_CHUNK_SIZE,
  STREAM_CHUNK_BY: STREAM_CHUNK_BY as 'word' | 'size',
  CORS_ORIGIN,
} as const;
