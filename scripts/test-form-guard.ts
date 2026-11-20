import assert from 'node:assert/strict';
import { verifyRecaptcha, looksLikeSpam, rateLimited } from '../lib/formGuard';

async function main() {
  const originalFetch = globalThis.fetch;
  const originalSecret = process.env.RECAPTCHA_SECRET_KEY;
  const originalUrl = process.env.VERCEL_URL;
  const oldError = console.error;
  console.error = () => {};
  process.env.RECAPTCHA_SECRET_KEY = 'test-only-not-a-real-secret';
  process.env.VERCEL_URL = 'allsafe-test.vercel.app';
  try {
    const response = (patch = {}) => {
      globalThis.fetch = async () => new Response(JSON.stringify({
        success: true, score: 0.9, action: 'estimate', hostname: 'allsafehomeservice.com', ...patch,
      }));
    };
    response();
    assert.equal((await verifyRecaptcha('token', 'estimate', null)).ok, true);
    assert.equal((await verifyRecaptcha('', 'estimate', null)).ok, false);
    for (const patch of [
      { success: false }, { score: 0.1 }, { action: 'other' },
      { hostname: 'attacker.vercel.app' }, { hostname: '' },
    ]) {
      response(patch);
      assert.equal((await verifyRecaptcha('token', 'estimate', null)).ok, false);
    }
    globalThis.fetch = async () => { throw new Error('offline'); };
    assert.equal((await verifyRecaptcha('token', 'estimate', null)).ok, false);
    delete process.env.RECAPTCHA_SECRET_KEY;
    assert.equal((await verifyRecaptcha('token', 'estimate', null)).ok, false);
    assert.equal(await rateLimited('192.0.2.1'), true, 'unconfigured limiter fails closed');
    assert.equal(looksLikeSpam({name:'Pat Smith',email:'pat@example.com',message:'My kitchen outlet has stopped working.'}), false);
    assert.equal(looksLikeSpam({name:'Pat\r\nBcc: spam@example.com',email:'pat@example.com',message:'Help please'}), true);
    console.log('CAPTCHA success, rejection, hostname/action checks, outages, configuration and spam tests passed.');
  } finally {
    globalThis.fetch = originalFetch;
    console.error = oldError;
    if (originalSecret === undefined) delete process.env.RECAPTCHA_SECRET_KEY;
    else process.env.RECAPTCHA_SECRET_KEY = originalSecret;
    if (originalUrl === undefined) delete process.env.VERCEL_URL;
    else process.env.VERCEL_URL = originalUrl;
  }
}
void main();
