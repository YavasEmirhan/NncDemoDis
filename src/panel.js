/* ============ panel ============ */
const AV = { view: 'schedule', mode: 'day', day: '', range: 'upcoming', status: 'all', q: '', tab: 'hours', rr: 'past', drawer: null };
const me = () => { let id = null; try { id = sessionStorage.getItem(USER_KEY); } catch (e) { id = window.__qbUser; } return DB.users.find(u => u.id === id) || null; };
const setMe = id => { try { id ? sessionStorage.setItem(USER_KEY, id) : sessionStorage.removeItem(USER_KEY); } catch (e) { } window.__qbUser = id; };
const can = p => { const u = me(); return !!u && ROLES[u.role].can.includes(p); };
const svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const ICON = {
  schedule: svg('<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  requests: svg('<path d="M4 13l2.5-7.5h11L20 13v5a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 18z"/><path d="M4 13h4.5l1 2.5h5l1-2.5H20"/>'),
  appointments: svg('<path d="M8 6.5h12M8 12h12M8 17.5h12"/><circle cx="4" cy="6.5" r=".8"/><circle cx="4" cy="12" r=".8"/><circle cx="4" cy="17.5" r=".8"/>'),
  reports: svg('<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>'),
  team: svg('<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c1-4 4-6.2 7.5-6.2s6.5 2.2 7.5 6.2"/>'),
  settings: svg('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>')
};
const VIEWS = [['schedule', 'Schedule', 'view'], ['requests', 'Requests', 'view'], ['appointments', 'Appointments', 'view'], ['reports', 'Reports', 'reports'], ['team', 'Team', 'doctors'], ['settings', 'Settings', 'settings']];
const byWhen = (a, b) => (a.date + a.time) < (b.date + b.time) ? -1 : 1;
const pendingList = () => DB.appointments.filter(a => a.status === 'requested' && a.date >= nowParts().date).sort(byWhen);
const changeList = () => DB.appointments.filter(a => a.change && a.change.type === 'reschedule' && a.change.status === 'pending' && !['cancelled', 'completed', 'no_show'].includes(a.status)).sort((a, b) => a.change.at < b.change.at ? -1 : 1);
const cancelledOnline = () => DB.appointments.filter(a => a.status === 'cancelled' && a.change && a.change.type === 'cancel' && a.change.at > new Date(Date.now() - 14 * 864e5).toISOString()).sort((a, b) => a.change.at < b.change.at ? 1 : -1);
const waitingCount = () => pendingList().length + changeList().length;
const multiDoc = () => DB.doctors.filter(d => d.active).length > 1;
const ago = iso => { const m = Math.round((Date.now() - new Date(iso)) / 6e4); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };
const rowConflicts = a => ['requested', 'confirmed'].includes(a.status) && a.date >= nowParts().date ? hardConflicts(a, a.date, a.time, a.doctorId).filter(c => c.kind !== 'past') : [];
function nextAction(a) {
  if (a.status === 'requested' && can('status_desk')) return ['confirmed', 'Confirm'];
  if (a.status === 'confirmed' && a.date === nowParts().date && can('status_clinical')) return ['checked_in', 'Check in'];
  if (a.status === 'checked_in' && can('status_clinical')) return ['completed', 'Complete'];
  return null;
}

function renderLogin() {
  document.title = `Staff login | ${DB.settings.shortName}`;
  const hint = { doctor: 'Sees the schedule and reports, checks patients in', desk: 'Books, confirms and moves appointments', manager: 'Everything, plus team, settings and data' };
  root().innerHTML = `<div class="login"><div class="login__box">
    <span class="logo">${logo(true)}</span>
    <h1>Staff login</h1><p class="muted">Choose a demo account. In the live version everyone signs in with their own password and a second step.</p>
    <div class="who">${DB.users.map(u => `<button data-act="login" data-id="${u.id}">${u.role === 'doctor' ? avatar(DB.doctors[0]) : `<span class="avatar" style="background:var(--ink-3)">${esc(initials(u.name))}</span>`}<span><b>${esc(u.name)}</b><small>${hint[u.role]}</small></span></button>`).join('')}</div>
    <a href="#/" style="font-size:14.5px">Back to the website</a>
  </div></div>`;
}
function renderAdmin() {
  const u = me(); if (!u) return renderLogin();
  if (!VIEWS.some(v => v[0] === AV.view && can(v[2]))) AV.view = 'schedule';
  const title = VIEWS.find(v => v[0] === AV.view)[1], w = waitingCount();
  document.title = `${title} | ${DB.settings.shortName}`;
  root().innerHTML = `<div class="app" id="app">
    <aside class="side" aria-label="Panel"><a class="logo" href="#/admin/schedule">${logo(true)}</a>
      <nav>${VIEWS.filter(v => can(v[2])).map(([k, l]) => `<a href="#/admin/${k}" class="${AV.view === k ? 'is-on' : ''}" ${AV.view === k ? 'aria-current="page"' : ''}>${ICON[k]}${l}${k === 'requests' && w ? `<span class="count">${w}</span>` : ''}</a>`).join('')}</nav>
      <div class="side__foot"><b>${esc(u.name)}</b><p>${u.name === ROLES[u.role].label ? 'Signed in' : ROLES[u.role].label}</p><a href="#/" target="_blank">View website</a> &nbsp; <a href="#" data-act="logout">Sign out</a><br><span class="side__demo">Demo, fictional data</span></div>
    </aside>
    <div class="main">
      <header class="page-head"><button class="side-toggle" data-act="side-toggle" aria-label="Menu"><svg width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
        <h1>${title}</h1>${can('create') ? '<button class="btn btn--ink btn--sm" data-act="new">New appointment</button>' : ''}</header>
      <div class="content" id="content">${viewHTML()}</div>
    </div></div>`;
}
function refresh() {
  const c = $('#content'); if (!c) return renderAdmin(); c.innerHTML = viewHTML();
  const link = $('.side nav a[href="#/admin/requests"]'); if (link) { const o = link.querySelector('.count'); if (o) o.remove(); const n = waitingCount(); if (n) link.insertAdjacentHTML('beforeend', `<span class="count">${n}</span>`); }
}
function viewHTML() { return ({ requests: vRequests, appointments: vAppointments, reports: vReports, team: vTeam, settings: vSettings }[AV.view] || vSchedule)(); }

const tag = (t, cls = '') => `<span class="tag ${cls}">${t}</span>`;
function rowHTML(a, withDate) {
  const vt = vtById(a.visitTypeId), d = docById(a.doctorId), na = nextAction(a), cf = rowConflicts(a), ch = a.change && a.change.status === 'pending' && a.change.type === 'reschedule';
  return `<li class="row" data-act="open" data-id="${a.id}" tabindex="0" role="button"><time>${withDate ? fmtDate(a.date, { month: 'short', day: 'numeric' }) + ', ' : ''}${fmtTime(a.time)}<small>${a.duration} min</small></time><span class="row__bar" style="background:${d ? d.color : 'var(--line-2)'}"></span>
    <span class="row__who"><b>${esc(fullName(a.patient))}</b><span>${esc(vt ? vt.name : '')}${a.patient.returning || a.visitTypeId === 'v_new' ? '' : ', new patient'}${multiDoc() && d ? ', ' + esc(d.name) : ''}</span>
      ${ch || cf.length || a.patient.lang === 'tr' ? `<span class="tags">${ch ? tag('Change requested', 'tag--amber') : ''}${cf.length ? tag('Conflict: ' + esc(cf[0].kind === 'appt' ? 'double booked' : cf[0].kind === 'off' ? 'doctor off' : cf[0].kind === 'lunch' ? 'lunch break' : 'outside hours'), 'tag--red') : ''}${a.patient.lang === 'tr' ? tag('Turkish') : ''}</span>` : ''}</span>
    ${badge(a.status)}${na ? `<button class="btn btn--line btn--sm" data-act="status" data-id="${a.id}" data-st="${na[0]}">${na[1]}</button>` : '<span></span>'}</li>`;
}
function reqHTML(a) {
  const vt = vtById(a.visitTypeId);
  return `<div class="req"><b>${esc(fullName(a.patient))}${a.patient.lang === 'tr' ? ' ' + tag('Turkish') : ''}</b><span>${fmtDate(a.date, { weekday: 'short', month: 'short', day: 'numeric' })}, ${fmtTime(a.time)}</span><span>${esc(vt ? vt.name : '')}${a.patient.returning || a.visitTypeId === 'v_new' ? '' : ', new patient'}, ${ago(a.createdAt)}</span>
    <div class="req__act">${can('status_desk') ? `<button class="btn btn--ink btn--sm" data-act="status" data-id="${a.id}" data-st="confirmed">Confirm</button><button class="btn btn--line btn--sm" data-act="status" data-id="${a.id}" data-st="cancelled">Decline</button>` : ''}<button class="btn btn--line btn--sm" data-act="open" data-id="${a.id}">Details</button></div></div>`;
}
// A patient's online request to move their visit, with everything that would clash with the new time.
function changeBlock(a, full) {
  const c = a.change, cf = conflictsFor(a, c.date, c.time, c.doctorId), hard = cf.filter(x => !x.soft), soft = cf.filter(x => x.soft);
  const alts = hard.length ? slotsFor(c.date, a.visitTypeId, c.doctorId, { excludeId: a.id, ignoreLead: true }).filter(s => Math.abs(toMin(s.time) - toMin(c.time)) <= 180).slice(0, 4) : [];
  const desk = can('status_desk');
  return `<div class="chg ${hard.length ? 'is-bad' : 'is-ok'}">
    ${full ? '' : `<b class="chg__who">${esc(fullName(a.patient))}${a.patient.lang === 'tr' ? ' ' + tag('Turkish') : ''}</b>`}
    <dl class="chg__move"><dt>Now</dt><dd><s>${fmtDate(c.fromDate || a.date)}, ${fmtTime(c.fromTime || a.time)}</s></dd><dt>Asks for</dt><dd><b>${fmtDate(c.date)}, ${fmtTime(c.time)}</b></dd></dl>
    <p class="chg__meta">${esc((vtById(a.visitTypeId) || {}).name || '')}, ${a.duration} min. Asked online ${ago(c.at)}.</p>
    ${hard.length ? `<ul class="chg__list">${hard.map(x => `<li>${x.id ? `<button class="linkbtn" data-act="open" data-id="${x.id}">${esc(x.text)}</button>` : esc(x.text)}</li>`).join('')}</ul>` : `<p class="chg__ok">No conflicts. The new time is free.</p>`}
    ${soft.map(x => `<p class="chg__soft">${esc(x.text)}</p>`).join('')}
    ${desk ? `<div class="req__act">${hard.length ? '' : `<button class="btn btn--ink btn--sm" data-act="chg-ok" data-id="${a.id}">Approve new time</button>`}<button class="btn btn--line btn--sm" data-act="chg-no" data-id="${a.id}">Decline</button>${full ? '' : `<button class="btn btn--line btn--sm" data-act="open" data-id="${a.id}">Details</button>`}</div>
      ${hard.length ? (alts.length ? `<div class="chg__alts"><p>Free times that day. Choosing one moves the visit there; call the patient to let them know.</p><div>${alts.map(s => `<button class="chip" data-act="chg-alt" data-id="${a.id}" data-time="${s.time}">${fmtTime(s.time)}</button>`).join('')}</div></div>` : '<p class="chg__soft">No free times near that time on that day. Decline and call the patient, or move the visit from its details.</p>') : ''}` : ''}
  </div>`;
}
function cancelHTML(a) {
  const vt = vtById(a.visitTypeId);
  return `<div class="req"><b>${esc(fullName(a.patient))}</b><span>Was ${fmtDate(a.date, { weekday: 'short', month: 'short', day: 'numeric' })}, ${fmtTime(a.time)}, ${esc(vt ? vt.name : '')}</span><span>Cancelled online ${ago(a.change.at)}. ${a.date >= nowParts().date ? 'The time is free again.' : ''}</span>
    <div class="req__act"><button class="btn btn--line btn--sm" data-act="open" data-id="${a.id}">Details</button></div></div>`;
}
const isClosed = d => !DB.settings.hours[dow(d)].open || DB.settings.closedDates.some(c => c.date === d);
const allOff = d => { const ds = DB.doctors.filter(x => x.active); return ds.length > 0 && ds.every(x => offOn(x, d) || !(x.schedule[dow(d)] || {}).on); };
function vSchedule() {
  const n = nowParts(); if (!AV.day) AV.day = n.date;
  const mon = mondayOf(AV.day), days = [...Array(7)].map((_, i) => addDays(mon, i));
  const count = d => DB.appointments.filter(a => a.date === d && a.status !== 'cancelled').length;
  const title = AV.mode === 'week' ? `${fmtDate(days[0], { month: 'long', day: 'numeric' })} to ${fmtDate(days[6], { month: 'long', day: 'numeric' })}` : `${AV.day === n.date ? 'Today, ' : ''}${fmtDate(AV.day, { weekday: 'long', month: 'long', day: 'numeric' })}`;
  const head = `<div class="daynav"><h2>${title}</h2><div class="daynav__ctl">
      <button class="iconbtn" data-act="week" data-v="-7" aria-label="Previous week">‹</button><button class="btn btn--line btn--sm" data-act="week" data-v="0">Today</button><button class="iconbtn" data-act="week" data-v="7" aria-label="Next week">›</button>
      <div class="seg" role="group" aria-label="View"><button class="${AV.mode === 'day' ? 'is-on' : ''}" data-act="mode" data-v="day">Day</button><button class="${AV.mode === 'week' ? 'is-on' : ''}" data-act="mode" data-v="week">Week</button></div>
      ${AV.mode === 'day' ? `<button class="btn btn--line btn--sm" data-act="print" data-v="${AV.day}">Print day</button>` : ''}</div></div>`;
  if (AV.mode === 'week') return head + weekGrid(days);
  const strip = `<div class="weekstrip">${days.map(d => { const c = count(d), cl = isClosed(d), off = !cl && allOff(d); return `<button class="wday ${d === AV.day ? 'is-on' : ''} ${d === n.date ? 'is-today' : ''} ${cl || off ? 'is-closed' : ''}" data-act="day" data-v="${d}" aria-pressed="${d === AV.day}"><small>${DAY3[dow(d)]}</small><b>${+d.slice(8)}</b><i>${cl ? 'Closed' : off ? 'Time off' : c ? `${c} visit${c === 1 ? '' : 's'}` : 'Free'}</i></button>`; }).join('')}</div>`;
  const appts = DB.appointments.filter(a => a.date === AV.day && a.status !== 'cancelled');
  const breaks = isClosed(AV.day) ? [] : DB.doctors.filter(d => d.active && (d.schedule[dow(AV.day)] || {}).on && !offOn(d, AV.day) && lunchOn(d, AV.day)).map(d => ({ brk: true, d, time: d.lunch.start }));
  const items = [...appts, ...breaks].sort((a, b) => a.time < b.time ? -1 : a.time > b.time ? 1 : (a.brk ? 1 : -1));
  const offs = DB.doctors.filter(d => d.active).map(d => [d, offOn(d, AV.day)]).filter(x => x[1]);
  const vt0 = DB.visitTypes.filter(v => v.active).sort((a, b) => a.duration - b.duration)[0], open = !isClosed(AV.day) && AV.day >= n.date && vt0 ? slotsFor(AV.day, vt0.id, 'any', { ignoreLead: true, ignoreLimits: true }).filter(s => AV.day > n.date || toMin(s.time) > n.min) : [];
  const arrived = appts.filter(a => ['checked_in', 'completed'].includes(a.status)).length;
  const brkRow = b => `<li class="row row--break"><time>${fmtTime(b.d.lunch.start)}<small>${toMin(b.d.lunch.end) - toMin(b.d.lunch.start)} min</small></time><span class="row__bar"></span><span class="row__who"><b>Lunch break</b><span>${esc(b.d.name)}</span></span><span></span><span></span></li>`;
  const pend = pendingList(), chg = changeList(), w = pend.length + chg.length;
  return `${head}${strip}<div class="sch">
    <div><section class="card">
      ${offs.map(([d, o]) => `<div class="offbar"><b>${esc(d.name)} is off:</b> ${esc(o.label || 'Time off')}. ${multiDoc() ? 'Patients can\'t book this doctor online this day.' : 'Online booking is closed this day.'}</div>`).join('')}
      <ul class="list">${appts.length ? items.map(x => x.brk ? brkRow(x) : rowHTML(x)).join('') : `<li class="none"><b>${isClosed(AV.day) ? 'The office is closed this day' : offs.length ? 'No visits on this day off' : 'Nothing booked yet'}</b>${isClosed(AV.day) ? 'Change opening hours in Settings.' : offs.length ? 'Time off is set in Team.' : 'Website requests and new appointments will show here.'}</li>`}</ul>
      ${open.length && can('create') ? `<div class="open"><p>Open times, ${vt0.duration} minutes. Pick one to add an appointment.</p><div>${open.slice(0, 14).map(s => `<button class="chip" data-act="new" data-date="${AV.day}" data-time="${s.time}">${fmtTime(s.time)}</button>`).join('')}</div></div>` : ''}
    </section></div>
    <aside>
      <section class="card"><div class="stats"><div class="stat"><b>${appts.length}</b><span>Booked</span></div><div class="stat"><b>${arrived}</b><span>Arrived</span></div><div class="stat"><b>${open.length}</b><span>Open times</span></div></div></section>
      <section class="card"><div class="card__head"><h3>Waiting for you</h3><span>${w}</span></div>
        ${chg.slice(0, 2).map(a => `<div class="req req--chg"><p class="req__kind">Change request</p>${changeBlock(a)}</div>`).join('')}
        ${pend.slice(0, Math.max(0, 4 - Math.min(2, chg.length))).map(reqHTML).join('')}
        ${w > 4 || chg.length > 2 ? `<div class="req"><a href="#/admin/requests">See all ${w} in Requests</a></div>` : ''}
        ${w ? '' : '<div class="none"><b>All caught up</b>New website requests and change requests land here.</div>'}</section>
    </aside></div>`;
}
function weekGrid(days) {
  const n = nowParts(), S = DB.settings, opens = Object.values(S.hours).filter(h => h.open);
  const sH = Math.max(6, Math.floor(Math.min(...opens.map(h => toMin(h.start)), 540) / 60) - 1), eH = Math.min(22, Math.ceil(Math.max(...opens.map(h => toMin(h.end)), 1020) / 60) + 1);
  const rows = (eH - sH) * 2, px = 24, t0 = sH * 60, mk = can('create'), y = m => (m - t0) / 30 * px;
  const cols = days.map(d => {
    const closed = isClosed(d), off = !closed && allOff(d);
    const sl = [...Array(rows)].map((_, i) => `<div class="cal__slot ${mk && !closed && !off ? 'can' : ''}" ${mk && !closed && !off ? `data-act="new" data-date="${d}" data-time="${toHHMM(t0 + i * 30)}"` : ''}></div>`).join('');
    const br = closed || off ? '' : DB.doctors.filter(x => x.active && (x.schedule[dow(d)] || {}).on && !offOn(x, d) && lunchOn(x, d)).map(x => { const [s, e] = lunchOn(x, d); return `<div class="cal__break" style="top:${y(s)}px;height:${(e - s) / 30 * px}px">Lunch</div>`; }).join('');
    const bl = DB.appointments.filter(a => a.date === d).map(a => { const doc = docById(a.doctorId), cf = rowConflicts(a).length; return `<div class="cal__appt ${['cancelled', 'no_show'].includes(a.status) ? 'is-off' : ''} ${a.status === 'requested' ? 'is-req' : ''} ${cf ? 'is-bad' : ''}" style="top:${y(toMin(a.time))}px;height:${Math.max(px - 2, a.duration / 30 * px - 2)}px;border-color:${doc ? doc.color : 'var(--ink)'}" data-act="open" data-id="${a.id}" tabindex="0" role="button"><b>${fmtTime(a.time)} ${esc(fullName(a.patient))}</b>${esc((vtById(a.visitTypeId) || {}).name || '')}</div>`; }).join('');
    const gh = DB.appointments.filter(a => a.change && a.change.status === 'pending' && a.change.type === 'reschedule' && a.change.date === d).map(a => `<div class="cal__appt is-ghost" style="top:${y(toMin(a.change.time))}px;height:${Math.max(px - 2, a.duration / 30 * px - 2)}px" data-act="open" data-id="${a.id}" tabindex="0" role="button"><b>Requested: ${esc(fullName(a.patient))}</b>Change request</div>`).join('');
    const nl = d === n.date && n.min >= t0 && n.min <= eH * 60 ? `<div class="cal__now" style="top:${y(n.min)}px"></div>` : '';
    return `<div class="cal__day ${closed || off ? 'is-closed' : ''}">${off ? '<span class="cal__offlabel">Time off</span>' : ''}${sl}${br}${bl}${gh}${nl}</div>`;
  }).join('');
  return `<div style="overflow-x:auto"><div class="cal" style="min-width:820px"><div class="cal__head" style="grid-template-columns:64px repeat(7,1fr)"><div></div>${days.map(d => `<div class="${d === n.date ? 'is-today' : ''}">${DAY3[dow(d)]}<small>${fmtDate(d, { month: 'short', day: 'numeric' })}</small></div>`).join('')}</div>
    <div class="cal__body" style="grid-template-columns:64px repeat(7,1fr)"><div class="cal__times">${[...Array(eH - sH)].map((_, i) => `<div>${fmtTime(toHHMM((sH + i) * 60)).replace(':00', '')}</div>`).join('')}</div>${cols}</div></div></div>
    <p class="hint">Dashed blocks are times patients have asked to move to. Red blocks clash with a break, time off or another visit.</p>`;
}
function vRequests() {
  const p = pendingList(), c = changeList(), x = cancelledOnline();
  return `<div class="reqcols">
    <section class="card"><div class="card__head"><h3>Change requests</h3><span>${c.length}</span></div>
      <p class="card__intro">Patients asked online to move their visit. Their current time stays booked until you approve. The system checks the new time for clashes.</p>
      ${c.length ? c.map(a => `<div class="req req--chg">${changeBlock(a)}</div>`).join('') : '<div class="none"><b>None waiting</b>Requests from the website\'s "Change a visit" page land here.</div>'}</section>
    <div>
      <section class="card"><div class="card__head"><h3>New bookings</h3><span>${p.length}</span></div>
        <p class="card__intro">Booked on the website and waiting for someone to confirm or decline.</p>
        ${p.length ? p.map(reqHTML).join('') : '<div class="none"><b>All caught up</b>There are no new bookings waiting.</div>'}</section>
      <section class="card"><div class="card__head"><h3>Cancelled online</h3><span>Last 14 days</span></div>
        ${x.length ? x.map(cancelHTML).join('') : '<div class="none"><b>None</b>Online cancellations show here so you can offer the time to someone else.</div>'}</section>
    </div></div>`;
}
function filtered() {
  const n = nowParts(), q = AV.q.trim().toLowerCase(); let l = DB.appointments.slice();
  if (AV.range === 'upcoming') l = l.filter(a => a.date >= n.date); if (AV.range === 'past') l = l.filter(a => a.date < n.date);
  if (AV.status !== 'all') l = l.filter(a => a.status === AV.status);
  if (q) l = l.filter(a => [fullName(a.patient), a.patient.phone, digits(a.patient.phone), a.patient.email, a.ref].join(' ').toLowerCase().includes(q));
  const k = a => a.date + a.time; l.sort((a, b) => AV.range === 'upcoming' ? (k(a) < k(b) ? -1 : 1) : (k(a) < k(b) ? 1 : -1)); return l;
}
function aptTable() {
  const l = filtered();
  return l.length ? `<div class="table-wrap"><table class="tbl"><thead><tr><th>When</th><th>Patient</th><th>Visit</th>${multiDoc() ? '<th>Doctor</th>' : ''}<th>Status</th><th>Booked via</th></tr></thead><tbody>
    ${l.map(a => { const vt = vtById(a.visitTypeId), d = docById(a.doctorId); return `<tr data-act="open" data-id="${a.id}" tabindex="0"><td><b>${fmtDate(a.date)}</b><div class="sub">${fmtTime(a.time)}</div></td>
      <td><b>${esc(fullName(a.patient))}</b><div class="sub">${esc(a.patient.phone)}${a.patient.lang === 'tr' ? ', Turkish' : ''}</div></td><td>${esc(vt ? vt.name : '')}<div class="sub">${a.patient.returning ? 'Returning' : 'New patient'}</div></td>${multiDoc() ? `<td>${esc(d ? d.name : '')}</td>` : ''}<td>${badge(a.status)}${a.change && a.change.status === 'pending' ? `<div class="sub">Change requested</div>` : ''}</td><td class="muted">${SOURCES[a.source]}</td></tr>`; }).join('')}
  </tbody></table></div>` : '<div class="none"><b>Nothing matches</b>Try another name, or change the filters.</div>';
}
function vAppointments() {
  return `<div class="toolbar">
    <input type="search" placeholder="Search name, phone or code" value="${esc(AV.q)}" data-act="search" aria-label="Search appointments">
    <div class="seg">${[['upcoming', 'Upcoming'], ['past', 'Past'], ['all', 'All']].map(([k, t]) => `<button class="${AV.range === k ? 'is-on' : ''}" data-act="range" data-v="${k}">${t}</button>`).join('')}</div>
    <select data-filter="status" aria-label="Status"><option value="all">All statuses</option>${Object.entries(STATUS).map(([k, t]) => `<option value="${k}" ${AV.status === k ? 'selected' : ''}>${t}</option>`).join('')}</select>
  </div><section class="card" id="apt-table">${aptTable()}</section>`;
}

/* reports: counts only, no names or contact details */
function capacity(from, to) {
  let m = 0; const S = DB.settings;
  for (let d = from; d <= to; d = addDays(d, 1)) {
    if (isClosed(d)) continue; const ch = S.hours[dow(d)];
    DB.doctors.filter(x => x.active).forEach(x => { const ds = x.schedule[dow(d)]; if (!ds || !ds.on || offOn(x, d)) return; const s = Math.max(toMin(ch.start), toMin(ds.start)), e = Math.min(toMin(ch.end), toMin(ds.end)); if (e <= s) return; let v = e - s; const lb = lunchOn(x, d); if (lb) v -= Math.max(0, Math.min(e, lb[1]) - Math.max(s, lb[0])); m += v; });
  }
  return m;
}
function bars(title, rows, note) {
  const max = Math.max(1, ...rows.map(r => r[1]));
  return `<section class="card"><div class="card__head"><h3>${title}</h3>${note ? `<span>${note}</span>` : ''}</div><div class="card__body"><ul class="bars">${rows.map(([l, v]) => `<li><span>${esc(l)}</span><span class="bars__track"><i style="width:${v ? Math.max(1.5, v / max * 100).toFixed(1) : 0}%"></i></span><b>${v}</b></li>`).join('')}</ul></div></section>`;
}
const pct = (a, b) => b ? Math.round(a / b * 100) + '%' : '–';
function vReports() {
  const n = nowParts(), past = AV.rr !== 'next', from = past ? addDays(n.date, -28) : n.date, to = past ? addDays(n.date, -1) : addDays(n.date, 27);
  const all = DB.appointments.filter(a => a.date >= from && a.date <= to), live = all.filter(a => a.status !== 'cancelled');
  const cnt = f => all.filter(f).length;
  const byType = DB.visitTypes.map(v => [v.name, live.filter(a => a.visitTypeId === v.id).length]).filter(r => r[1] || DB.visitTypes.find(v => v.name === r[0]).active);
  const byDay = WEEK.filter(i => DB.settings.hours[i].open).map(i => [DAYS[i], live.filter(a => dow(a.date) === i).length]);
  const seg = `<div class="toolbar"><div class="seg" role="group" aria-label="Period"><button class="${past ? 'is-on' : ''}" data-act="rr" data-v="past">Last 4 weeks</button><button class="${past ? '' : 'is-on'}" data-act="rr" data-v="next">Next 4 weeks</button></div><span class="muted">${fmtDate(from, { month: 'short', day: 'numeric' })} to ${fmtDate(to, { month: 'short', day: 'numeric' })}</span></div>`;
  let tiles, extra;
  if (past) {
    const done = cnt(a => ['completed', 'checked_in'].includes(a.status)), ns = cnt(a => a.status === 'no_show'), cx = cnt(a => a.status === 'cancelled'), web = cnt(a => a.source === 'website'), np = live.filter(a => !a.patient.returning).length, cxo = cnt(a => a.status === 'cancelled' && a.change && a.change.type === 'cancel');
    tiles = [[done, 'Visits seen'], [pct(ns, done + ns), 'No-show rate', `${ns} missed`], [cx, 'Cancelled', `${cxo} online`], [pct(web, all.length), 'Booked online', `${web} of ${all.length}`], [np, 'New patients']];
    extra = bars('How patients booked', Object.entries(SOURCES).map(([k, l]) => [l, cnt(a => a.source === k)]));
  } else {
    const cap = capacity(from, to), used = live.reduce((s, a) => s + a.duration, 0), wait = cnt(a => a.status === 'requested') + changeList().filter(a => a.change.date >= from && a.change.date <= to).length;
    tiles = [[live.length, 'Visits booked'], [pct(used, cap), 'Schedule filled', `${Math.round(used / 60)} of ${Math.round(cap / 60)} hours`], [Math.max(0, Math.round((cap - used) / 60)), 'Free hours left'], [wait, 'Waiting to confirm']];
    const weeks = [0, 1, 2, 3].map(i => { const s = addDays(mondayOf(n.date), i * 7); return [`Week of ${fmtDate(s, { month: 'short', day: 'numeric' })}`, live.filter(a => a.date >= s && a.date <= addDays(s, 6)).length]; });
    extra = bars('Visits per week', weeks);
  }
  return `${seg}<div class="tiles">${tiles.map(([v, l, s]) => `<div class="tile"><b>${v}</b><span>${l}</span>${s ? `<small>${s}</small>` : ''}</div>`).join('')}</div>
    <div class="cols2">${bars('Visits by type', byType)}${bars('Busiest days', byDay)}</div>${extra}
    <p class="hint">Reports show counts only, never names or contact details. Appointments are deleted automatically 30 to 90 days after the visit, so reports look at four weeks at a time. In the live version we can keep monthly totals (numbers only) to compare months.</p>`;
}
const lunchText = d => d.lunch && d.lunch.on ? `Lunch ${fmtTime(d.lunch.start)} to ${fmtTime(d.lunch.end)}, ${WEEK.filter(i => d.lunch.days.includes(i)).map(i => DAY3[i]).join(', ') || 'no days'}` : 'No lunch break set';
function vTeam() {
  const n = nowParts().date;
  return `<p class="muted" style="margin-bottom:18px">Doctors appear on the website and in online booking. Working days, lunch breaks and time off decide which times patients can pick.</p>
  <div class="doctors">${DB.doctors.map(d => { const off = (d.timeOff || []).filter(o => (o.to || o.from) >= n).sort((a, b) => a.from < b.from ? -1 : 1); return `<article class="dcard"><div class="dcard__top">${avatar(d)}<div><h3>${esc(d.name)}${d.title ? ', ' + esc(d.title) : ''}</h3><p>${esc(d.role)}</p></div></div>
    <div class="sched">${WEEK.map(i => `<span class="${d.schedule[i] && d.schedule[i].on ? 'on' : ''}" title="${DAYS[i]}">${DAY3[i]}</span>`).join('')}</div>
    <ul class="dlist"><li>${lunchText(d)}</li><li>${off.length ? `Time off: ${off.slice(0, 2).map(o => `${fmtDate(o.from, { month: 'short', day: 'numeric' })}${o.to && o.to !== o.from ? ' to ' + fmtDate(o.to, { month: 'short', day: 'numeric' }) : ''} (${esc(o.label || 'time off')})`).join(', ')}` : 'No time off booked'}</li><li>${d.active ? 'Bookable online' : 'Not bookable'}${d.onSite ? '' : ', hidden on the website'}</li></ul>
    <div><button class="btn btn--line btn--sm" data-act="doc" data-id="${d.id}">Edit</button></div></article>`; }).join('')}
  <button class="add-card" data-act="doc" data-id="">Add a doctor</button></div>`;
}
const CH = { sms: 'Text message', whatsapp: 'WhatsApp', email: 'Email' };
function phoneMock(x) {
  const N = DB.settings.notify, ch = x ? x.channel : N.channel, app = { sms: 'Messages', whatsapp: 'WhatsApp', email: 'Mail' }[ch];
  return `<div class="phone" aria-label="Preview of the alert"><div class="phone__bar"><span>9:41</span></div><div class="push"><div class="push__top"><span class="push__app push__app--${ch}">${app}</span><span>${x ? ago(x.at) : 'now'}</span></div><b>${esc(DB.settings.shortName)}</b><p>${esc(x ? x.text : noticeText('request'))}</p></div></div>`;
}
function vSettings() {
  const S = DB.settings, inp = (k, l, t = 'text') => `<div class="field"><label for="s-${k}">${l}</label><input id="s-${k}" type="${t}" data-s="${k}" value="${esc(S[k])}"></div>`;
  const tabs = [['hours', 'Hours'], ['booking', 'Online booking'], ['alerts', 'Alerts'], ['privacy', 'Privacy and data'], ['practice', 'Practice details']];
  let body = '';
  if (AV.tab === 'hours') body = `<div class="cols2">
    <section class="card"><div class="card__head"><h3>Opening hours</h3></div><div class="card__body">
      <div class="week-edit">${WEEK.map(i => { const h = S.hours[i]; return `<span>${DAYS[i]}</span><label class="switch"><input type="checkbox" data-h="${i}" data-f="open" ${h.open ? 'checked' : ''} aria-label="${DAYS[i]} open"><span></span></label><input type="time" data-h="${i}" data-f="start" value="${h.start}" ${h.open ? '' : 'disabled'} aria-label="${DAYS[i]} opens"><input type="time" data-h="${i}" data-f="end" value="${h.end}" ${h.open ? '' : 'disabled'} aria-label="${DAYS[i]} closes">`; }).join('')}</div>
      <p class="hint">The website and online booking update as soon as you save. Lunch breaks and days off for each doctor are set in Team.</p><button class="btn btn--ink btn--sm" style="margin-top:14px" data-act="save-hours">Save hours</button></div></section>
    <section class="card"><div class="card__head"><h3>Office closed</h3><span>Holidays, whole practice</span></div><div class="card__body">
      <ul class="closed-list">${S.closedDates.length ? S.closedDates.slice().sort((a, b) => a.date < b.date ? -1 : 1).map(c => `<li><span><b>${fmtDate(c.date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</b> ${esc(c.label)}</span><button class="linkbtn" data-act="closed-rm" data-v="${c.date}">Remove</button></li>`).join('') : '<li class="muted">None added</li>'}</ul>
      <div class="inline"><div class="field"><label for="cl-d">Date</label><input id="cl-d" type="date"></div><div class="field"><label for="cl-l">Label</label><input id="cl-l" type="text" placeholder="Holiday"></div><button class="btn btn--line btn--sm" data-act="closed-add">Add</button></div></div></section></div>`;
  if (AV.tab === 'booking') body = `<div class="cols2">
    <section class="card"><div class="card__head"><h3>Booking rules</h3></div><div class="card__body">
      <div class="swrow"><div><b>Accept bookings on the website</b><small>When off, the site shows "Call to book".</small></div><label class="switch"><input type="checkbox" data-s="bookingEnabled" ${S.bookingEnabled ? 'checked' : ''}><span></span></label></div>
      <div class="swrow"><div><b>Confirm automatically</b><small>When off, requests wait for the front desk.</small></div><label class="switch"><input type="checkbox" data-s="autoConfirm" ${S.autoConfirm ? 'checked' : ''}><span></span></label></div>
      <div class="grid2" style="margin-top:16px">
        <div class="field"><label for="s-si">Times every</label><select id="s-si" data-s="slotInterval">${[15, 20, 30, 45, 60].map(m => `<option value="${m}" ${+S.slotInterval === m ? 'selected' : ''}>${m} min</option>`).join('')}</select></div>
        <div class="field"><label for="s-lh">Minimum notice</label><select id="s-lh" data-s="leadHours">${[0, 1, 2, 4, 12, 24].map(m => `<option value="${m}" ${+S.leadHours === m ? 'selected' : ''}>${m ? m + ' hours' : 'None'}</option>`).join('')}</select></div>
        <div class="field"><label for="s-md">Book up to</label><select id="s-md" data-s="maxDays">${[14, 30, 60, 90].map(m => `<option value="${m}" ${+S.maxDays === m ? 'selected' : ''}>${m} days ahead</option>`).join('')}</select></div>
        <div class="field"><label for="s-cc">Online changes until</label><select id="s-cc" data-s="changeCutoffHours">${[2, 12, 24, 48].map(m => `<option value="${m}" ${+S.changeCutoffHours === m ? 'selected' : ''}>${m} hours before</option>`).join('')}</select></div></div>
      <p class="hint" style="margin:0 0 14px">Closer to the visit than this, patients are asked to call instead of changing online.</p>
      <button class="btn btn--ink btn--sm" data-act="save-s">Save rules</button></div></section>
    <section class="card"><div class="card__head"><h3>Visit types</h3><span>What patients choose from</span></div><div class="card__body">
      ${DB.visitTypes.map(v => `<div class="vt-row"><input type="text" data-vt="${v.id}" data-f="name" value="${esc(v.name)}" aria-label="Visit type name"><select data-vt="${v.id}" data-f="duration" aria-label="Length">${[15, 20, 30, 45, 60, 90].map(m => `<option value="${m}" ${v.duration === m ? 'selected' : ''}>${m} min</option>`).join('')}</select><label class="switch" title="Bookable online"><input type="checkbox" data-vt="${v.id}" data-f="active" ${v.active ? 'checked' : ''} aria-label="${esc(v.name)} bookable online"><span></span></label></div>`).join('')}
      <div class="row-actions" style="margin-top:14px"><button class="btn btn--ink btn--sm" data-act="save-vt">Save visit types</button><button class="btn btn--line btn--sm" data-act="add-vt">Add a type</button></div>
      <p class="hint">Keep names general, such as "Consultation". The visit type is stored with each appointment. The Turkish site shows a translated name for the four standard types.</p></div></section></div>`;
  if (AV.tab === 'alerts') { const N = S.notify, last = DB.notices.slice().reverse(); body = `<div class="cols2">
    <section class="card"><div class="card__head"><h3>Alerts for the practice owner</h3></div><div class="card__body">
      <div class="field"><span class="lab">Send by</span><div class="seg2">${Object.entries(CH).map(([k, l]) => `<button type="button" data-act="n-ch" data-v="${k}" class="${N.channel === k ? 'is-on' : ''}" aria-pressed="${N.channel === k}">${l}</button>`).join('')}</div></div>
      <div class="field"><label for="n-to">${N.channel === 'email' ? 'Email address' : 'Mobile number'}</label><input id="n-to" type="${N.channel === 'email' ? 'email' : 'tel'}" value="${esc(N.to)}"></div>
      ${[['request', 'New booking request'], ['change', 'Change request from a patient'], ['cancel', 'Online cancellation'], ['daily', 'Morning summary, 7:30 AM']].map(([k, l]) => `<div class="swrow"><div><b>${l}</b></div><label class="switch"><input type="checkbox" data-n="${k}" ${N.events[k] ? 'checked' : ''} aria-label="${l}"><span></span></label></div>`).join('')}
      <p class="hint">Alerts never include patient names, visit types, dates or times. Staff open the panel to see the details.</p>
      <div class="row-actions" style="margin-top:14px"><button class="btn btn--ink btn--sm" data-act="save-n">Save alerts</button><button class="btn btn--line btn--sm" data-act="n-test">Send a test</button><button class="btn btn--line btn--sm" data-act="n-daily">Preview morning summary</button></div></div></section>
    <section class="card"><div class="card__head"><h3>What the owner sees</h3><span>Simulated in this demo</span></div><div class="card__body">
      ${phoneMock(last[0])}
      <h4 class="mini">Sent</h4><ul class="sent">${last.slice(0, 8).map(x => `<li><span>${fmtStamp(x.at)}, ${CH[x.channel]}</span>${esc(x.text)}</li>`).join('') || '<li class="muted">Nothing sent yet</li>'}</ul></div></section></div>`; }
  if (AV.tab === 'privacy') body = `<div class="cols2">
    <div><section class="card"><div class="card__head"><h3>What this panel stores</h3></div><div class="card__body">
        <ul class="data-list"><li><span>Name and mobile phone</span><span>To confirm the visit</span></li><li><span>Email</span><span>Optional</span></li><li><span>Visit type, date, time, doctor</span><span>To run the schedule</span></li><li><span>New or returning</span><span>To plan the visit</span></li><li><span>Text reminders, yes or no</span><span>Patient's choice</span></li><li><span>Website language (English or Turkish)</span><span>To call in the right language</span></li><li><span>Change requests</span><span>New date and time only</span></li></ul>
        <p class="hint">No symptoms, medical history, insurance or date of birth. Treatment records stay in the practice's own dental software. Owner alerts carry no patient details.</p></div></section>
      <section class="card"><div class="card__head"><h3>Automatic deletion</h3></div><div class="card__body">
        <div class="grid2"><div class="field"><label for="r-in">Cancelled, missed or unconfirmed</label><select id="r-in" data-r="inactiveDays">${[7, 14, 30, 60, 90].map(m => `<option value="${m}" ${+S.retention.inactiveDays === m ? 'selected' : ''}>${m} days after the date</option>`).join('')}</select></div>
        <div class="field"><label for="r-co">Completed visits</label><select id="r-co" data-r="completedDays">${[30, 60, 90, 180, 365].map(m => `<option value="${m}" ${+S.retention.completedDays === m ? 'selected' : ''}>${m} days after the visit</option>`).join('')}</select></div></div>
        <div class="row-actions"><button class="btn btn--ink btn--sm" data-act="save-r">Save</button><button class="btn btn--line btn--sm" data-act="run-r">Run deletion now</button><button class="btn btn--line btn--sm" data-act="export">Export appointments (CSV)</button></div></div></section></div>
    <section class="card"><div class="card__head"><h3>Activity log</h3><span>Who did what, newest first</span></div>
      <div class="table-wrap" style="max-height:560px;overflow-y:auto"><table class="tbl"><thead><tr><th>When</th><th>Who</th><th>What</th><th>Record</th></tr></thead><tbody>
      ${DB.audit.slice().reverse().slice(0, 150).map(x => `<tr><td style="white-space:nowrap">${fmtStamp(x.at)}</td><td>${esc(x.user)}</td><td>${esc(x.action)}</td><td>${esc(x.target)}</td></tr>`).join('')}</tbody></table></div></section></div>`;
  if (AV.tab === 'practice') body = `<section class="card" style="max-width:720px"><div class="card__head"><h3>Practice details</h3><span>Shown on the website</span></div><div class="card__body">
      ${inp('clinicName', 'Practice name')}<div class="grid2">${inp('shortName', 'Short name')}${inp('phone', 'Phone', 'tel')}</div>${inp('street', 'Street')}<div class="grid3">${inp('city', 'City')}${inp('state', 'State')}${inp('zip', 'ZIP')}</div><div class="grid2">${inp('rating', 'Google rating')}${inp('ratingCount', 'Number of reviews')}</div>
      <div class="row-actions"><button class="btn btn--ink btn--sm" data-act="save-s">Save details</button><button class="btn btn--danger btn--sm" data-act="reset">Reset demo data</button></div></div></section>`;
  return `<div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" aria-selected="${AV.tab === k}" class="${AV.tab === k ? 'is-on' : ''}" data-act="tab" data-v="${k}">${l}</button>`).join('')}</div>${body}`;
}

/* drawer + modals */
function timeOpts(date, vt, doc, ex, cur) {
  if (!date) return '<option value="">Pick a date</option>';
  const s = slotsFor(date, vt, doc, { ignoreLead: true, ignoreLimits: true, excludeId: ex });
  let h = s.map(x => `<option value="${x.time}" ${x.time === cur ? 'selected' : ''}>${fmtTime(x.time)}</option>`).join('');
  if (cur && !s.some(x => x.time === cur)) h = `<option value="${cur}" selected>${fmtTime(cur)}</option>` + h;
  return h || '<option value="">No free times</option>';
}
function openAppt(id, logIt = true) {
  const a = apById(id); if (!a) return;
  const u = me(), vt = vtById(a.visitTypeId), d = docById(a.doctorId), p = a.patient, del = deleteDate(a), na = nextAction(a), cf = rowConflicts(a), ch = a.change;
  if (logIt) { log(u.name, 'Viewed appointment', a.ref); save(); }
  AV.drawer = id; document.body.style.overflow = 'hidden';
  layer().innerHTML = `<div class="scrim" data-act="close"></div><aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="dr-t">
    <header class="drawer__head"><div class="drawer__top">${badge(a.status)}<button class="x" data-act="close" aria-label="Close">×</button></div>
      <h2 id="dr-t">${esc(fullName(p))}</h2><p>${fmtLong(a.date)}, ${fmtTime(a.time)} to ${fmtTime(toHHMM(toMin(a.time) + a.duration))}</p>
      <div class="drawer__actions">${na ? `<button class="btn btn--ink btn--sm" data-act="status" data-id="${a.id}" data-st="${na[0]}">${na[1]}</button>` : ''}${a.status === 'requested' && can('status_desk') ? `<button class="btn btn--line btn--sm" data-act="status" data-id="${a.id}" data-st="cancelled">Decline</button>` : ''}<a class="btn btn--line btn--sm" href="tel:${digits(p.phone)}">Call ${esc(p.phone)}</a></div></header>
    <div class="drawer__body">
      ${ch && ch.type === 'reschedule' && ch.status === 'pending' ? `<h3 class="mini">Change requested online</h3>${changeBlock(a, true)}` : ''}
      ${ch && ch.type === 'cancel' ? `<p class="retain">Cancelled by the patient online, ${fmtStamp(ch.at)}.</p>` : ''}
      ${cf.length ? `<div class="alert alert--panel"><b>This visit clashes with:</b><ul>${cf.map(x => `<li>${esc(x.text)}</li>`).join('')}</ul>Move it to another time below.</div>` : ''}
      <dl class="kv"><dt>Visit</dt><dd>${esc(vt ? vt.name : '')}, ${a.duration} min</dd><dt>Doctor</dt><dd>${esc(d ? d.name : '')}</dd><dt>Patient</dt><dd>${p.returning ? 'Returning' : 'New patient'}</dd>
        <dt>Language</dt><dd>${p.lang === 'tr' ? 'Turkish (booked on the Turkish site)' : 'English'}</dd>
        <dt>Email</dt><dd>${p.email ? esc(p.email) : '<span class="muted">Not given</span>'}</dd><dt>Reminders</dt><dd>${p.sms ? 'By text message' : 'By phone call'}</dd><dt>Booked via</dt><dd>${SOURCES[a.source]}, code ${a.ref}</dd></dl>
      ${can('note') ? `<div class="field"><label for="note">Scheduling note <span class="help">No medical details</span></label><input id="note" type="text" maxlength="120" value="${esc(a.note)}" placeholder="Left a voicemail, prefers mornings"></div><button class="btn btn--line btn--sm" data-act="note" data-id="${a.id}">Save note</button>` : (a.note ? `<p class="retain"><b>Note:</b> ${esc(a.note)}</p>` : '')}
      ${can('edit') ? `<details class="fold" style="margin-top:18px" ${cf.length ? 'open' : ''}><summary>Move to another time</summary><div class="fold__in"><div class="grid2" data-scope="rs">
        <div class="field"><label for="rs-date">Date</label><input id="rs-date" type="date" value="${a.date}" data-recalc></div>
        <div class="field"><label for="rs-time">Time</label><select id="rs-time">${timeOpts(a.date, a.visitTypeId, a.doctorId, a.id, cf.length ? '' : a.time)}</select></div>
        <div class="field" ${multiDoc() ? '' : 'hidden'}><label for="rs-doc">Doctor</label><select id="rs-doc" data-recalc>${DB.doctors.filter(x => x.active || x.id === a.doctorId).map(x => `<option value="${x.id}" ${x.id === a.doctorId ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div></div>
        <button class="btn btn--ink btn--sm" data-act="move" data-id="${a.id}">Save new time</button></div></details>` : ''}
      <details class="fold"><summary>Change status</summary><div class="fold__in"><div class="statusbar">${Object.entries(STATUS).map(([k, t]) => `<button class="${a.status === k ? 'is-on' : ''}" data-act="status" data-id="${a.id}" data-st="${k}" ${can(STATUS_PERM[k]) ? '' : 'disabled title="Not available for your role"'}>${t}</button>`).join('')}</div></div></details>
      <details class="fold"><summary>History and data</summary><div class="fold__in">
        <p class="retain">${del ? `This appointment is deleted automatically on <b>${fmtDate(del, { month: 'long', day: 'numeric', year: 'numeric' })}</b>.` : 'A deletion date is set once the visit is completed, cancelled or missed.'}</p>
        <ul class="timeline">${a.history.slice().reverse().map(h => `<li>${fmtStamp(h.at)}: ${esc(h.text)}</li>`).join('')}</ul>
        ${can('delete') ? `<button class="btn btn--danger btn--sm" data-act="del" data-id="${a.id}">Delete now</button>` : ''}</div></details>
    </div></aside>`;
  setTimeout(() => { const x = $('.drawer .x'); if (x) x.focus(); }, 20);
}
let MODAL = null;
function modal(title, body, foot) {
  document.body.style.overflow = 'hidden';
  layer().innerHTML = `<div class="scrim" data-act="close"></div><div class="modal"><div class="modal__card" role="dialog" aria-modal="true" aria-labelledby="m-t"><div class="modal__head"><h2 id="m-t">${esc(title)}</h2><button class="x" data-act="close" aria-label="Close">×</button></div><div class="modal__body">${body}</div><div class="modal__foot">${foot}</div></div></div>`;
  const f = $('.modal__body input:not([type=file]):not(.sr), .modal__body select'); if (f) setTimeout(() => f.focus(), 20);
}
function newModal(pre = {}) {
  const n = nowParts(), vt = DB.visitTypes.find(v => v.active) || DB.visitTypes[0], doc = DB.doctors.find(d => d.active) || DB.doctors[0], date = pre.date || n.date;
  modal('New appointment', `
    <div class="grid2"><div class="field"><label for="n-first">First name</label><input id="n-first" type="text"></div><div class="field"><label for="n-last">Last name</label><input id="n-last" type="text"></div></div>
    <div class="grid2"><div class="field"><label for="n-phone">Mobile phone</label><input id="n-phone" type="tel"></div><div class="field"><label for="n-email">Email <span class="help">Optional</span></label><input id="n-email" type="email"></div></div>
    <div class="grid2" data-scope="n">
      <div class="field"><label for="n-vt">Visit type</label><select id="n-vt" data-recalc>${DB.visitTypes.map(v => `<option value="${v.id}" ${v.id === vt.id ? 'selected' : ''}>${esc(v.name)} (${v.duration} min)</option>`).join('')}</select></div>
      <div class="field" ${multiDoc() ? '' : 'hidden'}><label for="n-doc">Doctor</label><select id="n-doc" data-recalc>${DB.doctors.filter(d => d.active).map(d => `<option value="${d.id}">${esc(d.name)}</option>`).join('')}</select></div>
      <div class="field"><label for="n-date">Date</label><input id="n-date" type="date" value="${date}" data-recalc></div>
      <div class="field"><label for="n-time">Time</label><select id="n-time">${timeOpts(date, vt.id, doc.id, null, pre.time)}</select></div></div>
    <div class="grid2"><div class="field"><label for="n-src">Booked by</label><select id="n-src"><option value="phone">Phone</option><option value="walkin">Walk-in</option></select></div>
      <div class="field"><label for="n-ret">Patient</label><select id="n-ret"><option value="no">New</option><option value="yes">Returning</option></select></div>
      <div class="field"><label for="n-sms">Text reminders</label><select id="n-sms"><option value="no">No</option><option value="yes">Yes, patient agreed</option></select></div>
      <div class="field"><label for="n-lang">Language</label><select id="n-lang"><option value="en">English</option><option value="tr">Turkish</option></select></div></div>
    <p id="n-err" class="err" role="alert"></p>`,
    `<button class="btn btn--line btn--sm" data-act="close">Cancel</button><button class="btn btn--ink btn--sm" data-act="new-save">Add appointment</button>`);
}
function docModal(id) {
  const blank = { id: '', name: '', title: '', role: '', color: COLORS[DB.doctors.length % COLORS.length], photo: '', active: true, onSite: true, bio: '', bio_tr: '', lunch: { on: false, start: '12:30', end: '13:00', days: [1, 2, 3, 4, 5] }, timeOff: [], schedule: Object.fromEntries([...Array(7)].map((_, i) => [i, { on: DB.settings.hours[i].open, start: DB.settings.hours[i].start, end: DB.settings.hours[i].end }])) };
  const d = MODAL && MODAL.data && MODAL.data.id === id ? MODAL.data : (id ? JSON.parse(JSON.stringify(docById(id))) : blank);
  MODAL = { data: d }; const L = d.lunch, n = nowParts().date;
  modal(id ? `Edit ${d.name}` : 'Add a doctor', `
    <div style="display:flex;gap:16px;align-items:center;margin-bottom:20px">${avatar(d.name ? d : { ...d, name: '?' })}<div><label class="btn btn--line btn--sm" style="cursor:pointer">Upload photo<input type="file" accept="image/*" class="sr" data-act="photo"></label>${d.photo ? ' <button class="linkbtn" data-act="photo-rm" style="margin-left:10px">Remove</button>' : ''}<p class="hint" style="margin-top:6px">Shown in the About section of the website.</p></div></div>
    <div class="grid2"><div class="field"><label for="d-name">Full name</label><input id="d-name" type="text" data-m="name" value="${esc(d.name)}" placeholder="Dr. Jane Smith"></div><div class="field"><label for="d-title">Title</label><input id="d-title" type="text" data-m="title" value="${esc(d.title)}" placeholder="DDS, DMD, RDH"></div></div>
    <div class="field"><label for="d-role">Role shown on the website</label><input id="d-role" type="text" data-m="role" value="${esc(d.role)}"></div>
    <div class="field"><label for="d-bio">Short bio</label><textarea id="d-bio" data-m="bio">${esc(d.bio)}</textarea></div>
    <div class="field"><label for="d-biotr">Short bio in Turkish <span class="help">Optional, for the Turkish site</span></label><textarea id="d-biotr" data-m="bio_tr">${esc(d.bio_tr || '')}</textarea></div>
    <div class="field"><span class="lab">Calendar color</span><div class="swatches">${COLORS.map(c => `<button type="button" class="swatch ${d.color === c ? 'is-on' : ''}" style="background:${c}" data-act="swatch" data-v="${c}" aria-label="Color ${c}"></button>`).join('')}</div></div>
    <div class="field"><span class="lab">Working days</span><div class="week-edit">${WEEK.map(i => { const s = d.schedule[i] || { on: false, start: '09:00', end: '17:00' }; return `<span>${DAYS[i]}</span><label class="switch"><input type="checkbox" data-sc="${i}" data-f="on" ${s.on ? 'checked' : ''} aria-label="${DAYS[i]}"><span></span></label><input type="time" data-sc="${i}" data-f="start" value="${s.start}" ${s.on ? '' : 'disabled'} aria-label="${DAYS[i]} start"><input type="time" data-sc="${i}" data-f="end" value="${s.end}" ${s.on ? '' : 'disabled'} aria-label="${DAYS[i]} end">`; }).join('')}</div></div>
    <div class="field"><span class="lab">Lunch break</span>
      <div class="lunch"><label class="switch"><input type="checkbox" data-lunch="on" ${L.on ? 'checked' : ''} aria-label="Lunch break on"><span></span></label><input type="time" data-lunch="start" value="${L.start}" aria-label="Lunch starts"><span>to</span><input type="time" data-lunch="end" value="${L.end}" aria-label="Lunch ends"></div>
      <div class="daypick" role="group" aria-label="Lunch days">${WEEK.map(i => `<button type="button" class="${L.days.includes(i) ? 'is-on' : ''}" data-act="lunch-day" data-v="${i}" aria-pressed="${L.days.includes(i)}">${DAY3[i]}</button>`).join('')}</div>
      <p class="hint" style="margin-top:6px">Patients can't book during the break.</p></div>
    <div class="field"><span class="lab">Time off</span>
      <ul class="closed-list">${d.timeOff.filter(o => (o.to || o.from) >= n).sort((a, b) => a.from < b.from ? -1 : 1).map(o => `<li><span><b>${fmtDate(o.from)}${o.to && o.to !== o.from ? ' to ' + fmtDate(o.to) : ''}</b> ${esc(o.label)}</span><button class="linkbtn" data-act="off-rm" data-v="${o.id}">Remove</button></li>`).join('') || '<li class="muted">None booked</li>'}</ul>
      <div class="inline"><div class="field"><label for="off-from">From</label><input id="off-from" type="date"></div><div class="field"><label for="off-to">To</label><input id="off-to" type="date"></div><div class="field"><label for="off-label">Label</label><input id="off-label" type="text" placeholder="Vacation"></div><button type="button" class="btn btn--line btn--sm" data-act="off-add">Add</button></div></div>
    <div class="swrow"><div><b>Bookable</b><small>Patients and staff can book this doctor.</small></div><label class="switch"><input type="checkbox" data-m="active" ${d.active ? 'checked' : ''}><span></span></label></div>
    <div class="swrow"><div><b>Show on the website</b></div><label class="switch"><input type="checkbox" data-m="onSite" ${d.onSite ? 'checked' : ''}><span></span></label></div>`,
    `${id ? '<button class="btn btn--danger btn--sm left" data-act="doc-del">Remove</button>' : ''}<button class="btn btn--line btn--sm" data-act="close">Cancel</button><button class="btn btn--ink btn--sm" data-act="doc-save">${id ? 'Save changes' : 'Add doctor'}</button>`);
}
function readDoc() {
  const d = MODAL.data;
  $$('.modal [data-m]').forEach(el => d[el.dataset.m] = el.type === 'checkbox' ? el.checked : el.value);
  $$('.modal [data-sc]').forEach(el => { const i = el.dataset.sc; d.schedule[i] = d.schedule[i] || {}; d.schedule[i][el.dataset.f] = el.type === 'checkbox' ? el.checked : el.value; });
  $$('.modal [data-lunch]').forEach(el => d.lunch[el.dataset.lunch] = el.type === 'checkbox' ? el.checked : el.value);
  return d;
}
function setStatus(id, st) {
  const a = apById(id), u = me(); if (!a || a.status === st || !can(STATUS_PERM[st])) return;
  a.status = st; a.history.push({ at: stamp(), text: `${STATUS[st]} by ${u.name}` });
  if (st === 'cancelled' && a.change && a.change.status === 'pending') { a.change.status = 'declined'; }
  log(u.name, `Status set to ${STATUS[st]}`, a.ref); save();
  toast(`${fullName(a.patient)}: ${STATUS[st].toLowerCase()}`);
}
function approveChange(id, alt) {
  const a = apById(id), c = a && a.change, u = me(); if (!c || c.status !== 'pending' || !can('status_desk')) return;
  const t = alt || c.time, diff = !!alt && alt !== c.time, hc = hardConflicts(a, c.date, t, c.doctorId);
  if (hc.length) return toast(`That time is not free: ${hc[0].text}`);
  a.history.push({ at: stamp(), text: `Moved from ${fmtDate(a.date)} ${fmtTime(a.time)} to ${fmtDate(c.date)} ${fmtTime(t)} at the patient's request${diff ? ' (a nearby time, not the one asked for)' : ''}, by ${u.name}` });
  Object.assign(a, { date: c.date, time: t, doctorId: c.doctorId }); Object.assign(c, { status: 'approved', asked: c.time, time: t, doneAt: stamp(), by: u.name });
  log(u.name, 'Approved change request', a.ref); save();
  toast(diff ? `Moved to ${fmtDate(a.date)}, ${fmtTime(t)}. Call the patient: this is not the exact time they asked for.` : `Moved to ${fmtDate(a.date)}, ${fmtTime(t)}`);
}
function declineChange(id) {
  const a = apById(id), c = a && a.change, u = me(); if (!c || c.status !== 'pending' || !can('status_desk')) return;
  c.status = 'declined'; c.doneAt = stamp(); c.by = u.name; a.history.push({ at: stamp(), text: `Change request declined by ${u.name}. Original time kept.` });
  log(u.name, 'Declined change request', a.ref); save(); toast('Declined. The original time is kept. Call the patient to find another time.');
}
function exportCSV() {
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`, cols = ['Code', 'Date', 'Time', 'Minutes', 'Status', 'Booked via', 'Visit type', 'Doctor', 'First name', 'Last name', 'Phone', 'Email', 'Returning', 'Text reminders', 'Language', 'Scheduling note'];
  const rows = DB.appointments.slice().sort(byWhen).map(a => [a.ref, a.date, a.time, a.duration, STATUS[a.status], SOURCES[a.source], (vtById(a.visitTypeId) || {}).name, (docById(a.doctorId) || {}).name, a.patient.first, a.patient.last, a.patient.phone, a.patient.email, a.patient.returning ? 'yes' : 'no', a.patient.sms ? 'yes' : 'no', a.patient.lang === 'tr' ? 'Turkish' : 'English', a.note].map(q).join(','));
  download(`qb-dental-appointments-${nowParts().date}.csv`, [cols.map(q).join(','), ...rows].join('\n'), 'text/csv');
  log(me().name, 'Exported appointments (CSV)', `${rows.length} rows`); save(); refresh(); toast(`Exported ${rows.length} rows. The export is in the activity log.`);
}
function printDay(d) {
  const u = me(), S = DB.settings, list = DB.appointments.filter(a => a.date === d && a.status !== 'cancelled').sort(byWhen), offs = DB.doctors.filter(x => x.active && offOn(x, d));
  const br = DB.doctors.filter(x => x.active && !offOn(x, d) && (x.schedule[dow(d)] || {}).on && lunchOn(x, d));
  $('#print').innerHTML = `<header><b>${esc(S.shortName)}</b><h1>${fmtLong(d)}</h1><p>${list.length} visit${list.length === 1 ? '' : 's'}${br.length ? `. Lunch ${br.map(x => `${fmtTime(x.lunch.start)} to ${fmtTime(x.lunch.end)}${multiDoc() ? ' (' + esc(x.name) + ')' : ''}`).join(', ')}` : ''}${offs.length ? `. Off today: ${offs.map(x => esc(x.name)).join(', ')}` : ''}.</p></header>
    <table><thead><tr><th>Time</th><th>Patient</th><th>Phone</th><th>Visit</th>${multiDoc() ? '<th>Doctor</th>' : ''}<th>Status</th><th>Note</th><th>Arrived</th></tr></thead><tbody>
    ${list.map(a => `<tr><td>${fmtTime(a.time)}<br><small>${a.duration} min</small></td><td><b>${esc(fullName(a.patient))}</b>${a.patient.returning ? '' : '<br><small>New patient</small>'}${a.patient.lang === 'tr' ? '<br><small>Turkish</small>' : ''}</td><td>${esc(a.patient.phone)}</td><td>${esc((vtById(a.visitTypeId) || {}).name || '')}</td>${multiDoc() ? `<td>${esc((docById(a.doctorId) || {}).name || '')}</td>` : ''}<td>${STATUS[a.status]}</td><td>${esc(a.note)}</td><td class="box"></td></tr>`).join('') || '<tr><td colspan="8">No visits booked.</td></tr>'}</tbody></table>
    <footer>Printed ${fmtStamp(stamp())} by ${esc(u.name)}. This page contains patient information. Keep it at the front desk and shred it at the end of the day.</footer>`;
  log(u.name, 'Printed day list', fmtDate(d)); save();
  window.print();
}
let PUSH_T = null;
function pushMock(x) {
  let el = $('#pushmock'); if (!el) { el = document.createElement('div'); el.id = 'pushmock'; document.body.appendChild(el); }
  el.className = 'pushmock'; el.innerHTML = `<div class="push"><div class="push__top"><span class="push__app push__app--${x.channel}">${{ sms: 'Messages', whatsapp: 'WhatsApp', email: 'Mail' }[x.channel]}</span><span>now</span></div><b>${esc(DB.settings.shortName)}</b><p>${esc(x.text)}</p><small>Demo: what the owner's phone would show</small></div>`;
  clearTimeout(PUSH_T); PUSH_T = setTimeout(() => { el.className = 'pushmock is-gone'; }, 7000);
}
function resize(file, cb) { const fr = new FileReader(); fr.onload = () => { const im = new Image(); im.onload = () => { const sc = Math.min(1, 900 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * sc); c.height = Math.round(im.height * sc); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); cb(c.toDataURL('image/jpeg', .85)); }; im.src = fr.result; }; fr.readAsDataURL(file); }

/* ============ events ============ */
const isAdmin = () => location.hash.startsWith('#/admin');
const onHome = () => !location.hash || location.hash === '#' || location.hash === '#/';
function renderSite() {
  const h = location.hash;
  if (h.startsWith('#/book')) { if (!BK) newBooking({}); renderBook(); }
  else if (h.startsWith('#/manage')) renderManage();
  else if (h.startsWith('#/care/')) renderService(h.split('/')[2]);
  else renderHome();
}
function onClick(e) {
  const scrollTo = e.target.closest('[data-to]');
  if (scrollTo) { e.preventDefault(); const go = () => { const t = document.getElementById(scrollTo.dataset.to); if (t) t.scrollIntoView(); }; if (!onHome()) { location.hash = '#/'; setTimeout(go, 60); } else go(); const h = $('.head'); if (h) h.classList.remove('open'); return; }
  const el = e.target.closest('[data-act]'); if (!el) return;
  const act = el.dataset.act, u = me();
  if (['search', 'photo'].includes(act)) return;
  switch (act) {
    case 'lang': { const y = window.scrollY; setLang(el.dataset.v); renderSite(); window.scrollTo(0, y); break; }
    case 'menu': { const h = $('.head'); h.classList.toggle('open'); el.setAttribute('aria-expanded', h.classList.contains('open')); break; }
    case 'placeholder': e.preventDefault(); toast(T('Placeholder: the practice provides this document.', 'Yer tutucu: bu belgeyi muayenehane sağlayacak.')); break;
    case 'copy-addr': (navigator.clipboard ? navigator.clipboard.writeText(addr()) : Promise.reject()).then(() => toast(T('Address copied', 'Adres kopyalandı')), () => toast(addr())); break;
    case 'bk-vt': BK.vt = el.dataset.v; BK.err = ''; if (BK.vt === 'v_urgent') { BK.urgentOk = false; BK.step = 1; refreshBook(); const b = $('.urgent'); if (b) b.scrollIntoView({ block: 'center' }); } else { BK.step = 2; refreshBook(); } break;
    case 'bk-urgent-go': BK.urgentOk = true; BK.step = 2; refreshBook(); break;
    case 'bk-back': BK.err = ''; BK.step = Math.max(1, BK.step - 1); if (BK.step === 1) BK.urgentOk = false; refreshBook(); break;
    case 'bk-next': if (!BK.time) { BK.err = T('Choose a time to continue.', 'Devam etmek için bir saat seçin.'); $('#bk-err').textContent = BK.err; } else { BK.err = ''; BK.step = 3; refreshBook(); } break;
    case 'bk-date': { const sc = $('.dates').scrollLeft; BK.date = el.dataset.v; BK.time = ''; BK.err = ''; refreshBook(); $('.dates').scrollLeft = sc; break; }
    case 'bk-time': BK.time = el.dataset.v; BK.err = ''; $$('.slot').forEach(x => { x.classList.toggle('is-on', x === el); x.setAttribute('aria-pressed', x === el); }); $('#bk-err').textContent = ''; $('#bkside').innerHTML = bkSide(); break;
    case 'bk-ret': BK.returning = el.dataset.v === 'yes'; $$('[data-act="bk-ret"]').forEach(x => x.classList.toggle('is-on', x === el)); break;
    case 'ics': { const a = apById(el.dataset.id); if (a) download(`qb-dental-${a.ref}.ics`, ics(a), 'text/calendar'); break; }
    case 'mg-demo': MG.ref = el.dataset.ref; MG.phone = el.dataset.phone; MG.err = ''; refreshManage(); break;
    case 'mg-step': MG.step = el.dataset.v; MG.err = ''; if (MG.step === 'move') { MG.date = ''; MG.time = ''; } refreshManage(); window.scrollTo(0, 0); break;
    case 'mg-out': MG = { step: 'find', ref: '', phone: '', id: null, err: '', date: '', time: '', fails: MG.fails }; refreshManage(); break;
    case 'mg-date': { const sc = $('.dates').scrollLeft; MG.date = el.dataset.v; MG.time = ''; MG.err = ''; refreshManage(); $('.dates').scrollLeft = sc; break; }
    case 'mg-time': MG.time = el.dataset.v; MG.err = ''; $$('.slot').forEach(x => { x.classList.toggle('is-on', x === el); x.setAttribute('aria-pressed', x === el); }); $('#mg-err').textContent = ''; break;
    case 'mg-send': mgSend(); break;
    case 'mg-cancel': mgCancel(); break;
    case 'mg-withdraw': { const a = mgAppt(); if (a && a.change && a.change.status === 'pending') { a.change.status = 'withdrawn'; a.history.push({ at: stamp(), text: 'Patient withdrew the change request online' }); log('Patient (online)', 'Withdrew change request', a.ref); save(); } refreshManage(); break; }
    case 'login': setMe(el.dataset.id); log(DB.users.find(x => x.id === el.dataset.id).name, 'Signed in', ''); save(); AV.view = 'schedule'; if (location.hash !== '#/admin/schedule') location.hash = '#/admin/schedule'; else renderAdmin(); break;
    case 'logout': e.preventDefault(); log(u.name, 'Signed out', ''); save(); setMe(null); location.hash = '#/admin'; renderLogin(); break;
    case 'side-toggle': $('#app').classList.toggle('side-open'); break;
    case 'close': closeLayer(); if (isAdmin()) refresh(); break;
    case 'open': e.stopPropagation(); openAppt(el.dataset.id); break;
    case 'status': e.stopPropagation(); setStatus(el.dataset.id, el.dataset.st); if (AV.drawer === el.dataset.id) openAppt(el.dataset.id, false); refresh(); break;
    case 'chg-ok': case 'chg-alt': e.stopPropagation(); approveChange(el.dataset.id, el.dataset.time); if (AV.drawer === el.dataset.id) openAppt(el.dataset.id, false); refresh(); break;
    case 'chg-no': e.stopPropagation(); declineChange(el.dataset.id); if (AV.drawer === el.dataset.id) openAppt(el.dataset.id, false); refresh(); break;
    case 'note': { const a = apById(el.dataset.id); a.note = $('#note').value.trim().slice(0, 120); a.history.push({ at: stamp(), text: `Note updated by ${u.name}` }); log(u.name, 'Edited scheduling note', a.ref); save(); toast('Note saved'); break; }
    case 'move': {
      const a = apById(el.dataset.id), doc = $('#rs-doc').value, date = $('#rs-date').value, time = $('#rs-time').value;
      if (!time) return toast('Pick a free time first');
      if (doc === a.doctorId && date === a.date && time === a.time) return toast('Nothing changed');
      a.history.push({ at: stamp(), text: `Moved to ${fmtDate(date)} ${fmtTime(time)} by ${u.name}` }); Object.assign(a, { doctorId: doc, date, time });
      if (a.change && a.change.status === 'pending') { a.change.status = 'declined'; a.history.push({ at: stamp(), text: 'Open change request closed because staff moved the visit' }); }
      log(u.name, 'Moved appointment', a.ref); save(); openAppt(a.id, false); refresh(); toast('Appointment moved'); break;
    }
    case 'del': { const a = apById(el.dataset.id); if (!confirm(`Delete the appointment for ${fullName(a.patient)} now? This can't be undone.`)) return; DB.appointments = DB.appointments.filter(x => x.id !== a.id); log(u.name, 'Deleted appointment', a.ref); save(); closeLayer(); refresh(); toast('Appointment deleted'); break; }
    case 'new': newModal({ date: el.dataset.date, time: el.dataset.time }); break;
    case 'new-save': {
      const v = id => ($('#' + id) || {}).value || '', err = [];
      if (!v('n-first').trim()) err.push('first name'); if (digits(v('n-phone')).length < 10) err.push('a 10-digit phone'); if (!v('n-time')) err.push('a free time');
      if (err.length) { $('#n-err').textContent = 'Please add ' + err.join(', ') + '.'; return; }
      const vt = vtById(v('n-vt'));
      const a = { id: uid('a_'), ref: makeRef(), createdAt: stamp(), source: v('n-src'), status: 'confirmed', visitTypeId: vt.id, doctorId: v('n-doc'), date: v('n-date'), time: v('n-time'), duration: vt.duration,
        patient: { first: v('n-first').trim(), last: v('n-last').trim(), phone: fmtPhone(v('n-phone')), email: v('n-email').trim(), returning: v('n-ret') === 'yes', sms: v('n-sms') === 'yes', lang: v('n-lang') }, note: '', history: [{ at: stamp(), text: `Added by ${u.name} (${SOURCES[v('n-src')]})` }] };
      DB.appointments.push(a); log(u.name, 'Created appointment', a.ref); save(); closeLayer(); AV.day = a.date; refresh(); toast(`Added for ${fmtDate(a.date)}, ${fmtTime(a.time)}`); break;
    }
    case 'print': printDay(el.dataset.v); break;
    case 'day': AV.day = el.dataset.v; refresh(); break;
    case 'week': AV.day = +el.dataset.v === 0 ? nowParts().date : addDays(AV.day, +el.dataset.v); refresh(); break;
    case 'mode': AV.mode = el.dataset.v; refresh(); break;
    case 'range': AV.range = el.dataset.v; refresh(); break;
    case 'rr': AV.rr = el.dataset.v; refresh(); break;
    case 'tab': AV.tab = el.dataset.v; refresh(); break;
    case 'export': if (can('export')) exportCSV(); break;
    case 'doc': MODAL = null; docModal(el.dataset.id); break;
    case 'swatch': MODAL.data.color = el.dataset.v; $$('.swatch').forEach(x => x.classList.toggle('is-on', x === el)); break;
    case 'lunch-day': { const i = +el.dataset.v, L = MODAL.data.lunch; L.days = L.days.includes(i) ? L.days.filter(x => x !== i) : [...L.days, i]; el.classList.toggle('is-on'); el.setAttribute('aria-pressed', L.days.includes(i)); break; }
    case 'off-add': { const f = $('#off-from').value, t = $('#off-to').value || f; if (!f) return toast('Pick a start date'); if (t < f) return toast('The end date is before the start date'); readDoc(); MODAL.data.timeOff.push({ id: uid('o_'), from: f, to: t, label: $('#off-label').value.trim() || 'Time off' }); docModal(MODAL.data.id); toast('Added. Save to keep it.'); break; }
    case 'off-rm': readDoc(); MODAL.data.timeOff = MODAL.data.timeOff.filter(o => o.id !== el.dataset.v); docModal(MODAL.data.id); break;
    case 'photo-rm': readDoc(); MODAL.data.photo = ''; docModal(MODAL.data.id); break;
    case 'doc-save': {
      const d = readDoc(); if (!d.name.trim()) return toast('Add a name first');
      if (d.lunch.on && d.lunch.end <= d.lunch.start) return toast('The lunch break ends before it starts');
      if (d.id) DB.doctors[DB.doctors.findIndex(x => x.id === d.id)] = d; else { d.id = uid('d_'); DB.doctors.push(d); }
      log(u.name, 'Saved doctor', d.name); save(); MODAL = null; closeLayer(); refresh();
      const clash = DB.appointments.filter(a => a.doctorId === d.id && rowConflicts(a).length).length;
      toast(clash ? `${d.name} saved. ${clash} booked visit${clash === 1 ? ' now clashes' : 's now clash'} with the new break or time off. They are marked in red in the schedule.` : `${d.name} saved`); break;
    }
    case 'doc-del': {
      const d = MODAL.data; if (DB.doctors.length === 1) return toast('Keep at least one doctor');
      const up = DB.appointments.filter(a => a.doctorId === d.id && a.date >= nowParts().date && ['requested', 'confirmed'].includes(a.status)).length;
      if (up) return toast(`${d.name} has ${up} upcoming appointment${up === 1 ? '' : 's'}. Move them first, or switch off "Bookable".`);
      if (!confirm(`Remove ${d.name}?`)) return; DB.doctors = DB.doctors.filter(x => x.id !== d.id); log(u.name, 'Removed doctor', d.name); save(); MODAL = null; closeLayer(); refresh(); break;
    }
    case 'n-ch': { const N = DB.settings.notify, was = N.channel; N.channel = el.dataset.v; if ((was === 'email') !== (N.channel === 'email')) N.to = N.channel === 'email' ? 'owner@example.com' : '(847) 555-0199'; refresh(); break; }
    case 'save-n': { const N = DB.settings.notify; N.to = $('#n-to').value.trim(); $$('[data-n]').forEach(x => N.events[x.dataset.n] = x.checked); log(u.name, 'Changed owner alerts', CH[N.channel]); save(); refresh(); toast('Alerts saved'); break; }
    case 'n-test': { const x = notify('test'); log(u.name, 'Sent a test alert', CH[x.channel]); save(); pushMock(x); refresh(); break; }
    case 'n-daily': { const x = { at: stamp(), kind: 'daily', channel: DB.settings.notify.channel, text: noticeText('daily') }; pushMock(x); break; }
    case 'save-hours': $$('[data-h]').forEach(x => { DB.settings.hours[x.dataset.h][x.dataset.f] = x.type === 'checkbox' ? x.checked : x.value; }); log(u.name, 'Changed opening hours', ''); save(); refresh(); toast('Hours saved'); break;
    case 'save-vt': $$('[data-vt]').forEach(x => { const v = vtById(x.dataset.vt); v[x.dataset.f] = x.type === 'checkbox' ? x.checked : x.dataset.f === 'duration' ? +x.value : x.value.trim() || v.name; }); log(u.name, 'Changed visit types', ''); save(); refresh(); toast('Visit types saved'); break;
    case 'add-vt': DB.visitTypes.push({ id: uid('v_'), name: 'New visit type', duration: 30, active: false }); save(); refresh(); break;
    case 'save-s': $$('[data-s]').forEach(x => { const k = x.dataset.s; DB.settings[k] = x.type === 'checkbox' ? x.checked : ['slotInterval', 'leadHours', 'maxDays', 'changeCutoffHours'].includes(k) ? +x.value : x.value.trim(); }); log(u.name, 'Changed settings', ''); save(); renderAdmin(); toast('Saved'); break;
    case 'save-r': $$('[data-r]').forEach(x => DB.settings.retention[x.dataset.r] = +x.value); log(u.name, 'Changed deletion schedule', `${DB.settings.retention.inactiveDays} / ${DB.settings.retention.completedDays} days`); save(); refresh(); toast('Deletion schedule saved'); break;
    case 'run-r': { const g = runRetention(u.name); save(); refresh(); toast(g ? `${g} appointment${g === 1 ? '' : 's'} deleted` : 'Nothing is past its deletion date'); break; }
    case 'closed-add': { const d = $('#cl-d').value; if (!d) return toast('Pick a date'); if (!DB.settings.closedDates.some(c => c.date === d)) DB.settings.closedDates.push({ date: d, label: $('#cl-l').value.trim() }); log(u.name, 'Added closed day', d); save(); refresh(); break; }
    case 'closed-rm': DB.settings.closedDates = DB.settings.closedDates.filter(c => c.date !== el.dataset.v); log(u.name, 'Removed closed day', el.dataset.v); save(); refresh(); break;
    case 'reset': if (confirm('Reset all demo data?')) { DB = fresh(); save(); AV.day = ''; renderAdmin(); toast('Demo data restored'); } break;
  }
}
function onInput(e) {
  const el = e.target;
  if (el.dataset.bk && BK) { BK[el.dataset.bk] = el.type === 'checkbox' ? el.checked : el.value; const f = el.closest('.field'); if (f) f.classList.remove('has-err'); }
  if (el.dataset.act === 'search') { AV.q = el.value; const t = $('#apt-table'); if (t) t.innerHTML = aptTable(); }
}
function onChange(e) {
  const el = e.target;
  if (el.hasAttribute('data-finder')) { HOME.vt = el.value; $('#finder').innerHTML = finderHTML(); $('#finder-vt').focus(); return; }
  if (el.dataset.bkSelect && BK) { BK[el.dataset.bkSelect] = el.value; BK.time = ''; refreshBook(); return; }
  if (el.dataset.filter) { AV[el.dataset.filter] = el.value; refresh(); return; }
  if (el.hasAttribute('data-recalc')) {
    const sc = el.closest('[data-scope]').dataset.scope;
    if (sc === 'rs') { const a = apById(AV.drawer); $('#rs-time').innerHTML = timeOpts($('#rs-date').value, a.visitTypeId, $('#rs-doc').value, a.id, $('#rs-date').value === a.date && $('#rs-doc').value === a.doctorId ? a.time : ''); }
    if (sc === 'n') $('#n-time').innerHTML = timeOpts($('#n-date').value, $('#n-vt').value, $('#n-doc').value, null, '');
    return;
  }
  if (el.dataset.f === 'on' && el.dataset.sc !== undefined) $$(`.modal [data-sc="${el.dataset.sc}"][type=time]`).forEach(x => x.disabled = !el.checked);
  if (el.dataset.f === 'open' && el.dataset.h !== undefined) $$(`[data-h="${el.dataset.h}"][type=time]`).forEach(x => x.disabled = !el.checked);
  if (el.dataset.act === 'photo' && el.files[0]) resize(el.files[0], url => { readDoc(); MODAL.data.photo = url; docModal(MODAL.data.id); toast('Photo added. Save to keep it.'); });
}
function onSubmit(e) {
  const f = e.target.dataset.form; if (!f) return; e.preventDefault();
  if (f === 'book') bookSubmit();
  if (f === 'mg-find') mgFind(e.target);
  if (f === 'route') { const from = e.target.from.value.trim(); window.open(`https://www.google.com/maps/dir/?api=1${from ? '&origin=' + encodeURIComponent(from) : ''}&destination=${mq()}`, '_blank', 'noopener'); }
}
function onKey(e) {
  if (e.key === 'Escape' && layer().innerHTML) { closeLayer(); if (isAdmin()) refresh(); return; }
  if (e.key === 'Enter' && e.target.matches('tr[data-act], li[data-act], .cal__appt')) e.target.click();
}

/* ============ router ============ */
function route() {
  closeLayer();
  const h = location.hash;
  document.documentElement.lang = h.startsWith('#/admin') ? 'en' : LANG;
  if (h.startsWith('#/admin')) { AV.view = h.split('/')[2] || 'schedule'; renderAdmin(); }
  else if (h.startsWith('#/book')) { const q = Object.fromEntries(new URLSearchParams(h.split('?')[1] || '')); newBooking({ v: q.v || '', d: /^\d{4}-\d{2}-\d{2}$/.test(q.d || '') ? q.d : '', t: /^\d{2}:\d{2}$/.test(q.t || '') ? q.t : '' }); renderBook(); }
  else if (h.startsWith('#/manage')) { if (MG.id && apById(MG.id)) MG.step = 'view'; else MG.step = 'find'; renderManage(); }
  else if (h.startsWith('#/care/')) renderService(h.split('/')[2]);
  else renderHome();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
window.addEventListener('storage', e => {
  if (e.key !== KEY || !e.newValue) return;
  const before = new Map(DB.appointments.map(a => [a.id, JSON.stringify([a.status, a.change])])), lastAt = DB.notices.reduce((m, x) => x.at > m ? x.at : m, '');
  DB = migrate(JSON.parse(e.newValue)); MEM = e.newValue;
  const fresh = DB.notices.filter(x => x.at > lastAt);
  if (isAdmin()) {
    if (!me()) return;
    if (!layer().innerHTML) refresh();
    DB.appointments.forEach(a => {
      const b = before.get(a.id);
      if (!b) toast(`New ${SOURCES[a.source].toLowerCase()} request: ${fullName(a.patient)}, ${fmtDate(a.date)} ${fmtTime(a.time)}`);
      else if (b !== JSON.stringify([a.status, a.change]) && a.change && a.change.type === 'reschedule' && a.change.status === 'pending') toast(`Change request: ${fullName(a.patient)} wants ${fmtDate(a.change.date)} ${fmtTime(a.change.time)}`);
      else if (b !== JSON.stringify([a.status, a.change]) && a.status === 'cancelled' && a.change && a.change.type === 'cancel') toast(`${fullName(a.patient)} cancelled online. ${fmtDate(a.date)} ${fmtTime(a.time)} is free again.`);
    });
    if (fresh.length) pushMock(fresh[fresh.length - 1]);
  } else if (location.hash.startsWith('#/manage')) refreshManage();
  else if (onHome()) renderHome();
});
document.addEventListener('click', onClick); document.addEventListener('input', onInput); document.addEventListener('change', onChange); document.addEventListener('submit', onSubmit); document.addEventListener('keydown', onKey);
setInterval(() => { const s = $('.state'); if (s) { const st = openState(); s.className = 'state ' + (st.open ? 'is-open' : ''); s.lastChild.textContent = stateText(st); } }, 60000);
if (runRetention()) save();
document.documentElement.lang = LANG;
route();
})();
