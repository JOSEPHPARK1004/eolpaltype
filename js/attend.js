/* 7일 출석 체크 — 켜야만 저장(기본 꺼짐). 이 브라우저의 localStorage 키 하나(eolpal_attend_v1)에
 * 운세를 본 날짜(최근 14일)·이번 회차 일차·완주 횟수·마지막 완주 날짜·쉬어 가기 사용 여부만 남겨요.
 * 사진·생년월일·이름·성격유형·결과는 저장하지 않아요. 출석 기록은 기기 밖으로 보내지 않아요.
 * 보관: 날짜는 최근 14일, 마지막 완주 날짜는 완주 후 7일(금색 프레임 기간)이 지나면 지워요. */
(function (g) {
  var KEY = 'eolpal_attend_v1';
  function store() { try { return g.localStorage; } catch (e) { return null; } }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function key(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function toDay(k) { var p = k.split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]) / 864e5; }
  function gap(a, b) { return toDay(b) - toDay(a); }
  var RE = /^\d{4}-\d{2}-\d{2}$/;
  function valid(o) { return o && o.v === 1 && Array.isArray(o.days) && o.days.every(function (d) { return RE.test(d); }) && o.n >= 0 && o.n <= 7 && o.done >= 0 && typeof o.skip === 'boolean' && (o.fin === null || RE.test(o.fin)); }
  function load(st) { st = st || store(); if (!st) return null; try { var o = JSON.parse(st.getItem(KEY)); return valid(o) ? o : null; } catch (e) { return null; } }
  function save(o, st) { st = st || store(); if (st) st.setItem(KEY, JSON.stringify({ v: 1, days: o.days, n: o.n, done: o.done, skip: o.skip, fin: o.fin })); return o; }
  function enabled(st) { return !!load(st); }
  function enable(st) { var o = load(st); if (!o) o = save({ v: 1, days: [], n: 0, done: 0, skip: false, fin: null }, st); return o; }
  function clear(st) { st = st || store(); if (st) st.removeItem(KEY); }
  /** 보관 기간 정리: 날짜는 최근 14일만, 마지막 완주 날짜(fin)는 금색 프레임 기간(완주 후 7일)이 지나면 지움 */
  function cleanup(o, today) {
    o.days = o.days.filter(function (d) { return d > today || gap(d, today) < 14; });
    if (o.fin && o.fin <= today && gap(o.fin, today) > 7) o.fin = null;
    return o;
  }
  /** 규칙만 계산(저장 안 함). today: 'YYYY-MM-DD' */
  function apply(o, today) {
    o = cleanup({ v: 1, days: o.days.slice(), n: o.n, done: o.done, skip: o.skip, fin: o.fin }, today);
    var ev = 'same';
    // 시계를 되돌린 경우: 오늘보다 뒤의 날짜를 지우고 오늘부터 다시
    if (o.days.some(function (d) { return d > today; })) { o.days = o.days.filter(function (d) { return d < today; }); o.n = 0; o.skip = false; o.fin = o.fin && o.fin <= today ? o.fin : null; ev = 'clock'; }
    if (o.days.indexOf(today) >= 0) return { o: o, ev: ev };
    var last = o.days.length ? o.days[o.days.length - 1] : null, gp = last ? gap(last, today) : null;
    if (!last || o.n === 0) { o.n = 1; o.skip = false; ev = ev === 'clock' ? 'clock' : 'first'; }
    else if (o.n >= 7) { o.n = 1; o.skip = false; ev = 'new-round'; } // 완주 다음 방문은 새 회차 1일차
    else if (gp === 1) { o.n += 1; ev = 'next'; }
    else if (gp === 2 && !o.skip) { o.n += 1; o.skip = true; ev = 'skip-used'; }
    else { o.n = 1; o.skip = false; ev = 'restart'; }
    if (o.n === 7) { o.done += 1; o.fin = today; if (ev === 'next' || ev === 'skip-used') ev = 'complete'; }
    o.days.push(today); o.days.sort();
    o.days = o.days.filter(function (d) { return gap(d, today) < 14; });
    return { o: o, ev: ev };
  }
  /** 오늘 출석 체크하기(켜져 있을 때만). 반환: 상태 또는 null(꺼짐) */
  function record(date, st) { var o = load(st); if (!o) return null; var r = apply(o, key(date || new Date())); save(r.o, st); return { state: r.o, ev: r.ev }; }
  /** 켜져 있을 때 화면을 열 때마다 보관 기간 정리만 하고 저장(출석 체크는 하지 않음) */
  function tidy(date, st) { var o = load(st); if (!o) return null; var t = key(date || new Date()), before = JSON.stringify(o); o = cleanup(o, t); if (JSON.stringify(o) !== before) save(o, st); return o; }
  /** 화면 표시용: 오늘 체크됐는지, 금색 완주 프레임(완주한 날 + 다음 7일), 특별 프레임(4일차 이상) */
  function view(o, date) {
    if (!o) return null; var t = key(date || new Date()), today = o.days.indexOf(t) >= 0;
    var gold = !!(o.fin && gap(o.fin, t) >= 0 && gap(o.fin, t) <= 7);
    return { n: o.n, done: o.done, skipLeft: o.skip ? 0 : 1, today: today, count: o.days.length, gold: gold, frame: gold ? 'gold' : (o.n >= 4 && o.n < 7 ? 'season' : (o.n === 7 ? 'gold' : null)) };
  }
  g.Attend = { KEY: KEY, load: load, enabled: enabled, enable: enable, clear: clear, apply: apply, record: record, tidy: tidy, view: view, key: key };
})(typeof window !== 'undefined' ? window : globalThis);
