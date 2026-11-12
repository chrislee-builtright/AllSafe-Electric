const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = ts.transpileModule(fs.readFileSync('app/actions/submit-estimate.ts','utf8'), { compilerOptions: { module:ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ES2022 } }).outputText;

// Controllable fakes for the three delivery layers.
const state = { saved: [], saveFails: false, emailFails: false, opsEmails: [], webhookPayload: null, recorded: [], opsMarked: [] };
const env = {};
const mod = {exports:{}};
vm.runInNewContext(source, {
 exports:mod.exports, require(name) {
  if(name==='next/headers') return {headers:async()=>new Headers({referer:'https://allsafehomeservice.com/outlet-gfci-repair/?email=private@example.com'})};
  if(name==='node:crypto') return require(name);
  if(name==='@/lib/attribution') return {attributionKeys:['gclid','gbraid','wbraid','utm_source','utm_medium','utm_campaign','utm_term','utm_content','landing_page']};
  if(name==='@/lib/business') return {business:{phone:{display:'(303) 648-1934'},email:{leads:'example@example.com',public:'example@example.com'}}};
  if(name==='@/lib/services') return {services:[]};
  if(name==='@/lib/cities') return {citySlugs:['parker-co']};
  if(name==='@/lib/leadStore') return {
    saveLead: async (lead) => { if (state.saveFails) throw new Error('db down'); state.saved.push(lead); return true; },
    recordDelivery: async (id, r) => { state.recorded.push({id, ...r}); },
    markOpsNotified: async (t, id) => { state.opsMarked.push(id); },
  };
  if(name==='@/lib/leadEmail') return {
    sendLeadAlert: async () => { if (state.emailFails) throw new Error('resend 403'); },
    sendOpsAlert: async (subject, text) => { state.opsEmails.push({subject, text}); return true; },
    formatLead: (l) => `lead ${l.leadId}`,
  };
  throw Error(name);
 }, process:{env}, console:{info(){},error(){}}, File, FormData, Headers, AbortSignal, URL, Promise, JSON, Date, Object, String, Number, Set, Array, RegExp,
 fetch:async(_,init)=>{state.webhookPayload=JSON.parse(init.body);return {ok:true}},
});
function form(consent='granted') { const f=new FormData(); Object.entries({name:'Setup Test',phone:'2025550142',email:'test@example.com',zip:'80134',message:'Internal test only',submission_id:'AS-12345678-1234-1234-1234-123456789abc',measurement_consent:consent,gclid:'example-click',utm_campaign:'repair'}).forEach(([k,v])=>f.set(k,v));return f; }
const reset = () => { state.saved=[]; state.saveFails=false; state.emailFails=false; state.opsEmails=[]; state.recorded=[]; state.opsMarked=[]; state.webhookPayload=null; delete env.BRD_LEAD_LOG_WEBHOOK_URL; };

(async()=>{
 const submit=mod.exports.submitEstimate;

 // Validation still rejects bad input and keeps the values.
 reset();
 const invalid=form();invalid.set('zip','');
 const bad=await submit({},invalid); assert.equal(bad.ok,false); assert.equal(bad.values.name,'Setup Test'); assert.equal(state.saved.length,0);

 // 1. Happy path: saved first, owner emailed, no backstop noise.
 reset();
 const first=await submit({},form()); assert.equal(first.ok,true);
 assert.equal(state.saved.length,1,'lead is saved to the database'); assert.equal(state.saved[0].gclid,'example-click'); assert.equal(state.saved[0].referer,'/outlet-gfci-repair/');
 assert.equal(state.recorded[0].alertSent,true); assert.equal(state.opsEmails.length,0,'no backstop alert when everything works');

 // 2. Retry keeps the same dedupe ID.
 const second=await submit({},form()); assert.equal(first.leadId,second.leadId,'retry preserves deduplication ID');

 // 3. Consent denied strips attribution.
 reset(); await submit({},form('denied'));
 assert.equal(state.saved[0].gclid,''); assert.equal(state.saved[0].utm_campaign,''); assert.equal(state.saved[0].measurement_consent,'denied');

 // 4. Owner email FAILS: customer still gets success (lead is saved), BRD backstop is alerted, row marked failed for the cron.
 reset(); state.emailFails=true;
 const r4=await submit({},form()); assert.equal(r4.ok,true,'saved lead is confirmed even if email fails');
 assert.equal(state.recorded[0].alertSent,false); assert.match(state.recorded[0].alertError,/resend 403/);
 assert.equal(state.opsEmails.length,1,'backstop alert sent'); assert.match(state.opsEmails[0].text,/Owner email to Jud FAILED/);
 assert.equal(state.opsMarked.length,1);

 // 5. Database FAILS but email works: lead still delivered, backstop told the DB is down.
 reset(); state.saveFails=true;
 const r5=await submit({},form()); assert.equal(r5.ok,true);
 assert.equal(state.opsEmails.length,1); assert.match(state.opsEmails[0].text,/Database save FAILED/);

 // 6. Everything fails: the customer is told to call, values retained, backstop still alerted.
 reset(); state.saveFails=true; state.emailFails=true;
 const r6=await submit({},form()); assert.equal(r6.ok,false); assert.match(r6.error,/call/i); assert.equal(r6.values.name,'Setup Test');
 assert.equal(state.opsEmails.length,1);

 // 7. Webhook payload still carries the lead.
 reset(); env.BRD_LEAD_LOG_WEBHOOK_URL='https://example.invalid/test';
 await submit({},form()); assert.equal(state.webhookPayload.is_test,false);

 console.log('Lead safety-net tests passed: save-first, owner email, backstop alert, DB-down, total-failure, consent, retry ID.');
})().catch(e=>{console.error(e);process.exitCode=1});
