(() => {
'use strict';

/* ============ basics ============ */
const TZ = 'America/Chicago';
const KEY = 'qbdental.demo.v4';
const USER_KEY = 'qbdental.v4.user';
const LANG_KEY = 'qbdental.lang';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = p => p + Math.random().toString(36).slice(2, 9);
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY3 = DAYS.map(d => d.slice(0, 3));
const WEEK = [1, 2, 3, 4, 5, 6, 0];
const STATUS = { requested: 'Requested', confirmed: 'Confirmed', checked_in: 'Checked in', completed: 'Completed', cancelled: 'Cancelled', no_show: 'No-show' };
const SOURCES = { website: 'Website', phone: 'Phone', walkin: 'Walk-in' };
const COLORS = ['#12424F', '#2F7D5B', '#B4532A', '#7A5AA6', '#2E6C8A', '#8A5A00'];
const ROLES = {
  doctor: { label: 'Doctor', can: ['view', 'status_clinical', 'reports'] },
  desk: { label: 'Front desk', can: ['view', 'status_clinical', 'status_desk', 'create', 'edit', 'note', 'reports'] },
  manager: { label: 'Office manager', can: ['view', 'status_clinical', 'status_desk', 'create', 'edit', 'note', 'reports', 'delete', 'export', 'settings', 'doctors', 'activity'] }
};
const STATUS_PERM = { requested: 'status_desk', confirmed: 'status_desk', cancelled: 'status_desk', no_show: 'status_desk', checked_in: 'status_clinical', completed: 'status_clinical' };

const pad = n => String(n).padStart(2, '0');
const toMin = t => { const [h, m] = String(t).split(':').map(Number); return h * 60 + m; };
const toHHMM = m => pad(Math.floor(m / 60)) + ':' + pad(m % 60);
const parseD = d => { const [y, m, x] = d.split('-').map(Number); return new Date(Date.UTC(y, m - 1, x)); };
const addDays = (d, n) => { const x = parseD(d); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const dow = d => parseD(d).getUTCDay();
const mondayOf = d => { const w = dow(d); return addDays(d, w === 0 ? -6 : 1 - w); };
const fmtTime = t => { if (!t) return ''; const m = toMin(t); let h = Math.floor(m / 60); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${pad(m % 60)} ${ap}`; };
const fmtDate = (d, o = { weekday: 'short', month: 'short', day: 'numeric' }) => parseD(d).toLocaleDateString('en-US', { ...o, timeZone: 'UTC' });
const fmtLong = d => fmtDate(d, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const digits = s => String(s || '').replace(/\D/g, '');
const fmtPhone = s => { const d = digits(s).replace(/^1(?=\d{10}$)/, ''); return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : String(s || '').trim(); };
const stamp = () => new Date().toISOString();
const fmtStamp = iso => new Date(iso).toLocaleString('en-US', { timeZone: TZ, month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const initials = n => String(n || '').replace(/^Dr\.?\s+/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
function nowParts() {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const p = Object.fromEntries(f.formatToParts(new Date()).map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, min: (+p.hour % 24) * 60 + +p.minute };
}
const makeRef = () => { const a = 'ACDEFGHJKMNPQRTUVWXY34679'; let s = ''; for (let i = 0; i < 5; i++) s += a[Math.floor(Math.random() * a.length)]; return 'QB-' + s; };
const overlaps = (s1, e1, s2, e2) => s1 < e2 && e1 > s2;

/* ============ data ============ */
function baseData() {
  const h = (open, start = '09:30', end = '16:00') => ({ open, start, end });
  const hours = { 0: h(false), 1: h(true), 2: h(true), 3: h(true), 4: h(true), 5: h(false), 6: h(true, '10:00', '14:00') };
  const sched = {}; for (let i = 0; i < 7; i++) sched[i] = { on: hours[i].open, start: hours[i].start, end: hours[i].end };
  return {
    version: 4,
    settings: {
      clinicName: 'QB Dental Implant and Integrative Dentistry', shortName: 'QB Dental', doctorLine: 'Kubra Atici, DDS',
      phone: '(847) 545-8458', street: '1608 N Arlington Heights Rd', city: 'Arlington Heights', state: 'IL', zip: '60004',
      hours, slotInterval: 30, leadHours: 2, maxDays: 60, changeCutoffHours: 24,
      closedDates: [{ date: '2026-11-26', label: 'Thanksgiving' }, { date: '2026-12-24', label: 'Christmas Eve' }],
      bookingEnabled: true, autoConfirm: false, rating: '4.8', ratingCount: '37',
      retention: { inactiveDays: 30, completedDays: 90 },
      notify: { channel: 'sms', to: '(847) 555-0199', events: { request: true, change: true, cancel: true, daily: true } }
    },
    visitTypes: [
      { id: 'v_new', name: 'New patient visit', duration: 60, active: true },
      { id: 'v_clean', name: 'Checkup and cleaning', duration: 60, active: true },
      { id: 'v_consult', name: 'Consultation', duration: 30, active: true },
      { id: 'v_urgent', name: 'Urgent visit', duration: 30, active: true }
    ],
    doctors: [{ id: 'd_kubra', name: 'Dr. Kubra Atici', title: 'DDS', role: 'General, implant and integrative dentistry', role_tr: 'Genel, implant ve bütüncül diş hekimliği', color: COLORS[0], photo: '', active: true, onSite: true, schedule: sched,
      lunch: { on: true, start: '12:30', end: '13:00', days: [1, 2, 3, 4] }, timeOff: [],
      bio: 'Dr. Atici leads the practice. Her focus is dental implants and an integrative approach to everyday care: looking at your mouth as part of your overall health and choosing the most conservative treatment that will last.',
      bio_tr: 'Muayenehaneyi Dr. Atici yönetiyor. Odak noktası diş implantları ve günlük bakımda bütüncül yaklaşım: ağız sağlığınızı genel sağlığınızın bir parçası olarak ele almak ve uzun ömürlü olacak en koruyucu tedaviyi seçmek.' }],
    users: [
      { id: 'u_doc', name: 'Dr. Kubra Atici', role: 'doctor' },
      { id: 'u_desk', name: 'Front desk', role: 'desk' },
      { id: 'u_mgr', name: 'Office manager', role: 'manager' }
    ],
    appointments: [], audit: [], notices: []
  };
}
function rng(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function seed(db) {
  const r = rng(424242), n = nowParts(), doc = db.doctors[0];
  // one example day off for the doctor, about a week and a half out
  for (let i = 8; i < 30; i++) { const d = addDays(n.date, i); if (db.settings.hours[dow(d)].open && doc.schedule[dow(d)].on && !db.settings.closedDates.some(c => c.date === d)) { doc.timeOff = [{ id: uid('o_'), from: d, to: d, label: 'Continuing education' }]; break; } }
  const people = [['Maria', 'Lopez'], ['James', 'Carter'], ['Aylin', 'Demir'], ['Tom', 'Becker'], ['Priya', 'Shah'], ['Nadia', 'Petrova'], ['Kevin', "O'Brien"], ['Hannah', 'Kim'], ['Luis', 'Romero'], ['Grace', 'Walsh'], ['Omar', 'Haddad'], ['Elena', 'Rossi'], ['Mehmet', 'Yilmaz'], ['Zeynep', 'Kaya']];
  let pi = 0;
  for (let off = -26; off <= 14; off++) {
    const d = addDays(n.date, off);
    const cnt = off === 0 ? 4 : Math.abs(off) <= 3 ? 3 : (r() < .5 ? 2 : 3);
    for (let k = 0; k < cnt; k++) {
      const vt = db.visitTypes[Math.floor(r() * db.visitTypes.length)];
      const sl = slots(db, d, vt.id, 'any', { ignoreLead: true, ignoreLimits: true });
      if (!sl.length) break;
      const s = sl[Math.floor(r() * sl.length)];
      const p = people[pi++ % people.length];
      let status;
      if (off < 0) { const x = r(); status = x < .1 ? 'no_show' : x < .2 ? 'cancelled' : 'completed'; }
      else if (off === 0) status = toMin(s.time) + vt.duration <= n.min ? 'completed' : toMin(s.time) <= n.min ? 'checked_in' : 'confirmed';
      else status = off <= 4 && r() < .45 ? 'requested' : 'confirmed';
      const lead = Math.max(1, Math.round(2 + r() * 12));
      const created = new Date(parseD(d).getTime() - lead * 864e5 + 15 * 36e5).toISOString();
      const turkish = p[1] === 'Demir' || p[1] === 'Yilmaz' || p[1] === 'Kaya';
      db.appointments.push({ id: uid('a_'), ref: makeRef(), createdAt: created, source: r() < .68 ? 'website' : 'phone', status,
        visitTypeId: vt.id, doctorId: s.doctorIds[0], date: d, time: s.time, duration: vt.duration,
        patient: { first: p[0], last: p[1], phone: `(847) 555-01${pad(10 + (pi % 90))}`, email: r() < .6 ? `${p[0].toLowerCase()}@example.com` : '', returning: r() < .6, sms: r() < .7, lang: turkish ? 'tr' : 'en' },
        note: '', history: [{ at: created, text: 'Created (demo data)' }], demo: true });
    }
  }
  // example change requests and an online cancellation
  const fut = db.appointments.filter(a => a.status === 'confirmed' && a.date >= addDays(n.date, 2)).sort((a, b) => (a.date + a.time) < (b.date + b.time) ? -1 : 1);
  const ago = h => new Date(Date.now() - h * 36e5).toISOString();
  if (fut.length >= 5) {
    const [A, B, X] = fut;
    // A asks for a time that is free
    for (let i = 1; i < 10; i++) {
      const d = addDays(A.date, i), sl = slots(db, d, A.visitTypeId, A.doctorId, { ignoreLead: true, excludeId: A.id });
      if (sl.length) { const s = sl[Math.min(1, sl.length - 1)]; A.change = { type: 'reschedule', status: 'pending', date: d, time: s.time, doctorId: A.doctorId, fromDate: A.date, fromTime: A.time, at: ago(3) }; A.history.push({ at: ago(3), text: `Patient asked online to move to ${fmtDate(d)} ${fmtTime(s.time)}` }); break; }
    }
    // B asks for a time that is already taken
    const C = fut.find(x => x !== A && x !== B && x !== X && x.date !== B.date && x.doctorId === B.doctorId);
    if (C) { B.change = { type: 'reschedule', status: 'pending', date: C.date, time: C.time, doctorId: C.doctorId, fromDate: B.date, fromTime: B.time, at: ago(1) }; B.history.push({ at: ago(1), text: `Patient asked online to move to ${fmtDate(C.date)} ${fmtTime(C.time)}` }); }
    // X cancelled online yesterday
    X.status = 'cancelled'; X.change = { type: 'cancel', status: 'done', at: ago(20) }; X.history.push({ at: ago(20), text: 'Cancelled by the patient online' });
  }
  db.notices.push({ at: ago(20), kind: 'cancel', channel: 'sms', text: noticeText('cancel', db) }, { at: ago(3), kind: 'change', channel: 'sms', text: noticeText('change', db) }, { at: ago(1), kind: 'change', channel: 'sms', text: noticeText('change', db) });
}
let MEM = null;
function load() { try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch (e) { } return MEM ? JSON.parse(MEM) : null; }
function save() { const s = JSON.stringify(DB); MEM = s; try { localStorage.setItem(KEY, s); } catch (e) { } }
function migrate(db) {
  const b = baseData();
  db.settings = { ...b.settings, ...db.settings, retention: { ...b.settings.retention, ...(db.settings || {}).retention }, notify: { ...b.settings.notify, ...(db.settings || {}).notify } };
  ['visitTypes', 'doctors', 'users', 'appointments', 'audit', 'notices'].forEach(k => { if (!Array.isArray(db[k])) db[k] = b[k]; });
  db.doctors.forEach(d => { if (!d.lunch) d.lunch = { on: false, start: '12:30', end: '13:00', days: [1, 2, 3, 4, 5] }; if (!Array.isArray(d.timeOff)) d.timeOff = []; });
  return db;
}
function fresh() { const db = baseData(); seed(db); db.audit.push({ at: stamp(), user: 'System', action: 'Demo data created', target: '' }); return db; }
// clean up earlier demos, which stored data under other keys
try { ['qbdental.demo.v1', 'qbdental.demo.v2', 'qbdental.demo.v3'].forEach(k => localStorage.removeItem(k)); } catch (e) { }

const vtById = id => DB.visitTypes.find(v => v.id === id);
const docById = id => DB.doctors.find(d => d.id === id);
const apById = id => DB.appointments.find(a => a.id === id);
const fullName = p => `${p.first || ''} ${p.last || ''}`.trim();

/* ============ availability ============ */
const offOn = (d, date) => (d.timeOff || []).find(o => date >= o.from && date <= (o.to || o.from));
const lunchOn = (d, date) => d.lunch && d.lunch.on && (d.lunch.days || []).includes(dow(date)) ? [toMin(d.lunch.start), toMin(d.lunch.end)] : null;
function slots(db, date, vtId, pref, o = {}) {
  const S = db.settings, vt = db.visitTypes.find(v => v.id === vtId), dur = vt ? vt.duration : 30, n = nowParts();
  if (!o.ignoreLimits && (date < n.date || date > addDays(n.date, S.maxDays))) return [];
  if (S.closedDates.some(c => c.date === date)) return [];
  const ch = S.hours[dow(date)]; if (!ch || !ch.open) return [];
  const docs = db.doctors.filter(d => d.active && (pref === 'any' || d.id === pref));
  const map = new Map(), step = +S.slotInterval || 30;
  for (const d of docs) {
    const ds = d.schedule[dow(date)]; if (!ds || !ds.on || offOn(d, date)) continue;
    const st = Math.max(toMin(ch.start), toMin(ds.start)), en = Math.min(toMin(ch.end), toMin(ds.end)), lb = lunchOn(d, date);
    const busy = db.appointments.filter(a => a.doctorId === d.id && a.date === date && a.id !== o.excludeId && a.status !== 'cancelled').map(a => [toMin(a.time), toMin(a.time) + a.duration]);
    if (lb) busy.push(lb);
    for (let t = st; t + dur <= en; t += step) {
      if (!o.ignoreLead && date === n.date && t < n.min + (+S.leadHours || 0) * 60) continue;
      if (busy.some(([s, e]) => overlaps(t, t + dur, s, e))) continue;
      const k = toHHMM(t); if (!map.has(k)) map.set(k, []); map.get(k).push(d.id);
    }
  }
  return [...map.entries()].sort((a, b) => a[0] < b[0] ? -1 : 1).map(([time, doctorIds]) => ({ time, doctorIds }));
}
const slotsFor = (...a) => slots(DB, ...a);
// Everything that would stop appointment `a` from moving to date/time with doctorId. Used by the change-request review.
function conflictsFor(a, date, time, doctorId) {
  const out = [], S = DB.settings, d = docById(doctorId), s = toMin(time), e = s + a.duration, w = dow(date), n = nowParts();
  if (date < n.date || (date === n.date && s <= n.min)) out.push({ kind: 'past', text: 'This time has already passed' });
  const cd = S.closedDates.find(c => c.date === date); if (cd) out.push({ kind: 'closed', text: `The office is closed that day${cd.label ? ' (' + cd.label + ')' : ''}` });
  const ch = S.hours[w]; if (!cd && (!ch.open || s < toMin(ch.start) || e > toMin(ch.end))) out.push({ kind: 'hours', text: 'Outside opening hours' });
  if (d) {
    const ds = d.schedule[w], off = offOn(d, date), lb = lunchOn(d, date);
    if (off) out.push({ kind: 'off', text: `${d.name} is off that day (${off.label || 'time off'})` });
    else if (ch.open && (!ds || !ds.on || s < toMin(ds.start) || e > toMin(ds.end))) out.push({ kind: 'doctor', text: `Outside ${d.name}'s working hours` });
    if (lb && overlaps(s, e, lb[0], lb[1])) out.push({ kind: 'lunch', text: `Overlaps the lunch break, ${fmtTime(d.lunch.start)} to ${fmtTime(d.lunch.end)}` });
  }
  DB.appointments.filter(x => x.id !== a.id && x.doctorId === doctorId && x.date === date && x.status !== 'cancelled' && overlaps(s, e, toMin(x.time), toMin(x.time) + x.duration))
    .forEach(x => out.push({ kind: 'appt', id: x.id, text: `Overlaps ${fmtTime(x.time)} ${fullName(x.patient)}, ${(vtById(x.visitTypeId) || {}).name || 'appointment'}` }));
  DB.appointments.filter(x => x.id !== a.id && x.change && x.change.status === 'pending' && x.change.type === 'reschedule' && x.change.doctorId === doctorId && x.change.date === date && overlaps(s, e, toMin(x.change.time), toMin(x.change.time) + x.duration))
    .forEach(x => out.push({ kind: 'pending', soft: true, text: `${fullName(x.patient)} has also asked for this time` }));
  return out;
}
const hardConflicts = (a, date, time, doctorId) => conflictsFor(a, date, time, doctorId).filter(c => !c.soft);
function openState() {
  const S = DB.settings, n = nowParts(), h = S.hours[dow(n.date)], closed = S.closedDates.some(c => c.date === n.date);
  if (!closed && h.open && n.min >= toMin(h.start) && n.min < toMin(h.end)) return { open: true, k: 'until', t: h.end };
  if (!closed && h.open && n.min < toMin(h.start)) return { open: false, k: 'today', t: h.start };
  for (let i = 1; i <= 14; i++) { const d = addDays(n.date, i), x = S.hours[dow(d)]; if (x.open && !S.closedDates.some(c => c.date === d)) return { open: false, k: i === 1 ? 'tomorrow' : 'day', day: dow(d), t: x.start }; }
  return { open: false, k: 'closed' };
}

/* ============ notifications (simulated) ============ */
// Messages to the practice owner never include patient names, visit types, dates or times.
function noticeText(kind, db = DB) {
  const nm = db.settings.shortName, n = nowParts().date;
  if (kind === 'request') return `${nm}: A new appointment request is waiting. Open the staff panel to review it.`;
  if (kind === 'change') return `${nm}: A patient asked to change an appointment. Open the staff panel to review it.`;
  if (kind === 'cancel') return `${nm}: A patient cancelled an appointment online and a time is free again. Open the staff panel for details.`;
  if (kind === 'daily') { const today = db.appointments.filter(a => a.date === n && a.status !== 'cancelled').length, wait = db.appointments.filter(a => (a.status === 'requested' && a.date >= n) || (a.change && a.change.status === 'pending')).length; return `${nm} today: ${today} visit${today === 1 ? '' : 's'} booked, ${wait} request${wait === 1 ? '' : 's'} waiting.`; }
  return `${nm}: This is a test message from your staff panel.`;
}
function notify(kind) {
  const N = DB.settings.notify; if (kind !== 'test' && !(N.events || {})[kind]) return null;
  const x = { at: stamp(), kind, channel: N.channel, text: noticeText(kind) };
  DB.notices.push(x); if (DB.notices.length > 300) DB.notices = DB.notices.slice(-300);
  return x;
}

/* ============ retention (automatic deletion) ============ */
const INACTIVE = ['cancelled', 'no_show', 'requested'];
function deleteDate(a) {
  const R = DB.settings.retention;
  if (a.status === 'requested' && a.date >= nowParts().date) return null;
  if (a.status === 'completed') return addDays(a.date, +R.completedDays);
  if (INACTIVE.includes(a.status)) return addDays(a.date, +R.inactiveDays);
  return null; // confirmed / checked in: kept until the visit is resolved
}
function runRetention(user = 'System') {
  const today = nowParts().date; const before = DB.appointments.length;
  DB.appointments = DB.appointments.filter(a => { const d = deleteDate(a); return !(d && d < today && a.date < today); });
  const gone = before - DB.appointments.length;
  if (gone) { log(user, 'Automatic deletion', `${gone} appointment${gone === 1 ? '' : 's'} past the retention period`); }
  return gone;
}
function log(user, action, target) { DB.audit.push({ at: stamp(), user, action, target }); if (DB.audit.length > 2000) DB.audit = DB.audit.slice(-2000); }

/* ============ load data (after every helper above is defined) ============ */
let DB = load(); DB = DB ? migrate(DB) : fresh(); save();

