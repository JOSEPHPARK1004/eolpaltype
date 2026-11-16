/* 사주팔자 계산 — lunar-javascript(MIT)를 기반으로 한국 표준시 보정을 더한 래퍼
 * - 절기 경계(연주·월주): 라이브러리는 UTC+8(중국 표준시) 기준이므로, 한국 표준시(UTC+9) 시각에서 1시간을 뺀 '같은 순간'으로 판정
 * - 일주·시주: 한국 표준시 시각에 경도 보정(-30분, 선택)을 적용한 현지 시각으로 판정
 * - v12i: IANA 한국 표준시·역사적 서머타임 전환표 적용, 반복/없는 시각 확정 중단
 */
(function (g) {
  var STEM_KO = { '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무', '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계' };
  var BRANCH_KO = { '子': '자', '丑': '축', '寅': '인', '卯': '묘', '辰': '진', '巳': '사', '午': '오', '未': '미', '申': '신', '酉': '유', '戌': '술', '亥': '해' };
  var STEM_EL = { '甲': '목', '乙': '목', '丙': '화', '丁': '화', '戊': '토', '己': '토', '庚': '금', '辛': '금', '壬': '수', '癸': '수' };
  var BRANCH_EL = { '寅': '목', '卯': '목', '巳': '화', '午': '화', '辰': '토', '戌': '토', '丑': '토', '未': '토', '申': '금', '酉': '금', '亥': '수', '子': '수' };
  var STEM_YANG = { '甲': 1, '丙': 1, '戊': 1, '庚': 1, '壬': 1 };
  var ANIMAL = { '子': '쥐', '丑': '소', '寅': '호랑이', '卯': '토끼', '辰': '용', '巳': '뱀', '午': '말', '未': '양', '申': '원숭이', '酉': '닭', '戌': '개', '亥': '돼지' };
  var ELEMENTS = ['목', '화', '토', '금', '수'];
  var GEN = { '목': '화', '화': '토', '토': '금', '금': '수', '수': '목' };   // 생
  var CTRL = { '목': '토', '토': '수', '수': '화', '화': '금', '금': '목' };  // 극

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  // 벽시계 시각을 UTC 밀리초로 다룬다(브라우저 시간대와 무관하게 계산)
  function wall(y, m, d, hh, mm) { return Date.UTC(y, m - 1, d, hh, mm, 0); }
  function toParts(ms) { var t = new Date(ms); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), hh: t.getUTCHours(), mm: t.getUTCMinutes() }; }
  function solarAt(ms) { var p = toParts(ms); return Solar.fromYmdHms(p.y, p.m, p.d, p.hh, p.mm, 0); }

  // v12i 시간대 표: IANA tzdata Asia/Seoul(로컬 /usr/share/zoneinfo),
  // timeanddate.com/time/zone/south-korea/seoul?year=1948,1955,1960,1987 대조.
  // [UTC 전환 밀리초, 전환 후 UTC 오프셋 분, DST 여부]. 이전 기본은 UTC+9.
  // 1948~1951,1955~1960,1987~1988 DST + 1954/1961 표준시 변경.
  var KOREA_TRANSITIONS = [[-681210000000,600,1],[-672228000000,540,0],[-654771600000,600,1],[-640864800000,540,0],[-623408400000,600,1],[-609415200000,540,0],[-588848400000,600,1],[-577965600000,540,0],[-498128400000,510,0],[-462702600000,570,1],[-451733400000,510,0],[-429784200000,570,1],[-418296600000,510,0],[-399544200000,570,1],[-387451800000,510,0],[-368094600000,570,1],[-356002200000,510,0],[-336645000000,570,1],[-324552600000,510,0],[-305195400000,570,1],[-293103000000,510,0],[-264933000000,540,0],[547578000000,600,1],[560883600000,540,0],[579027600000,600,1],[592333200000,540,0]];
  function koreaOffset(utc) {
    var value = [540, 0];
    KOREA_TRANSITIONS.forEach(function(t){ if(utc >= t[0]) value = [t[1], t[2]]; });
    return value;
  }
  function kstAdjustMinutes(ms) {
    var candidates = [];
    [510,540,570,600].forEach(function(off){
      var utc = ms - off * 60000, v = koreaOffset(utc);
      if(v[0] === off) candidates.push({utc:utc, offset:off, dst:v[1]});
    });
    // 전환으로 반복되거나 사라진 벽시각은 임의로 한쪽을 선택하지 않아요.
    if(candidates.length > 1) throw new Error('표준시·서머타임 종료로 두 번 있었던 시각이에요. 어느 회차인지 확인이 필요해 이번 명식을 확정하지 않았어요.');
    if(!candidates.length) throw new Error('표준시·서머타임 전환으로 존재하지 않는 시각이에요. 출생 기록의 시각을 확인해 주세요.');
    var c=candidates[0], notes=[];
    var base=c.dst ? c.offset-60 : c.offset;
    if(base===510) notes.push('한국 표준시 UTC+8:30을 UTC+9 기준으로 +30분 환산했어요.');
    if(c.dst) notes.push('한국 서머타임 기간이라 -60분 환산했어요.');
    return {minutes:540-c.offset, offset:c.offset, dst:!!c.dst, notes:notes};
  }

  function lunarToSolar(y, m, d, leap) {
    var lunar = Lunar.fromYmd(y, leap ? -m : m, d);
    var s = lunar.getSolar();
    // 존재하지 않는 음력 날짜(없는 윤달·30일 등) 검사
    var back = s.getLunar();
    if (back.getYear() !== y || Math.abs(back.getMonth()) !== m || (back.getMonth() < 0) !== !!leap || back.getDay() !== d) throw new Error('존재하지 않는 음력 날짜예요. 윤달 여부와 날짜를 확인해 주세요.');
    return { y: s.getYear(), m: s.getMonth(), d: s.getDay() };
  }

  function pillar(gz) { return { gz: gz, stem: gz[0], branch: gz[1], ko: STEM_KO[gz[0]] + BRANCH_KO[gz[1]], stemEl: STEM_EL[gz[0]], branchEl: BRANCH_EL[gz[1]] }; }

  /** opts: {calendar:'solar'|'lunar', y,m,d, leap, timeKnown, hh, mm, correction(bool, 기본 true), yajasi(bool, 기본 false)} */
  function compute(opts) {
    var y = +opts.y, m = +opts.m, d = +opts.d;
    var notes = [];
    if (opts.calendar === 'lunar') {
      var s = lunarToSolar(y, m, d, !!opts.leap);
      notes.push('음력 ' + y + '.' + m + '.' + d + (opts.leap ? '(윤달)' : '') + ' → 양력 ' + s.y + '.' + s.m + '.' + s.d);
      y = s.y; m = s.m; d = s.d;
    }
    var timeKnown = opts.timeKnown !== false;
    var hh = timeKnown ? +opts.hh : 12, mm = timeKnown ? +opts.mm : 0;
    var clock = wall(y, m, d, hh, mm);
    var adj = kstAdjustMinutes(clock);
    notes = notes.concat(adj.notes);
    var kstStd = clock + adj.minutes * 60000;           // UTC+9 표준시
    var instantCN = kstStd - 60 * 60000;                  // 같은 순간의 UTC+8 시각(라이브러리 절기 기준)
    var correction = opts.correction !== false;
    var local = kstStd - (correction ? 30 : 0) * 60000;  // 경도 보정 현지 시각

    var lunarCN = solarAt(instantCN).getLunar();
    var yearGZ = lunarCN.getYearInGanZhiExact();
    var monthGZ = lunarCN.getMonthInGanZhiExact();

    var ec = solarAt(local).getLunar().getEightChar();
    ec.setSect(opts.yajasi ? 2 : 1);
    var dayGZ = ec.getDay();
    var timeGZ = timeKnown ? ec.getTime() : null;
    if (!timeKnown) {
      // 시간을 모르면 정오 기준 일주. 절기 당일이면 연·월주가 바뀔 수 있음을 알림
      var uncertain = false;
      [0,1,2,3,12,22,23].forEach(function(h){
        try { var w=wall(y,m,d,h,0), a=kstAdjustMinutes(w), l=solarAt(w+(a.minutes-60)*60000).getLunar();
          if(l.getYearInGanZhiExact()!==yearGZ || l.getMonthInGanZhiExact()!==monthGZ) uncertain=true;
        } catch(e) { uncertain=true; }
      });
      try { var endW=wall(y,m,d,23,59), endA=kstAdjustMinutes(endW), endL=solarAt(endW+(endA.minutes-60)*60000).getLunar();
        if(endL.getYearInGanZhiExact()!==yearGZ || endL.getMonthInGanZhiExact()!==monthGZ) uncertain=true;
      } catch(e){ uncertain=true; }
      if(uncertain) notes.push('이날은 절입이나 시각 전환 경계가 있어 태어난 시각에 따라 연주·월주가 달라질 수 있어요.');
    }
    var pillars = { year: pillar(yearGZ), month: pillar(monthGZ), day: pillar(dayGZ), hour: timeGZ ? pillar(timeGZ) : null };
    var count = { '목': 0, '화': 0, '토': 0, '금': 0, '수': 0 };
    ['year', 'month', 'day', 'hour'].forEach(function (k) { var p = pillars[k]; if (!p) return; count[p.stemEl]++; count[p.branchEl]++; });
    var dm = pillars.day.stem;
    return {
      solar: { y: y, m: m, d: d, hh: hh, mm: mm }, timeKnown: timeKnown,
      pillars: pillars, count: count,
      basis: basis(pillars), timeZone: {offsetMinutes:adj.offset,dst:adj.dst,adjustMinutes:adj.minutes},
      dayMaster: { stem: dm, ko: STEM_KO[dm], el: STEM_EL[dm], yang: !!STEM_YANG[dm] },
      animal: ANIMAL[pillars.year.branch],
      localTime: toParts(local), notes: notes,
      text: [pillars.year.gz, pillars.month.gz, pillars.day.gz, timeGZ || '--'].join(' ')
    };
  }

  // 해설 근거 표: lunar-javascript LunarUtil.ZHI_HIDE_GAN / SHI_SHEN
  // (vendor/lunar.js 원본 표, https://6tail.cn/calendar/api.html 의 八字·十神).
  // 본기→나머지 순. 가중치 없이 숨은 천간을 각 1회 센다. 지지를 다시 더하지 않는다.
  var HIDDEN = {子:['癸'],丑:['己','癸','辛'],寅:['甲','丙','戊'],卯:['乙'],辰:['戊','乙','癸'],巳:['丙','庚','戊'],午:['丁','己'],未:['己','丁','乙'],申:['庚','壬','戊'],酉:['辛'],戌:['戊','辛','丁'],亥:['壬','甲']};
  var GOD_GROUP = {비견:'비겁',겁재:'비겁',식신:'식상',상관:'식상',편재:'재성',정재:'재성',편관:'관성',정관:'관성',편인:'인성',정인:'인성'};
  // 육합·육충 표는 vendor/lunar.js LunarUtil.HE_ZHI_6(:4556) / CHONG(:4551)와 대조. 합화·길흉·강약으로 확장하지 않는다.
  var SIX_HAP=['子丑','寅亥','卯戌','辰酉','巳申','午未'], SIX_CHUNG=['子午','丑未','寅申','卯酉','辰戌','巳亥'];
  var SEASON={寅:'봄',卯:'봄',辰:'봄',巳:'여름',午:'여름',未:'여름',申:'가을',酉:'가을',戌:'가을',亥:'겨울',子:'겨울',丑:'겨울'};
  function tenGod(dm, other) {
    var a=STEM_EL[dm], b=STEM_EL[other], same=!!STEM_YANG[dm]===!!STEM_YANG[other];
    if(a===b) return same?'비견':'겁재';
    if(GEN[a]===b) return same?'식신':'상관';
    if(CTRL[a]===b) return same?'편재':'정재';
    if(CTRL[b]===a) return same?'편관':'정관';
    return same?'편인':'정인';
  }
  function basis(P) {
    var dm=P.day.stem, groups={비겁:0,식상:0,재성:0,관성:0,인성:0}, expanded={목:0,화:0,토:0,금:0,수:0}, rows=[];
    ['year','month','day','hour'].forEach(function(k){
      var p=P[k]; if(!p) return;
      var h=HIDDEN[p.branch].slice(), stemGod=tenGod(dm,p.stem), mainGod=tenGod(dm,h[0]);
      expanded[p.stemEl]++;h.forEach(function(t){expanded[STEM_EL[t]]++;});
      // 일간 자신은 기준이므로 십신 무리의 빈도에서 제외. 나머지 천간+각 지지 본기만 센다.
      if(k!=='day') groups[GOD_GROUP[stemGod]]++;
      groups[GOD_GROUP[mainGod]]++;
      rows.push({key:k,stem:p.stem,stemGod:k==='day'?'일간(기준)':stemGod,branch:p.branch,hidden:h,hiddenGods:h.map(function(t){return tenGod(dm,t);}),mainGod:mainGod});
    });
    var month=P.month.branch, main=HIDDEN[month][0], mainEl=STEM_EL[main], el=STEM_EL[dm];
    var rel=relation(el,mainEl), command=mainEl===el?'같은 오행':GEN[mainEl]===el?'일간을 생하는 오행':GEN[el]===mainEl?'일간이 생하는 오행':CTRL[mainEl]===el?'일간을 극하는 오행':'일간이 극하는 오행';
    var md=month+P.day.branch, rev=P.day.branch+month;
    return {rows:rows,groups:groups,expanded:expanded,season:SEASON[month],monthBranch:month,dayBranch:P.day.branch,monthMain:main,monthMainEl:mainEl,monthRelation:rel,monthCommand:command,sameMonthElement:mainEl===el,
      monthDay:SIX_HAP.indexOf(md)>=0||SIX_HAP.indexOf(rev)>=0?'육합':SIX_CHUNG.indexOf(md)>=0||SIX_CHUNG.indexOf(rev)>=0?'육충':'해당 없음'};
  }

  // a(일간 오행) 기준 b 오행의 관계 → 십신 계열
  function relation(a, b) {
    if (a === b) return '비겁';
    if (GEN[a] === b) return '식상';
    if (CTRL[a] === b) return '재성';
    if (CTRL[b] === a) return '관성';
    if (GEN[b] === a) return '인성';
  }

  function todayPillar(date) {
    var dt = date || new Date();
    var l = Solar.fromYmd(dt.getFullYear(), dt.getMonth() + 1, dt.getDate()).getLunar();
    return pillar(l.getDayInGanZhi());
  }

  g.Saju = { compute: compute, relation: relation, todayPillar: todayPillar, lunarToSolar: lunarToSolar,
    basis:basis, tenGod:tenGod, HIDDEN:HIDDEN, GOD_GROUP:GOD_GROUP, resolveKoreaTime:kstAdjustMinutes, KOREA_TRANSITIONS:KOREA_TRANSITIONS,
    STEM_KO: STEM_KO, BRANCH_KO: BRANCH_KO, STEM_EL: STEM_EL, BRANCH_EL: BRANCH_EL, ELEMENTS: ELEMENTS, GEN: GEN, CTRL: CTRL, pad: pad };
})(typeof window !== 'undefined' ? window : globalThis);
