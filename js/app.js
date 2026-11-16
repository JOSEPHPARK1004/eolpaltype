/* 화면 흐름. 모든 입력과 사진은 이 기기의 메모리에만 있고, 저장·전송하지 않아요.
 * 예외: v12 지도는 명시적 추가 후 eolpal_map_v1에 타입 번호·선택 별명을 저장해요. 출석 체크를 켜면 출석 기록(방문 날짜·회차 일차·완주 기록·마지막 완주 날짜·쉬어 가기 여부)만 localStorage 키 1개(eolpal_attend_v1)에 저장해요(attend.js). */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var APP = window.APP_CONFIG, NAME = APP.name;
  document.title = NAME + ' · 관상 × 사주 × 성격유형';
  document.querySelectorAll('[data-app-name]').forEach(function (e) { e.textContent = NAME + (e.dataset.josa ? Josa.pick(NAME, e.dataset.josa) : ''); });
  $('wordmark').innerHTML = APP.wordmarkSvg ? '<img alt="' + NAME + '" src="data:image/svg+xml;charset=utf-8,' + encodeURIComponent(APP.wordmarkSvg) + '">' : '<span class="wm-text">' + NAME + '</span>';
  var T = Texts;
  var st = { cal: 'solar', gender: 'F', axes: {}, mbti: null, mbtiFromTest: false, photo: null, face: null, saju: null, testAns: [], name: '' };

  document.querySelectorAll('[data-logo]').forEach(function (e) { e.innerHTML = Art.logo; });
  document.querySelectorAll('[data-lock]').forEach(function (e) { e.innerHTML = Art.lock; });
  document.querySelectorAll('[data-face]').forEach(function (e) { e.innerHTML = e.dataset.face === 'jade' ? Art.face('#86C9B5', '#D6B579') : Art.face('#D6B579', '#86C9B5', true); });

  // 받침이 있으면 '과', 없으면 '와' (한글 음절이 아니면 '와')
  function wa(w) { return Josa.wa(w); }
  // 종합 탭 관상풀이 3줄: 얼굴형 · 삼정 · 그다음 부위 하나 (face.js 문장의 첫 문장만 씀)
  function faceBrief(f) {
    var first = function (i) { return i.text.split('. ')[0].replace(/\.$/, '') + '.'; };
    var shape = f.items.filter(function (i) { return i.part === '얼굴형'; })[0], sam = f.items.filter(function (i) { return i.part === '삼정'; })[0];
    var rest = f.items.filter(function (i) { return i !== shape && i !== sam; });
    return [shape, sam, rest[0]].filter(Boolean).map(first);
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function toast(t) { var e = $('toast'); e.textContent = t; e.classList.remove('hidden'); clearTimeout(toast.t); toast.t = setTimeout(function () { e.classList.add('hidden'); }, 1800); }
  var cur = 's-home';
  function go(id) {
    cur = id;
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.toggle('active', s.id === id); });
    var sc = $(id), step = +(sc.dataset.step || 0);
    $('steps').classList.toggle('hidden', !step || id === 's-result');
    document.querySelectorAll('#steps i').forEach(function (i, k) { i.classList.toggle('on', k < step); });
    $('backBtn').style.visibility = sc.dataset.back ? 'visible' : 'hidden';
    window.scrollTo(0, 0);
    window.dispatchEvent(new CustomEvent('eolpal:screen', { detail: id }));
  }
  $('backBtn').addEventListener('click', function () { var b = $(cur).dataset.back; if (b) go(b); });
  go('s-home');
  $('startBtn').addEventListener('click', function () { go('s-info'); });
  $('ageBack').addEventListener('click', function () { go('s-info'); });
  $('soonClose').addEventListener('click', function () { $('soonModal').classList.add('hidden'); });

  // ---------- STEP 1 ----------
  function seg(id, cb) { $(id).querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () { $(id).querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); }); cb(b.dataset.v); }); }); }
  seg('calSeg', function (v) { st.cal = v; $('leapWrap').classList.toggle('hidden', v !== 'lunar'); });
  seg('genderSeg', function (v) { st.gender = v; });
  $('nick').addEventListener('input', function () { $('nameCnt').textContent = this.value.length + '/10'; });
  var SIJIN = [['자시', '子時'], ['축시', '丑時'], ['인시', '寅時'], ['묘시', '卯時'], ['진시', '辰時'], ['사시', '巳時'], ['오시', '午時'], ['미시', '未時'], ['신시', '申時'], ['유시', '酉時'], ['술시', '戌時'], ['해시', '亥時']];
  function updSijin() {
    var v = $('bt').value; if (!v || $('timeUnknown').checked) { $('sijin').textContent = ''; return; }
    var m = +v.split(':')[0] * 60 + +v.split(':')[1] - ($('corr').checked ? 30 : 0);
    var i = Math.floor((((m + 60) % 1440) + 1440) % 1440 / 120); $('sijin').textContent = SIJIN[i][0] + ' · ' + SIJIN[i][1];
  }
  ['bt', 'corr'].forEach(function (id) { $(id).addEventListener('input', updSijin); $(id).addEventListener('change', updSijin); });
  $('timeUnknown').addEventListener('change', function () { $('bt').disabled = this.checked; updSijin(); });
  updSijin();
  // MBTI 축 선택(위아래 짝)
  var AX = [['E', '외향', 'I', '내향'], ['S', '감각', 'N', '직관'], ['T', '사고', 'F', '감정'], ['J', '판단', 'P', '인식']];
  AX.forEach(function (a, k) {
    [0, 2].forEach(function (o) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'ax'; b.dataset.axis = k; b.dataset.v = a[o];
      b.innerHTML = '<b>' + a[o] + '</b><span>' + a[o + 1] + '</span>';
      b.addEventListener('click', function () { st.axes[k] = a[o]; st.mbtiFromTest = false; paintAxes(); });
      $('mbtiAxes').appendChild(b);
    });
  });
  function paintAxes() { document.querySelectorAll('.ax').forEach(function (b) { b.classList.toggle('on', st.axes[b.dataset.axis] === b.dataset.v); }); }
  $('mbtiUnknown').addEventListener('change', function () { st.mbtiUnknown = this.checked; $('mbtiAxes').classList.toggle('off', this.checked); $('unkNote').classList.toggle('hidden', !this.checked); });
  function mbtiOf() { return [0, 1, 2, 3].every(function (k) { return st.axes[k]; }) ? [0, 1, 2, 3].map(function (k) { return st.axes[k]; }).join('') : null; }

  function readBirth(o) {
    if (!(o.y >= 1900 && o.y <= 2100 && o.m >= 1 && o.m <= 12 && o.d >= 1 && o.d <= 31)) throw new Error('생년월일을 다시 확인해 주세요.');
    if (o.calendar === 'solar') { var dt = new Date(o.y, o.m - 1, o.d); if (dt.getMonth() !== o.m - 1) throw new Error('존재하지 않는 날짜예요.'); }
    o.correction = $('corr').checked; o.yajasi = $('yaja').checked;
    return Saju.compute(o);
  }
  $('infoNext').addEventListener('click', function () {
    var err = $('infoErr'); err.classList.add('hidden');
    try {
      var t = $('bt').value || '12:00';
      st.saju = readBirth({ calendar: st.cal, y: +$('by').value, m: +$('bm').value, d: +$('bd').value, leap: $('leap').checked, timeKnown: !$('timeUnknown').checked, hh: +t.split(':')[0], mm: +t.split(':')[1] });
      st.mbti = st.mbtiUnknown ? null : mbtiOf(); st.mbtiFromFace = false; if (!st.mbti && !st.mbtiUnknown) throw new Error('성격유형을 축마다 하나씩 골라 주세요. 모르면 \'모름\'을 골라도 괜찮아요.');
      st.name = $('nick').value.trim();
      // 연령 확인: 입력한 생년월일(양력 환산)로 이 기기 안에서만 만 나이를 계산해요
      var now = new Date(), b = st.saju.solar, age = now.getFullYear() - b.y - ((now.getMonth() + 1 < b.m || (now.getMonth() + 1 === b.m && now.getDate() < b.d)) ? 1 : 0);
      if (age < 14) { st.saju = null; st.photo = null; st.face = null; st.type = null; st.name = ''; Attend.clear(); if (window.V12) window.V12.clear(); go('s-age'); return; } // 만 14세 미만: 이 기기의 출석 기록(eolpal_attend_v1)도 지워요(법무 10/30)
      go('s-photo');
    } catch (e) { err.textContent = e.message; err.classList.remove('hidden'); }
  });

  // ---------- MBTI 12문항 ----------
  $('toTest').addEventListener('click', function () { st.testAns = []; showQ(); go('s-test'); });
  function showQ() { var i = st.testAns.length, q = Mbti.Q[i]; $('testProg').textContent = '성격유형 간단 질문 · ' + (i + 1) + ' / ' + Mbti.Q.length; $('testBar').style.width = (i / Mbti.Q.length * 100) + '%'; $('testQ').textContent = q[1]; $('ansA').textContent = q[2]; $('ansB').textContent = q[3]; }
  function answer(a) {
    st.testAns.push(a);
    if (st.testAns.length < Mbti.Q.length) return showQ();
    var r = Mbti.score(st.testAns); r.split('').forEach(function (L, k) { st.axes[k] = L; }); st.mbtiFromTest = true; st.mbtiUnknown = false; $('mbtiUnknown').checked = false; $('mbtiAxes').classList.remove('off'); $('unkNote').classList.add('hidden'); paintAxes();
    if (st.afterTest) { st.afterTest = false; st.mbti = r; return showResult(); }
    go('s-info'); toast('간단 질문으로 본 성격유형은 ' + r + '예요. 직접 바꿔도 돼요.');
  }
  $('ansA').addEventListener('click', function () { answer('A'); });
  $('ansB').addEventListener('click', function () { answer('B'); });

  // ---------- STEP 2 사진 ----------
  setTimeout(function () { Face.init().catch(function () { }); }, 300); // 모델은 파일 안에 내장돼 있어 네트워크를 쓰지 않아요
  var up = $('upload'), timer = null;
  function setState(s) { up.dataset.state = s; }
  function setNext(enabled, label) { $('photoNext').disabled = !enabled; $('photoNext').textContent = label; }
  ['camInput', 'albumInput'].forEach(function (id) {
    $(id).addEventListener('change', function (e) {
      var f = e.target.files[0]; e.target.value = ''; if (!f) return;
      var rd = new FileReader(); // 브라우저 메모리에서만 읽어요(업로드 없음)
      rd.onload = function () { var img = new Image(); img.onload = function () { analyze(img); }; img.src = rd.result; };
      rd.readAsDataURL(f);
    });
  });
  function lockUpload() { var ok = $('consent').checked; up.classList.toggle('locked', !ok); $('camInput').disabled = !ok; $('albumInput').disabled = !ok; }
  $('consent').addEventListener('change', lockUpload); lockUpload();
  $('rePick').addEventListener('click', function () { st.photo = null; st.face = null; setState('empty'); setNext(false, '사진을 골라 주세요'); });
  async function analyze(img) {
    st.photo = img; st.face = null; setState('analyzing'); setNext(false, '풀이 준비 중…');
    var c = $('faceCanvas'), fr = c.parentElement.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    var sc = Math.min(fr.width / img.naturalWidth, fr.height / img.naturalHeight);
    c.width = img.naturalWidth * sc * dpr; c.height = img.naturalHeight * sc * dpr; c.style.width = img.naturalWidth * sc + 'px'; c.style.height = img.naturalHeight * sc + 'px';
    var ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, c.width, c.height);
    var pct = 0, subs = ['얼굴 위치 찾는 중', '눈매 · 눈썹 읽는 중', '코 · 입꼬리 읽는 중', '얼굴형 · 삼정 비율 계산 중'];
    clearInterval(timer);
    timer = setInterval(function () { pct = Math.min(92, pct + (pct < 60 ? 7 : 2)); $('progBar').style.width = pct + '%'; $('progPct').textContent = pct + '%'; $('progSub').textContent = subs[Math.min(3, Math.floor(pct / 25))] + ' · 이 기기 안에서 분석 중'; }, 120);
    var res = null, failed = false;
    try { res = await Face.analyze(img); } catch (e) { failed = true; }
    await new Promise(function (r) { setTimeout(r, 900); });
    clearInterval(timer); $('progBar').style.width = '100%'; $('progPct').textContent = '100%';
    if (!res) {
      setState('fail'); setNext(true, '사진 없이 풀이 보기');
      if (failed) up.querySelector('.up-fail .done-title').textContent = '이 브라우저에서는 얼굴 분석이 어려워요';
      return;
    }
    st.face = res;
    ctx.fillStyle = '#86C9B5';
    res.points.forEach(function (p) { ctx.beginPath(); ctx.arc(p.x * sc * dpr, p.y * sc * dpr, 2.2 * dpr, 0, 7); ctx.fill(); });
    setState('done');
    $('doneTitle').textContent = '얼굴 특징을 읽었어요 ';
    $('doneChips').innerHTML = [res.shape].concat(res.items.slice(2, 4).map(function (i) { return i.title; })).map(function (t, k) { return '<span class="chip ' + (k ? 'jade' : 'gold') + '">' + esc(t.replace(/\s*\([^)]*\)/g, '')) + '</span>'; }).join('');
    setNext(true, '풀이 보기');
  }
  $('photoNext').addEventListener('click', function () { if (!st.face) st.photo = null; showResult(); });
  $('skipPhoto').addEventListener('click', function () { st.photo = null; st.face = null; showResult(); });

  // ---------- 결과 ----------
  function pillarHTML(label, p) {
    if (!p) return '<div class="pillar"><small>' + label + '</small><b style="color:var(--hanji-3)">?</b><i>모름</i><span class="els">시간 모름</span></div>';
    return '<div class="pillar"><small>' + label + '</small><b><em style="color:' + T.EL_INFO[p.stemEl].color + '">' + p.gz[0] + '</em><em style="color:' + T.EL_INFO[p.branchEl].color + '">' + p.gz[1] + '</em></b><i>' + p.ko + '</i><span class="els">' + p.stemEl + '·' + p.branchEl + '</span></div>';
  }
  var HANJA = { '목': '木', '화': '火', '토': '土', '금': '金', '수': '水' };
  function showResult() {
    if (!st.mbti || st.mbtiFromFace) { // 성격유형 '모름'
      var f = Reading.faceMbti(st.face);
      if (f) { st.mbti = f; st.mbtiFromFace = true; }
      else { st.testAns = []; showQ(); go('s-test'); toast('사진 없이 보려면 성격유형이 필요해요. 간단 질문 12개로 골라 볼까요?'); st.afterTest = true; return; }
    }
    go('s-loading');
    setTimeout(function () {
      var S = st.saju, R = Reading.combined(S, st.mbti, st.face), dm = T.DM[S.dayMaster.stem];
      var fm = Reading.faceMbti(st.face);
      var TY = Reading.typeOf(S, st.mbti, st.face);
      var TD = Fortune.day(S, TY, new Date(), 0); // 운세 탭과 같은 규칙(점수가 어긋나지 않게)
      st.reading = R; st.today = TD; st.faceMbti = fm; st.type = TY;
      Object.assign(R, Explain.resultWords(st));
      var maxC = Math.max.apply(null, Saju.ELEMENTS.map(function (e) { return S.count[e]; })) || 1;
      var strong = Saju.ELEMENTS.slice().sort(function (a, b) { return S.count[b] - S.count[a]; })[0];
      st.strong = strong;
      var who = st.name ? esc(st.name) + '의 ' : '나의 ';
      var h = '<div class="r-head"><div class="avatar"><div>' + Art.face('#D6B579', '#86C9B5') + '</div></div><div><p class="eyebrow">' + who + (st.face ? '얼굴 풀이' : '사주 풀이') + '</p><h2 class="r-nick">' + esc(R.nick) + '</h2><div class="chips">' +
        '<span class="chip">' + (st.mbtiFromFace ? '사진 특징으로 본 추정 · ' : st.mbtiFromTest ? '간단 질문 결과 · ' : '직접 입력 · ') + st.mbti + '</span></div></div></div>';
      h += '<div class="tabs" id="tabs"><button data-t="sum" class="on">종합</button><button data-t="face">관상</button><button data-t="saju">사주</button><button data-t="mbti">성격유형</button><button data-t="match">궁합</button><button data-t="fortune">운세</button></div>';
      // 종합
      h += '<div class="pane on" id="p-sum">' +
        // 얼팔타입 32가지 분류 카드(종합 탭 맨 위): 번호·이름·이모지, 한 줄 설명, 세 축, 지금 별명은 작은 줄로
        '<div class="card" style="border-color:' + TY.color + '66"><p class="eyebrow" style="color:' + TY.color + '">얼팔타입 No.' + TY.no + '</p>' +
        '<h3 class="h2" style="margin:4px 0 2px">' + TY.name + '</h3><p class="p">' + esc(Explain.youAre(st)) + '</p>' +
        '<p class="cap" style="margin-top:6px">' + TY.season + ' 무리(사주 월지 상징) · ' + TY.imp + '한 인상(관상) · ' + TY.group + '(성격유형)</p>' +
        '<p class="cap">내 별명: ' + esc(R.nick) + '</p>' +
        (TY.fromPhoto ? '' : '<p class="cap" style="margin-top:6px">사진 없이 봐서 인상은 일간의 음양으로 정했어요.</p>') + '</div>' +
        Explain.synth(st) +
        '<div class="grid2c"><div class="card"><div class="ttl">오행 밸런스</div><div class="vbars">' + Saju.ELEMENTS.map(function (e) { var I = T.EL_INFO[e]; return '<div class="vbar"><div class="t"><i style="height:' + (S.count[e] / maxC * 100) + '%;background:' + I.color + '"></i></div><b style="color:' + I.color + '">' + HANJA[e] + '</b><small>' + e + ' ' + S.count[e] + '</small></div>'; }).join('') + '</div></div>' +
        '<div class="card"><div class="ttl">찰떡 성격유형</div><div class="bigm">' + R.best + '</div><p class="cap">' + T.MBTI[R.best][0] + wa(T.MBTI[R.best][0]) + ' 재밌게 잘 맞는 편이에요.</p></div></div>' +
        '<div class="card"><div class="ttl">함께 읽는 키워드</div><div class="chips">' + R.tags.map(function (t, k) { return '<span class="chip ' + (k ? 'jade' : 'gold') + '">#' + t + '</span>'; }).join('') + '</div><p class="p" style="margin-top:10px">' + R.summary + '</p></div>' +
        '<div class="card"><div class="ttl">성격 방향과 강점</div><div class="chips">' + R.moments.map(function (m) { return '<span class="chip">' + m + '</span>'; }).join('') + '</div><div class="ttl" style="margin-top:14px">함께 살펴볼 엇박자</div><p class="p">' + R.habit + '</p><p class="p sub">작은 팁: ' + R.tip + '</p></div>' +
        '<div class="card today"><div class="ttl">오늘의 운세 <span>' + TD.m + '.' + TD.d + ' · 일진 ' + TD.ko + '</span></div><div class="score">' + TD.score + '<small>점 · ' + TD.title + '</small></div><p class="p" style="margin-top:8px">' + TD.lead + '</p><p class="cap" style="margin-top:6px"><span class="dot" style="background:' + TD.colorHex + '"></span>행운 색 ' + TD.color + ' · 행운 숫자 ' + TD.number + '</p><button class="btn secondary sm" id="toFortune" style="margin-top:10px"><svg class="e-icon e-icon-clock" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><path d="M54 32A22 22 0 1 1 10 32A22 22 0 1 1 54 32Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M32 18V33L43 39" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg> 운세 탭에서 자세히 보기 ›</button></div>' +
        '<div class="card"><div class="ttl">심층 리포트 <span>출시 예정</span></div><p class="p sub">부위별 관상, 사주 4주 상세, 연애·일 스타일까지 담은 리포트를 준비하고 있어요.</p><button class="btn secondary sm" id="reportBtn" style="margin-top:10px">심층 리포트 열어 보기</button></div>' +
        '<button class="btn secondary sm" id="copyShare" style="margin-top:6px">결과 문구 복사</button><img id="cardPreview" class="card-preview hidden" alt="결과 카드 미리보기"></div>';
      // 관상
      h += '<div class="pane" id="p-face">' + Explain.facePane(st) + '</div>';
      // 사주
      h += '<div class="pane" id="p-saju">' + Explain.sajuPane(st) + '</div>';
      // MBTI
      h += '<div class="pane" id="p-mbti">' + Explain.mbtiPane(st) + '</div>';
      // 궁합
      h += '<div class="pane" id="p-match"><div class="card mform"><div class="ttl">상대방 정보 <span>저장하지 않아요</span></div>' +
        '<input class="field" id="pName" maxlength="10" placeholder="상대 이름 또는 닉네임">' +
        '<div class="birth-row" style="margin-top:8px"><div class="seg" id="pCalSeg"><button type="button" class="on" data-v="solar">양력</button><button type="button" data-v="lunar">음력</button></div><div class="field date"><input id="py" inputmode="numeric" maxlength="4" placeholder="1997"><span>.</span><input id="pm" inputmode="numeric" maxlength="2" placeholder="03"><span>.</span><input id="pd" inputmode="numeric" maxlength="2" placeholder="08"></div></div>' +
        '<label class="check hidden" id="pLeapWrap"><input type="checkbox" id="pLeap"><i></i>윤달이에요</label>' +
        '<div class="grid" style="margin-top:8px"><div class="field time"><input type="time" id="pt" value="12:00"></div><select class="field" id="pMbti">' + Mbti.TYPES.map(function (t) { return '<option value="' + t + '">' + t + '</option>'; }).join('') + '</select></div>' +
        '<label class="check"><input type="checkbox" id="pTimeUnknown"><i></i>상대 태어난 시간을 몰라요</label><p class="err hidden" id="matchErr"></p>' +
        '<button class="btn primary sm" id="matchGo" style="margin-top:12px">궁합 보기</button><p class="cap" style="margin-top:8px">상대방에게 먼저 물어보고 입력해 주세요.</p></div><div id="matchResult"></div></div>';
      h += '<p class="foot">재미로 보는 콘텐츠예요. 과학적 판단이나 미래 예측이 아니에요.<br>사진과 생년월일은 이 기기 안에서만 처리되고 저장·전송되지 않아요. 출석 체크를 켜면 출석 기록(운세를 본 날짜·회차·완주 기록·쉬어 가기 여부)을 이 기기에 저장해요. 지도에 추가하면 타입 번호·선택 별명도 별도 저장돼요.</p>' +
        '<details class="legal"><summary>자세히 보기</summary><p style="margin-top:6px">' + NAME + '의 관상, 사주, 성격유형 풀이는 가볍게 즐기려고 만든 오락용 콘텐츠예요. 과학적으로 검증된 진단이 아니고, 미래를 예측하거나 보장하지 않아요. 의학적·심리학적 진단을 대신하지 않으니 건강, 투자, 법률, 채용, 연애 상대 선택 같은 중요한 결정의 근거로 쓰지 말아 주세요.</p><p style="margin-top:6px">사진은 이 브라우저 안에서만 분석하고 서버로 보내거나 저장하지 않아요. 생년월일도 기기 안에서만 계산해요. 공유 문구와 카드에는 결과만 담기고, 사진과 생년월일 원래 값은 들어가지 않아요.</p><p style="margin-top:6px">출석 체크 기능을 켠 경우에만 출석 기록을 이 브라우저의 저장 공간(localStorage)에 남겨요. 남기는 것은 운세를 본 날짜(최근 14일), 이번 회차 일차, 완주 횟수와 마지막 완주 날짜, ‘쉬어 가기’ 사용 여부예요. 출석 키에는 사진·생년월일·이름·성격유형·결과를 남기지 않아요. 궁합 지도는 ‘지도에 추가’를 누른 경우 별도 키 eolpal_map_v1에 내 타입 번호와 친구의 타입 번호·선택 별명만 저장해요. 궁합 탭에서 개별 삭제·전체 삭제할 수 있어요. 같은 브라우저 사용자도 볼 수 있으며 브라우저 설정에 따라 사라질 수 있어요. 출석 기록은 이 기기 밖으로 보내지 않고 운영자도 볼 수 없어요. ‘출석 기록 지우기’나 브라우저의 사이트 데이터 삭제로 언제든 지울 수 있어요.</p><p style="margin-top:6px">' + NAME + Josa.eun(NAME) + ' 만 14세 이상만 이용할 수 있어요.</p>' +
        '<p style="margin-top:6px">사주 계산: lunar-javascript(MIT) · 얼굴 분석: face-api.js(MIT) · 글꼴: Pretendard(서브셋 수정본, 이름 EolpalSans), 고운바탕, Noto Serif KR(SIL OFL 1.1)</p></details>';
      $('result').innerHTML = h; go('s-result');
      document.querySelectorAll('#tabs button').forEach(function (b) { b.addEventListener('click', function () { if (b.dataset.t === 'fortune') goFortune(); else tab(b.dataset.t); }); });
      $('toFortune').addEventListener('click', goFortune);
      $('copyShare').addEventListener('click', copyShare);
      $('reportBtn').addEventListener('click', function () { $('soonModal').classList.remove('hidden'); }); // 결제 화면 없이 바로 '준비 중' 안내
      var ap = $('addPhoto'); if (ap) ap.addEventListener('click', function () { go('s-photo'); });
      bindMatch();
      if (window.V12) window.V12.result();
    }, 800);
  }
  function tab(t) {
    document.querySelectorAll('#tabs button').forEach(function (x) { x.classList.toggle('on', x.dataset.t === t); });
    document.querySelectorAll('.pane').forEach(function (p) { p.classList.toggle('on', p.id === 'p-' + t); });
    var tb = $('tabs'); if (window.scrollY > tb.offsetTop - 56) window.scrollTo(0, tb.offsetTop - 56);
  }
  $('toMatch').addEventListener('click', function () { tab('match'); });
  $('saveCard').addEventListener('click', async function () {
    var c = await Card.draw($('cardCanvas'), st);
    var url = c.toDataURL('image/png');
    var a = document.createElement('a'); a.href = url; a.download = NAME + '_결과카드.png'; document.body.appendChild(a); a.click(); a.remove();
    tab('sum'); var p = $('cardPreview'); p.src = url; p.classList.remove('hidden'); toast('결과 카드를 저장했어요. 사진과 생년월일은 들어가지 않아요.');
  });
  function shareText() { // 공유 문구에는 별명·키워드 같은 결과만 넣어요(사진·생년월일·시간 없음)
    var head = '나는 얼팔타입 No.' + st.type.no + ' ' + st.type.name + '\n' + Explain.source(st) + '\n' + st.reading.nick + '\n' + st.reading.summary;
    return head + '\n' + st.reading.tags.map(function (x) { return '#' + x; }).join(' ') + '\n' + APP.hashtags.join(' ') + '\n재미로 보는 콘텐츠예요. 과학적 판단이나 미래 예측이 아니에요.';
  }
  function copyShare() {
    var t = shareText(), done = function () { toast('결과 문구를 복사했어요'); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(done, fb); else fb();
    function fb() { var ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) { } ta.remove(); done(); }
  }
  function bindMatch() {
    var pCal = 'solar';
    seg('pCalSeg', function (v) { pCal = v; $('pLeapWrap').classList.toggle('hidden', v !== 'lunar'); });
    $('pTimeUnknown').addEventListener('change', function () { $('pt').disabled = this.checked; });
    $('matchGo').addEventListener('click', function () {
      $('matchErr').classList.add('hidden');
      try {
        var t = $('pt').value || '12:00';
        var B = readBirth({ calendar: pCal, y: +$('py').value, m: +$('pm').value, d: +$('pd').value, leap: $('pLeap').checked, timeKnown: !$('pTimeUnknown').checked, hh: +t.split(':')[0], mm: +t.split(':')[1] });
        var name = $('pName').value.trim() || '상대방', mB = $('pMbti').value, me = st.name || '나';
        var M = Reading.match(st.saju, B, st.mbti, mB, name), C = 2 * Math.PI * 58;
        var bar = function (lab, v, col) { return '<div class="mbar"><div class="top"><span>' + lab + '</span><b>' + v + '</b></div><div class="t"><i style="width:' + v + '%;background:' + col + '"></i></div></div>'; };
        $('matchResult').innerHTML = '<div class="vs"><div><div class="avatar av"><div>' + Art.face('#D6B579', '#86C9B5') + '</div></div><b>' + esc(me) + '</b><small>' + st.mbti + ' · ' + HANJA[st.saju.dayMaster.el] + '</small></div>' +
          '<div class="ring"><svg width="132" height="132"><defs><linearGradient id="rg" x1="0" x2="1"><stop offset="0" stop-color="#D6B579"/><stop offset="1" stop-color="#86C9B5"/></linearGradient></defs><circle cx="66" cy="66" r="58" stroke="#27304A" stroke-width="6" fill="none"/><circle cx="66" cy="66" r="58" stroke="url(#rg)" stroke-width="6" fill="none" stroke-linecap="round" stroke-dasharray="' + (C * M.score / 100) + ' ' + C + '"/></svg><div class="in"><small>찰떡 지수</small><b>' + M.score + '</b></div></div>' +
          '<div><div class="avatar av" style="border-color:rgba(134,201,181,.5)"><div>' + Art.face('#86C9B5', '#D6B579') + '</div></div><b>' + esc(name) + '</b><small>' + mB + ' · ' + HANJA[B.dayMaster.el] + '</small></div></div>' +
          '<div class="m-head"><span class="pairc">' + M.pair + ' · ' + M.label + '</span><h3 class="h1" style="font-size:24px">' + M.head + '</h3></div>' +
          '<div class="card">' + bar('사주 오행', M.parts.el, '#D6B579') + bar('일지 궁합', M.parts.br, '#7D9BE0') + bar('성격유형 조합', M.parts.mb, '#86C9B5') + '</div>' +
          '<div class="card"><ul class="ls">' + M.notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul><div class="chips" style="margin-top:10px">' + M.chips.map(function (c, k) { return '<span class="chip ' + (k % 2 ? 'jade' : 'gold') + '">' + c + '</span>'; }).join('') + '</div></div>' +
          '<p class="foot">재미로 보는 궁합이에요 · 관계를 판단하지 않아요</p>';
        window.scrollTo({ top: $('matchResult').getBoundingClientRect().top + window.scrollY - 120, behavior: 'instant' });
      } catch (e) { $('matchErr').textContent = e.message; $('matchErr').classList.remove('hidden'); }
    });
  }

  // ===================== 운세 탭 (화면시안 09·10) + 2027 신년운세 + 7일 출석 (화면시안 11·12) =====================
  // 운세는 지금 메모리에 있는 입력값으로 그때그때 계산해요. 출석을 켠 경우에만 방문 날짜·횟수를 localStorage 키 하나에 남겨요.
  var DISC = '재미로 보는 콘텐츠예요 · 중요한 결정은 스스로 판단해 주세요';
  var WD_FULL = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  var FIELD_COL = { '애정': '#E9A3B4', '금전': 'var(--gold)', '일·공부': '#7D9BE0', '컨디션': 'var(--jade)', '관계·애정': '#E9A3B4' };
  function eyo(w) { return Josa.eyo(w); }
  function nowD() { return new Date(); }
  function ring(score, col, size, inner, sub) {
    return '<div class="f-ring" style="width:' + size + 'px;height:' + size + 'px;background:conic-gradient(' + col + ' 0 ' + score + '%,var(--ink-600) ' + score + '% 100%)"><i style="inset:' + inner + 'px"></i><div><b>' + score + '</b><small>' + sub + '</small></div></div>';
  }
  function attView() { Attend.tidy(nowD()); return Attend.enabled() ? Attend.view(Attend.load(), nowD()) : null; }
  function copyText(t, msg) {
    var done = function () { toast(msg); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(done, fb); else fb();
    function fb() { var ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) { } ta.remove(); done(); }
  }
  function goFortune() { renderHome(); go('s-fortune'); }

  // ---------- 09 운세 홈 ----------
  function renderHome() {
    var S = st.saju, TY = st.type, now = nowD(), D = Fortune.day(S, TY, now, 0), W7 = Fortune.week(S, TY, now, 0, 7), av = attView();
    var h = '<p class="eyebrow f-eb">' + D.m + '월 ' + D.d + '일 ' + WD_FULL[now.getDay()] + ' · ' + D.ko + '일</p>' +
      '<button class="f-my" id="fMy" style="border-color:' + TY.color + '73;background:linear-gradient(135deg,' + TY.color + '29,rgba(27,35,56,.92) 55%)">' + ring(D.score, TY.color, 74, 6, '오늘 점수') +
      '<div class="f-my-t"><div class="f-tno" style="color:' + TY.color + '">얼팔타입 No.' + TY.no + ' · ' + EIcons.emblem(TY.no) + '</div><div class="f-tname">' + esc(D.typeTitle) + '</div><div class="f-tmsg">' + esc(D.title + '. ' + D.lead.split('. ')[0].replace(/\.$/, '') + '.') + '</div></div></button>' +
      // 점수는 오늘만 보여 줘요(조셉님 13:53). 다른 날은 요일·날짜만, 그날이 되면 열려요
      '<div class="f-strip">' + W7.map(function (x, i) { return i === 0 ? '<button data-off="0" class="on"><span>오늘</span><b>' + x.score + '</b></button>' : '<button data-off="' + i + '" class="later" aria-label="' + x.m + '월 ' + x.d + '일 ' + x.wd + '요일, 그날 열려요"><span>' + x.wd + '</span><b>' + x.d + '일</b></button>'; }).join('') + '</div>' +
      // 출석 입구 카드(13:24 승인: 주간 줄 아래)
      '<button class="f-att" id="fAtt">' + (av ? '<span class="i"><svg class="e-icon e-icon-attend" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><path d="M14 14H50V52H14Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 24H50M23 10V18M41 10V18M22 32H26M31 32H35M40 32H44M22 41H26M31 41H35M40 41H44" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="t"><b>' + (av.today ? '출석 ' + av.n + '일째' : '오늘 출석 체크하기') + '</b><small>' + (av.today ? (av.n >= 7 ? '완주 보상이 열렸어요' : av.n + '일차 보상까지 열렸어요') : '오늘의 운세를 열면 출석 체크가 돼요') + '</small></span>' : '<span class="i"><svg class="e-icon e-icon-attend" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><path d="M14 14H50V52H14Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 24H50M23 10V18M41 10V18M22 32H26M31 32H35M40 32H44M22 41H26M31 41H35M40 41H44" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="t"><b>7일 출석 체크</b><small>켜면 매일 작은 덤 보상이 열려요 · 기본은 꺼져 있어요</small></span>') + '<span class="r">›</span></button>' +
      '<div class="f-sec"><b>기간별 운세</b><span class="cap">같은 날엔 늘 같은 결과예요</span></div>' +
      '<div class="f-menu">' +
      '<button class="f-m big" data-go="year"><span class="ic"><svg class="e-icon e-icon-fortune" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><path d="M54 32A22 22 0 1 1 10 32A22 22 0 1 1 54 32Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 22V42M29 18V46M36 18V46M43 22V42" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 27H25M26 24H32M33 24H39M40 27H46M19 37H25M26 40H32M33 40H39M40 37H46" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="tx"><span class="t">2027 신년운세 · 정미년</span><span class="d">붉은 양의 해, ' + esc(TY.name) + '의 한 해 흐름과 좋은 달</span></span><span class="tag new">NEW</span></button>' +
      '<button class="f-m" data-go="d0"><span class="tag beta">베타</span><span class="ic"><svg class="e-icon e-icon-clock" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><path d="M54 32A22 22 0 1 1 10 32A22 22 0 1 1 54 32Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M32 18V33L43 39" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="t">오늘의 운세</span><span class="d">총점 · 분야 4개 · 시간대</span></button>' +
      '<button class="f-m" data-go="d1"><span class="tag beta">베타</span><span class="ic"><svg class="e-icon e-icon-fortune" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><path d="M54 32A22 22 0 1 1 10 32A22 22 0 1 1 54 32Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 22V42M29 18V46M36 18V46M43 22V42" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 27H25M26 24H32M33 24H39M40 27H46M19 37H25M26 40H32M33 40H39M40 37H46" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="t">내일의 운세</span><span class="d">하루 먼저 미리 보기</span></button>' +
      '<button class="f-m dim" data-go="soon"><span class="tag soon">곧</span><span class="ic"><svg class="e-icon e-icon-chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><path d="M12 12V52H54" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 42L29 32L38 37L50 20" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="t">이번 주 흐름</span><span class="d">7일 점수와 좋은 날</span></button>' +
      '<button class="f-m dim" data-go="soon"><span class="tag soon">곧</span><span class="ic"><svg class="e-icon e-icon-attend" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><path d="M14 14H50V52H14Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 24H50M23 10V18M41 10V18M22 32H26M31 32H35M40 32H44M22 41H26M31 41H35M40 41H44" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="t">이달의 운세</span><span class="d">' + (now.getMonth() + 1) + '월 월운 한눈에</span></button>' +
      '<button class="f-m dim" data-go="soon"><span class="tag soon">곧</span><span class="ic"><svg class="e-icon e-icon-seal" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><path d="M32 8L38 14L47 15L49 24L55 32L49 40L47 49L38 50L32 56L26 50L17 49L15 40L9 32L15 24L17 15L26 14Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 32L29 38L41 25" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="t">오늘의 32타입 순위</span><span class="d">친구 타입과 비교</span></button>' +
      '<button class="f-m" data-go="match"><span class="ic"><svg class="e-icon e-icon-connect" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><path d="M36 32A14 14 0 1 1 8 32A14 14 0 1 1 36 32Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M56 32A14 14 0 1 1 28 32A14 14 0 1 1 56 32Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 27L38 37M26 37L38 27" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="t">궁합</span><span class="d">사주 × 성격유형 궁합</span></button></div>' +
      '<p class="foot">' + DISC + '</p>';
    $('fHome').innerHTML = h;
    $('fMy').addEventListener('click', function () { openDay(0); });
    $('fHome').querySelectorAll('.f-strip button').forEach(function (b) { b.addEventListener('click', function () { var o = +b.dataset.off; if (o === 0) openDay(0); else { var w = W7[o]; toast(w.m + '월 ' + w.d + '일(' + w.wd + ') 운세는 그날 열려요'); } }); });
    $('fAtt').addEventListener('click', function () { if (Attend.enabled()) openAttend(); else $('attSheet').classList.remove('hidden'); });
    $('fHome').querySelectorAll('.f-m').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.dataset.go;
        if (v === 'year') openYear(); else if (v === 'd0') openDay(0); else if (v === 'd1') openDay(1);
        else if (v === 'match') { go('s-result'); tab('match'); } else toast('준비 중이에요. 곧 열려요');
      });
    });
  }
  $('navType').addEventListener('click', function () { go('s-result'); tab('sum'); });
  $('navMatch').addEventListener('click', function () { go('s-result'); tab('match'); });

  // ---------- 10 오늘·내일(·모레)의 운세 ----------
  var EV_MSG = { first: '출석 1일째 체크했어요', next: null, 'skip-used': '하루 쉰 날은 쉬어 가기로 이어졌어요 ', restart: '1일차부터 새로 시작해요. 다시 만나서 반가워요!', 'new-round': '새 회차 1일차예요. 이번에도 천천히 모아 봐요', complete: '7일 완주! 완주 보상이 열렸어요 ', clock: '날짜가 바뀌어서 오늘부터 다시 셀게요' };
  function openDay(off) {
    if (off === 0 && Attend.enabled()) { var r = Attend.record(nowD()); if (r && r.ev !== 'same') toast(EV_MSG[r.ev] || '출석 ' + r.state.n + '일째 체크했어요'); }
    renderDay(off); go('s-fday');
  }
  function renderDay(off) {
    var S = st.saju, TY = st.type, D = Fortune.day(S, TY, nowD(), off), av = attView(), n = av ? av.n : 0, rw = '<span class="f-rw">출석 보상</span>';
    var lab = off === 0 ? '오늘' : off === 1 ? '내일' : '모레';
    var h = '<h2 class="f-title">' + lab + '의 운세</h2><p class="eyebrow f-eb center">' + D.m + '.' + D.d + ' ' + D.wd + ' · ' + D.ko + '일 ' + D.gz + '</p>' +
      // 내일은 숫자 점수를 보여 주지 않아요(조셉님 13:57) — 링 대신 같은 크기의 무늬 원, 분야는 이름만
      '<div class="f-hero">' + (off === 1 ? '<div class="f-ring f-ring-n" style="width:132px;height:132px;background:conic-gradient(' + TY.color + '59 0 100%)"><i style="inset:9px"></i><div><b><svg class="e-icon e-icon-fortune" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><path d="M54 32A22 22 0 1 1 10 32A22 22 0 1 1 54 32Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 22V42M29 18V46M36 18V46M43 22V42" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 27H25M26 24H32M33 24H39M40 27H46M19 37H25M26 40H32M33 40H39M40 37H46" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></b><small>' + esc(TY.name) + ' · No.' + TY.no + '</small></div></div>' : ring(D.score, TY.color, 132, 9, esc(TY.name) + ' · No.' + TY.no)) + '<div class="f-theme">' + D.title + '</div><p class="f-lead">' + esc(D.lead) + '</p>' +
      (D.notes.length ? '<p class="cap f-notes">' + D.notes.map(esc).join(' ') + '</p>' : '') + '</div>' +
      (off === 1 ? '<div class="card f-fields f-fields-n"><div class="f-fchips">' + D.fields.map(function (f) { var on = f.name === D.focus; return '<span class="chip' + (on ? ' gold' : '') + '">' + (on ? '<svg class="e-icon e-icon-sparkle" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><path d="M32 8L37 25L54 32L37 39L32 56L27 39L10 32L27 25Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M47 10V18M43 14H51" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg> ' : '') + EIcons.svg(f.icon) + ' ' + f.name + '</span>'; }).join('') + '</div><p class="cap" style="margin-top:8px"><svg class="e-icon e-icon-sparkle" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><path d="M32 8L37 25L54 32L37 39L32 56L27 39L10 32L27 25Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M47 10V18M43 14H51" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg> 내일 흐름이 실리는 분야예요</p></div>' :
      '<div class="card f-fields">' + D.fields.map(function (f) { return '<div class="f-fr"><span class="fn">' + EIcons.svg(f.icon) + ' ' + f.name + '</span><div class="fb"><i style="width:' + f.v + '%;background:' + FIELD_COL[f.name] + '"></i></div><b>' + f.v + '</b></div>'; }).join('') + '</div>') +
      '<div class="f-time">' + D.slots.map(function (s) { return '<div><span>' + s.label + '</span><b>' + EIcons.svg(s.icon) + ' ' + s.word + '</b></div>'; }).join('') + '</div>' +
      (n >= 2 ? '<div class="card f-rcard" id="rw2"><div class="ttl">시간대 풀이 펼치기 ' + rw + '</div>' + D.slots.map(function (s) { return '<p class="p"><b>' + s.label + '</b> · ' + esc(s.detail) + '</p>'; }).join('') + '</div>' : '') +
      '<div class="card f-tip" style="border-color:' + TY.color + '6b;background:linear-gradient(135deg,' + TY.color + '21,rgba(27,35,56,.92) 60%)"><div class="h" style="color:' + TY.color + '">' + EIcons.emblem(TY.no) + ' ' + esc(D.typeTitle) + '</div><p>' + esc(D.typeLine) + '</p></div>' +
      (n >= 3 ? '<div class="card f-rcard" id="rw3"><div class="ttl">' + esc(TY.name) + '의 숨은 강점 ' + rw + '</div><p class="p">' + esc(D.strength.replace(TY.name + '의 숨은 강점: ', '')) + '</p></div>' : '') +
      (n >= 5 ? '<div class="card f-rcard" id="rw5"><div class="ttl">' + lab + '의 대화 주제 3개 ' + rw + '</div><ul class="ls">' + D.talk.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>' : '') +
      '<div class="f-lucky"><span class="chip gold">행운 색 · ' + D.color + '</span><span class="chip gold">행운 숫자 · ' + D.number + '</span><span class="chip jade">#' + D.keyword + '</span>' +
      (n >= 1 ? '<span class="chip gold" id="rw1"><svg class="e-icon e-icon-leaf" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><path d="M15 48C8 24 27 12 51 13C54 37 36 55 15 48Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 48L42 22M27 37V25M27 37H40" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg> 행운 아이템 · ' + esc(D.item) + '</span>' : '') + '</div>' +
      (n >= 1 ? '<p class="cap" style="margin-top:6px">행운 아이템은 출석 보상이에요. 부족한 ' + D.itemEl + ' 기운을 가볍게 채워 주는 물건이에요.</p>' : '') +
      '<p class="foot">' + DISC + '</p>';
    $('fDay').innerHTML = h;
    $('fDayShare').textContent = lab + ' 카드 공유';
    $('fDayNext').textContent = off === 0 ? ' 내일 운세 미리 보기' : ' 오늘 운세 보기';
    $('fDayNext').onclick = function () { openDay(off === 0 ? 1 : 0); };
    $('fDayShare').onclick = function () {
      copyText('나는 얼팔타입 No.' + TY.no + ' ' + TY.name + ' ' + TY.emoji + '\n' + D.m + '/' + D.d + ' ' + lab + '의 운세 ' + (off === 1 ? '' : D.score + '점 ') + '· ' + D.title + '\n' + D.typeLine + '\n' + APP.hashtags.join(' ') + '\n재미로 보는 콘텐츠예요.', lab + '의 운세 문구를 복사했어요');
    };
  }

  // ---------- 2027 신년운세 (09·10 구성 요소로 구성) ----------
  function openYear() {
    var S = st.saju, TY = st.type, Y = Fortune.year(S, TY, 2027), mx = 96, mn = 60;
    var h = '<p class="eyebrow f-eb center">2027 정미년 ' + Y.gz + ' · 붉은 양의 해</p><div class="f-hero"><div class="f-sheep"><svg class="e-icon e-icon-fortune" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><path d="M54 32A22 22 0 1 1 10 32A22 22 0 1 1 54 32Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 22V42M29 18V46M36 18V46M43 22V42" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 27H25M26 24H32M33 24H39M40 27H46M19 37H25M26 40H32M33 40H39M40 37H46" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></div><h2 class="h1 center" style="font-size:25px">' + esc(Y.typeTitle) + '</h2>' +
      '<div class="f-theme" style="margin-top:2px">' + Y.title + '</div><p class="f-lead">' + esc(Y.lead) + '</p></div>' +
      (Y.note ? '<div class="hl">' + esc(Y.note) + '</div>' : '') +
      '<div class="card"><div class="ttl">분야별 흐름</div>' + Y.fields.map(function (f) { return '<div class="f-yf"><span>' + EIcons.svg(f.icon) + ' ' + f.name + '</span><p>' + esc(f.text) + '</p></div>'; }).join('') + '</div>' +
      '<div class="card"><div class="ttl">월별 흐름 <span>2027.1 ~ 12</span></div><div class="f-graph m12">' + Y.months.map(function (x) { var b = Y.best.indexOf(x.m) >= 0; return '<div class="b' + (b ? ' best' : '') + '"><em>' + x.score + '</em><i style="height:' + Math.round((x.score - mn + 4) / (mx - mn + 4) * 78) + 'px;' + (b ? 'background:' + TY.color : '') + '"></i><span>' + x.m + '</span></div>'; }).join('') + '</div>' +
      '<div class="chips" style="margin-top:10px"><span class="chip gold">흐름이 좋은 달 · ' + Y.best.join('·') + '월</span><span class="chip">천천히 가도 되는 달 · ' + Y.slow.join('·') + '월</span></div><p class="cap" style="margin-top:8px">' + Y.startNote + '</p></div>' +
      '<div class="card f-tip" style="border-color:' + TY.color + '6b;background:linear-gradient(135deg,' + TY.color + '21,rgba(27,35,56,.92) 60%)"><div class="h" style="color:' + TY.color + '">' + EIcons.emblem(TY.no) + ' ' + esc(TY.name) + '에게</div><p>' + esc(Y.typeLine) + '</p></div>' +
      '<p class="foot">' + DISC + '</p>';
    $('fYear').innerHTML = h;
    $('fYearShare').onclick = function () { copyText('나는 얼팔타입 No.' + TY.no + ' ' + TY.name + ' ' + TY.emoji + '\n' + Y.typeTitle + ' · ' + Y.title + '\n' + Y.typeLine + '\n' + APP.hashtags.join(' ') + '\n재미로 보는 콘텐츠예요.', '신년운세 문구를 복사했어요'); };
    go('s-year');
  }
  $('fYearHome').addEventListener('click', function () { goFortune(); });

  // ---------- 출석: 켜기 시트 · 지우기 ----------
  $('attOn').addEventListener('click', function () { Attend.enable(); $('attSheet').classList.add('hidden'); var r = Attend.record(nowD()); toast('출석 체크를 켰어요. 오늘 1일째 체크했어요'); openAttend(); });
  $('attNo').addEventListener('click', function () { $('attSheet').classList.add('hidden'); });
  $('clrYes').addEventListener('click', function () { Attend.clear(); $('clrSheet').classList.add('hidden'); toast('출석 기록만 지웠어요. 궁합 지도는 별도로 지울 수 있어요.'); goFortune(); });
  $('clrNo').addEventListener('click', function () { $('clrSheet').classList.add('hidden'); });

  // ---------- 11 출석 화면 ----------
  var REWARDS = [['<svg class="e-icon e-icon-leaf" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><path d="M15 48C8 24 27 12 51 13C54 37 36 55 15 48Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 48L42 22M27 37V25M27 37H40" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>', '오늘의 행운 아이템'], ['<svg class="e-icon e-icon-clock" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><path d="M54 32A22 22 0 1 1 10 32A22 22 0 1 1 54 32Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M32 18V33L43 39" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>', '시간대 풀이 펼치기'], ['<svg class="e-icon e-icon-focus" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><path d="M50 32A18 18 0 1 1 14 32A18 18 0 1 1 50 32Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M41 32A9 9 0 1 1 23 32A9 9 0 1 1 41 32ZM32 8V18M32 46V56M8 32H18M46 32H56" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>', '{T}의 숨은 강점'], ['<svg class="e-icon e-icon-card" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><path d="M10 12H54V52H10Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 42L28 31L35 39L43 27L50 42M23 22A3 3 0 1 1 17 22A3 3 0 1 1 23 22Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>', '공유 카드 특별 프레임'], ['<svg class="e-icon e-icon-talk" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><path d="M12 13H52V42H33L22 51V42H12Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 26H42M22 33H35" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>', '오늘의 대화 주제 3개'], ['<svg class="e-icon e-icon-fortune" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><path d="M54 32A22 22 0 1 1 10 32A22 22 0 1 1 54 32Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 22V42M29 18V46M36 18V46M43 22V42" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 27H25M26 24H32M33 24H39M40 27H46M19 37H25M26 40H32M33 40H39M40 37H46" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>', '모레 운세 미리 보기'], ['<svg class="e-icon e-icon-seal" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><path d="M32 8L38 14L47 15L49 24L55 32L49 40L47 49L38 50L32 56L26 50L17 49L15 40L9 32L15 24L17 15L26 14Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 32L29 38L41 25" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>', '완주 보상']];
  function openAttend() {
    var av = attView(); if (!av) { $('attSheet').classList.remove('hidden'); return; }
    var now = nowD(), TY = st.type, D = Fortune.day(st.saju, TY, now, 0), n = av.n, round = n >= 7 ? av.done : av.done + 1;
    var subs = [esc(D.item), '오전·오후·밤 한 줄씩 자세히', '타입 보너스 풀이', TY.season + ' 무리 색 테두리 + 출석 배지', '', '', '다음 7일 흐름 · 숨은 궁합 · 금색 프레임'];
    var head = !n ? '오늘 첫 출석 체크를 해 볼까요?' : n >= 7 ? '7일 완주했어요 ' : n + '일째 출석했어요 ';
    var sub = !n ? '오늘의 운세를 열면 출석 체크가 돼요.' : n >= 7 ? '완주 보상이 열렸어요. 내일부터 새 회차가 시작돼요.' : (7 - n) + '일만 더 오면 완주 보상이 열려요.' + (av.skipLeft ? ' 하루 쉬어도 괜찮아요.' : '');
    var stamps = ''; for (var d = 1; d <= 7; d++) { var cls = d < n || (d === n && !av.today) ? 'done' : d === n ? 'today' : 'todo'; stamps += '<div class="st ' + cls + (d === 7 ? ' seven' : '') + '"><div class="o">' + (cls === 'done' ? '<svg class="e-icon e-icon-check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><path d="M14 32L26 44L51 18" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>' : cls === 'today' ? '<svg class="e-icon e-icon-sparkle" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><path d="M32 8L37 25L54 32L37 39L32 56L27 39L10 32L27 25Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M47 10V18M43 14H51" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>' : d === 7 ? '<svg class="e-icon e-icon-seal" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><path d="M32 8L38 14L47 15L49 24L55 32L49 40L47 49L38 50L32 56L26 50L17 49L15 40L9 32L15 24L17 15L26 14Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 32L29 38L41 25" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '') + '</div><span>' + d + '일</span></div>'; }
    var rows = REWARDS.map(function (r, i) {
      var d = i + 1, open = d <= n, isNew = d === n && av.today, s = subs[i] || d + '일차에 열려요';
      if (!open && (d === 5 || d === 6)) s = d + '일차에 열려요';
      if (open && d === 5) s = '친구·연인에게 던질 질문'; if (open && d === 6) s = '내일 다음 날까지';
      return '<button class="rw' + (open ? '' : ' lock') + (isNew ? ' new' : '') + '" data-d="' + d + '"' + (open ? '' : ' disabled') + '><span class="d">' + d + '일</span><span class="i">' + r[0] + '</span><span class="tx"><b>' + esc(r[1].replace('{T}', TY.name)) + '</b><small>' + s + '</small></span><span class="r">' + (isNew ? '오늘 열림' : open ? '보기 ›' : '<svg class="e-icon e-icon-lock" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><path d="M16 29H48V53H16Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 29V20A10 10 0 0 1 42 20V29M32 39V45" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>') + '</span></button>';
    }).join('');
    $('fAttend').innerHTML = '<h2 class="f-title">7일 출석 체크</h2><p class="eyebrow f-eb">' + round + '회차 · ' + (now.getMonth() + 1) + '월 ' + now.getDate() + '일 ' + WD_FULL[now.getDay()] + '</p>' +
      '<div class="h2" style="font-size:21px">' + head + '</div><p class="cap">' + sub + '</p>' +
      '<div class="st-wrap">' + stamps + '</div>' +
      '<div class="chips" style="margin-top:10px"><span class="chip jade"><svg class="e-icon e-icon-rest" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><path d="M12 24H45V45H12ZM45 28H51Q58 34 51 39H45" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 52H48M22 17V10M33 17V10" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg> ' + (av.skipLeft ? '쉬어 가기 1번 남음' : '이번 회차 쉬어 가기를 썼어요') + '</span><span class="chip"><svg class="e-icon e-icon-seal" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><path d="M32 8L38 14L47 15L49 24L55 32L49 40L47 49L38 50L32 56L26 50L17 49L15 40L9 32L15 24L17 15L26 14Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 32L29 38L41 25" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg> ' + (av.done ? '완주 ' + av.done + '번' : '첫 완주까지 ' + (7 - n) + '일') + '</span></div>' +
      '<div class="card att-list">' + rows + '</div>' +
      '<div class="privacy att-priv"><span><svg class="e-icon e-icon-lock" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><path d="M16 29H48V53H16Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 29V20A10 10 0 0 1 42 20V29M32 39V45" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span><div><b>출석 키에는 출석 기록(운세를 본 날짜 ' + av.count + '개, 회차·완주 기록·쉬어 가기 여부)을 남겨요.</b> 출석 키에는 사진·생일·이름·성격유형·결과를 저장 안 해요. 궁합 지도 키 eolpal_map_v1에는 동의해 추가한 내 타입 번호·친구 타입 번호·선택 별명만 별도로 남아요. <button class="linkbtn inline" id="attClear">출석 기록 지우기</button></div></div>' +
      '<p class="foot">재미로 보는 콘텐츠예요 · 출석 보상은 앱 안에서만 보는 콘텐츠예요</p>';
    $('attClear').addEventListener('click', function () { $('clrSheet').classList.remove('hidden'); });
    $('fAttend').querySelectorAll('.rw').forEach(function (b) { b.addEventListener('click', function () { rewardGo(+b.dataset.d); }); });
    var cta = $('attCta');
    if (!av.today) { cta.textContent = ' 오늘의 운세 보고 출석 체크하기'; cta.onclick = function () { openDay(0); }; }
    else if (n >= 7) { cta.textContent = ' 완주 보상 열기'; cta.onclick = function () { rewardGo(7); }; }
    else { cta.innerHTML = REWARDS[n - 1][0] + ' 오늘 보상 · ' + REWARDS[n - 1][1].replace('{T}', TY.name) + ' 보기'; cta.onclick = function () { rewardGo(n); }; }
    go('s-attend');
  }
  function rewardGo(d) {
    if (d === 4) { saveCardWith('season'); return; }
    if (d === 6) { renderDay(2); go('s-fday'); return; }
    if (d === 7) { openReward(); return; }
    renderDay(0); go('s-fday');
    var el = $(d === 1 ? 'rw1' : 'rw' + d); if (el) setTimeout(function () { window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 120); el.classList.add('pulse'); }, 50);
  }
  async function saveCardWith(frame) {
    st.cardFrame = frame; var c = await Card.draw($('cardCanvas'), st); st.cardFrame = null;
    var url = c.toDataURL('image/png'), a = document.createElement('a'); a.href = url; a.download = NAME + '_결과카드_' + (frame === 'gold' ? '완주' : '출석') + '.png'; document.body.appendChild(a); a.click(); a.remove();
    go('s-result'); tab('sum'); var p = $('cardPreview'); p.src = url; p.classList.remove('hidden');
    toast(frame === 'gold' ? '금색 완주 프레임으로 결과 카드를 저장했어요' : '특별 프레임으로 결과 카드를 저장했어요');
  }

  // ---------- 12 완주 보상 ----------
  function openReward() {
    var av = attView(); if (!av || !(av.n >= 7 || av.gold)) { toast('7일차에 열려요'); return; }
    var S = st.saju, TY = st.type, now = nowD(), W = Fortune.week(S, TY, now, 1, 7), HM = Fortune.hiddenMatch(S, TY);
    var best = W.slice().sort(function (a, b) { return b.score - a.score || a.offset - b.offset; })[0], mn = 55;
    var e = W[6];
    $('fReward').innerHTML = '<h2 class="f-title">완주 보상</h2><div class="f-hero"><div class="f-sheep" style="filter:drop-shadow(0 0 16px rgba(214,181,121,.55))"><svg class="e-icon e-icon-seal" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><path d="M32 8L38 14L47 15L49 24L55 32L49 40L47 49L38 50L32 56L26 50L17 49L15 40L9 32L15 24L17 15L26 14Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 32L29 38L41 25" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="h1 center" style="font-size:25px">7일 완주했어요!</div><p class="cap">' + EIcons.emblem(TY.no) + ' ' + esc(TY.name) + ' · ' + (av.done <= 1 ? '첫 완주' : '완주 ' + av.done + '번째') + ' · ' + (now.getMonth() + 1) + '월 ' + now.getDate() + '일</p></div>' +
      '<div class="card"><div class="ttl" style="color:var(--gold)">① 다음 7일 운세 흐름 <span>' + W[0].m + '.' + W[0].d + ' ~ ' + e.m + '.' + e.d + '</span></div><div class="f-graph">' + W.map(function (x) { var b = x === best; return '<div class="b' + (b ? ' best' : '') + '"><em>' + x.score + '</em><i style="height:' + Math.round((x.score - mn) * 2.3) + 'px;' + (b ? 'background:' + TY.color : '') + '"></i><span>' + x.d + '</span><small>' + x.wd + '</small></div>'; }).join('') + '</div>' +
      '<p class="cap" style="margin-top:6px">가장 흐름이 좋은 날은 <b style="color:var(--gold-hi)">' + best.m + '월 ' + best.d + '일(' + best.wd + ') ' + best.score + '점 · ' + best.title + '</b>' + eyo(best.title) + '. 미뤄 둔 공부나 중요한 약속을 이날로 잡아 보세요.</p><p class="cap" style="margin-top:4px;color:var(--hanji-3)">재미로 보는 콘텐츠예요 · 미래를 예측하지 않아요</p></div>' +
      '<div class="card"><div class="ttl" style="color:var(--gold)">② 숨은 궁합 타입</div><div class="f-mt"><div class="em">' + EIcons.emblem(HM.no) + '</div><div><b>No.' + HM.no + ' ' + esc(HM.name) + '</b><p>' + esc(HM.desc) + '</p></div></div><p class="cap" style="margin-top:8px">' + esc(HM.why) + '</p></div>' +
      '<div class="card"><div class="f-frm"><div class="mini"><b>' + EIcons.emblem(TY.no) + '</b>No.' + TY.no + '<span>7일 완주</span></div><div><div class="ttl" style="color:var(--gold);margin-bottom:4px">③ 금색 완주 카드 프레임</div><p class="cap" style="color:var(--hanji-2)">다음 7일 동안 결과 카드에 금색 테두리와 ‘7일 완주’ 배지를 달 수 있어요.</p></div></div></div>' +
      '<p class="foot">재미로 보는 콘텐츠예요 · 새 회차는 내일 1일차부터 시작돼요</p>';
    go('s-reward');
  }
  $('rwClose').addEventListener('click', function () { openAttend(); });
  $('rwSave').addEventListener('click', function () { saveCardWith('gold'); });
window.EolpalPreview = { state: st, go: go, fortune: goFortune, attend: function () { if (Attend.enabled()) openAttend(); else $('attSheet').classList.remove('hidden'); }, showResult: showResult, toast: toast };
})();
