import assert from 'node:assert/strict';
import { captureAcceptedForm } from '../lib/callrail-form';
import { setMeasurementChoice } from '../lib/attribution';

async function main() {
  const data = new Map<string, string>();
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
    removeItem: (key: string) => data.delete(key),
  };
  let captures = 0;
  const fakeWindow = { dispatchEvent() {}, CallTrk: { captureForm() { captures++; } } };
  Object.assign(globalThis, { window: fakeWindow, localStorage: storage, sessionStorage: storage });
  const form = {} as HTMLFormElement;
  const id = (n: number) => `AS-00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
  await captureAcceptedForm(form, 'ignored');
  assert.equal(captures, 0, 'silent bot drops never become captures');
  await captureAcceptedForm(form, id(1));
  await captureAcceptedForm(form, id(1));
  assert.equal(captures, 1, 'one capture per accepted submission despite rerenders');
  setMeasurementChoice(false);
  await captureAcceptedForm(form, id(2));
  assert.equal(captures, 1, 'decline prevents capture');
  setMeasurementChoice(true);
  Object.defineProperty(navigator, 'globalPrivacyControl', {value:true, configurable:true});
  await captureAcceptedForm(form, id(3));
  assert.equal(captures, 1, 'GPC prevents capture');
  Object.defineProperty(navigator, 'globalPrivacyControl', {value:false, configurable:true});
  await captureAcceptedForm(form, id(4));
  assert.equal(captures, 2, 'accepted submissions are captured after consent');
  console.log('CallRail ignored-submission, duplicate, consent and GPC tests passed.');
}
void main();
