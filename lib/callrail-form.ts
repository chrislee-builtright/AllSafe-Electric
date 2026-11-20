import { measurementChoice } from './attribution';

type CaptureWindow = Window & {
  CallTrk?: { captureForm: (form: HTMLFormElement) => void };
};

/** Only call after the server has accepted the request. Never capture rejected attempts. */
export async function captureAcceptedForm(form: HTMLFormElement, leadId: string): Promise<void> {
  if (!/^AS-[0-9a-f-]{36}$/i.test(leadId)) return;
  const key = `allsafe-callrail-${leadId}`;
  const permitted = () => measurementChoice() !== false &&
    !(navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl;
  if (!permitted()) return;
  try { if (sessionStorage.getItem(key)) return; } catch { /* storage may be blocked */ }
  // The script may still be loading when a visitor completes the form quickly.
  for (let attempt = 0; attempt < 40; attempt++) {
    if (!permitted()) return;
    const capture = (window as CaptureWindow).CallTrk?.captureForm;
    if (capture) {
      try {
        capture(form);
        try { sessionStorage.setItem(key, '1'); } catch { /* use component guard */ }
      } catch (error) {
        console.warn('[callrail] accepted form could not be captured', error);
      }
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  console.warn('[callrail] form capture unavailable; request is still saved and delivered');
}

/** Keep submitted values before React resets/unmounts the visible form. Exclude security fields. */
export function acceptedFormSnapshot(formId: string, data: FormData): HTMLFormElement {
  const form = document.createElement('form');
  form.id = formId;
  form.method = 'post';
  for (const name of ['name', 'phone', 'email', 'zip', 'service', 'when', 'message', 'submission_id']) {
    const value = data.get(name);
    if (typeof value !== 'string' || !value) continue;
    const input = document.createElement('input');
    input.name = name;
    input.value = value;
    input.type = name === 'email' ? 'email' : name === 'phone' ? 'tel' : 'text';
    form.appendChild(input);
  }
  return form;
}
