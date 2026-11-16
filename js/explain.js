/* v12f 결과 해설(담백판): 실제 계산·측정값만 보여 주고, 전통 상징 해석은 따로 나눠 적어요. */
(function (g) {
  'use strict';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function jong(w) { return g.Josa.jong(w); }
  function eun(w) { return w + (jong(w) ? '은' : '는'); }
  function iga(w) { return w + (jong(w) ? '이' : '가'); }
  function ro(w) { return w + g.Josa.ro(w); }
  function eyo(w) { return w + (jong(w) ? '이에요' : '예요'); }
  function f2(v) { return (Math.round(v * 100) / 100).toFixed(2); }
  function li(label, value, note) { return '<li><b>' + label + '</b> ' + value + (note ? '<small>' + note + '</small>' : '') + '</li>'; }

  // ---------- 관상: 앱이 실제로 쓰는 분류 기준 (face.js와 같은 경계값) ----------
  function shapeName(r) {
    if (r.hw >= 1.55) return ['긴 얼굴형', '세로/가로 1.55 이상'];
    if (r.jaw >= 0.88 && r.hw < 1.4) return ['각진 얼굴형', '턱/얼굴 너비 0.88 이상, 세로/가로 1.40 미만'];
    if (r.hw < 1.28) return ['둥근 얼굴형', '세로/가로 1.28 미만'];
    if (r.jaw < 0.78) return ['역삼각 얼굴형', '턱/얼굴 너비 0.78 미만'];
    return ['계란형 얼굴', '위 네 기준에 들지 않은 중간 범위'];
  }
  function band(v, lo, hi, names) { return v < lo ? names[0] : v > hi ? names[2] : names[1]; }
  function faceRows(face) {
    var r = face.ratio, sam = face.sam, sh = shapeName(r);
    var zone = [['이마', r.up], ['눈썹~코끝', r.mid], ['코끝~턱', r.low]], top = zone.slice().sort(function (a, b) { return b[1] - a[1]; })[0];
    return {
      shape: sh,
      groups: [
        ['얼굴형과 세로 비율', [
          li('얼굴형 분류', esc(sh[0]), '앱 기준: ' + sh[1]),
          li('얼굴 세로/가로', f2(r.hw), '이마 윗선~턱 길이 ÷ 양쪽 얼굴 끝 너비'),
          li('턱 너비/얼굴 너비', f2(r.jaw)),
          li('세 구간 비율', '이마 ' + sam[0] + ' : 눈썹~코끝 ' + sam[1] + ' : 코끝~턱 ' + sam[2], top[1] < 0.37 ? '가장 긴 구간도 37% 미만이라 앱은 ‘균형형’으로 분류해요' : '가장 긴 구간: ' + top[0] + ' (반올림한 백분율)'),
          li('이마 윗선', face.hairFound ? '사진의 색 변화로 찾았어요' : '찾지 못해 어림값을 썼어요', face.hairFound ? '사진의 색 변화로 찾은 선이에요' : '눈썹~코끝 길이를 이마 길이로 대신 넣었어요')
        ]],
        ['눈과 눈썹', [
          li('눈 세로/가로', f2(r.eye), band(r.eye, 0.27, 0.36, ['가로로 긴 편(0.27 미만)', '중간 범위(0.27~0.36)', '세로가 큰 편(0.36 초과)'])),
          li('눈 사이 거리/눈 가로', f2(r.inter), band(r.inter, 0.9, 1.15, ['좁은 편(0.90 미만)', '중간 범위(0.90~1.15)', '넓은 편(1.15 초과)'])),
          li('눈꼬리 기울기', f2(r.tilt), r.tilt > 0.07 ? '눈꼬리가 안쪽보다 올라간 편(0.07 초과)' : r.tilt < -0.04 ? '눈꼬리가 안쪽보다 내려간 편(-0.04 미만)' : '수평에 가까운 범위(-0.04~0.07)'),
          li('눈썹 길이/눈 가로', f2(r.brow), r.brow > 1.45 ? '긴 편(1.45 초과)' : '1.45 이하'),
          li('눈썹~눈 간격/눈 가로', f2(r.browGap), band(r.browGap, 0.6, 0.95, ['가까운 편(0.60 미만)', '중간 범위(0.60~0.95)', '넓은 편(0.95 초과)']))
        ]],
        ['코와 입', [
          li('코 너비/얼굴 너비', f2(r.nose), band(r.nose, 0.23, 0.29, ['좁은 편(0.23 미만)', '중간 범위(0.23~0.29)', '넓은 편(0.29 초과)'])),
          li('입 너비/코 너비', f2(r.mouth), band(r.mouth, 1.35, 1.75, ['좁은 편(1.35 미만)', '중간 범위(1.35~1.75)', '넓은 편(1.75 초과)'])),
          li('입술 세로/입 너비', f2(r.lips), r.lips > 0.33 ? '두께가 큰 편(0.33 초과)' : '0.33 이하'),
          li('입꼬리 높이/입 너비', f2(r.corner), r.corner > 0.02 ? '입꼬리가 입 가운데보다 위(0.02 초과)' : '입꼬리가 입 가운데와 비슷하거나 아래')
        ]]
      ]
    };
  }
  function faceMetrics(st) {
    var face = st.face;
    if (!face) return '<div class="card x-plain"><div class="ttl">관상 계측값</div><p class="p">사진을 넣지 않아 관상 계측값이 없어요. 그래서 얼굴형이나 부위 비율은 적지 않았어요.</p><p class="p sub">동물 번호의 인상 칸은 사진 대신 일간의 음양으로 정했어요.</p><button class="btn secondary sm" id="addPhoto" style="margin-top:10px">사진 넣고 다시 보기</button></div>';
    var F = faceRows(face), sam = face.sam;
    var h = '<div class="card x-plain"><div class="ttl">관상 · 사진에서 잰 값</div><p class="p">사진에서 얼굴 기준점 68개를 찾고, 두 눈이 수평이 되도록 돌린 뒤 기준점 사이 거리로 비율 14개를 계산했어요. 이름은 이 비율에 앱의 분류 기준을 적용한 결과예요.</p>' +
      '<div class="sam" style="margin-top:10px"><i style="width:' + sam[0] + '%"></i><i style="width:' + sam[1] + '%"></i><i style="width:' + sam[2] + '%"></i></div><p class="cap">이마 ' + sam[0] + '% · 눈썹~코끝 ' + sam[1] + '% · 코끝~턱 ' + sam[2] + '%' + (face.hairFound ? '' : ' · 이마 윗선이 잘 안 보여 어림값이에요') + '</p></div>';
    F.groups.forEach(function (gr) { h += '<div class="card x-plain"><div class="ttl">' + gr[0] + '</div><ul class="x-list">' + gr[1].join('') + '</ul></div>'; });
    h += '<div class="card x-plain"><div class="ttl">사진에서 비율을 읽는 방식</div><p class="p">앱은 사진의 조명과 표정, 고개 각도, 머리카락을 반영해 기준점을 찾고 비율을 계산해요. 두 눈을 수평으로 맞춘 뒤 그 값으로 얼굴형과 인상을 분류해요.</p>' +
      '<p class="p sub">동물 번호의 인상 칸(' + esc(st.type ? st.type.imp : '') + ')은 위 분류 이름을 앱 규칙으로 묶어 정한 값이에요.</p></div>' +
      '<p class="foot">사진은 이 기기 안에서만 분석했고, 저장하거나 전송하지 않았어요.</p>';
    return h;
  }

  // ---------- 사주 ----------
  var GROUP_BR = { '바람': '寅·卯·辰', '불': '巳·午·未', '땅': '申·酉·戌', '물': '亥·子·丑' };
  var GROUP_EL = { '불': '화', '땅': '토', '물': '수' };
  var TRAD = { '甲': '곧게 자라는 큰 나무', '乙': '부드럽게 뻗는 풀과 덩굴', '丙': '하늘의 태양', '丁': '촛불이나 등불', '戊': '큰 산', '己': '논밭의 흙', '庚': '단단한 쇠나 바위', '辛': '다듬은 보석', '壬': '큰 강과 바다', '癸': '비와 이슬' };
  function pl(p) { return p.gz + '(' + p.ko + ') · ' + p.stemEl + '·' + p.branchEl; }
  function counts(S) { return g.Saju.ELEMENTS.map(function (e) { return e + ' ' + S.count[e]; }).join(' · '); }
  function countsKo(S) { return g.Saju.ELEMENTS.map(function (e) { return e + ' ' + S.count[e] + '개'; }).join(', '); }
  function sajuMetrics(st) {
    var S = st.saju, P = S.pillars, dm = S.dayMaster, D = g.Texts.DM[dm.stem], TY = st.type, E = g.Saju.ELEMENTS;
    var max = Math.max.apply(null, E.map(function (e) { return S.count[e]; })), most = E.filter(function (e) { return S.count[e] === max; }), zero = E.filter(function (e) { return S.count[e] === 0; });
    var total = E.reduce(function (a, e) { return a + S.count[e]; }, 0), lt = S.localTime;
    var timeLine = S.timeKnown
      ? li('태어난 시간', '입력했어요', '일주·시주는 보정한 현지 시각 ' + g.Saju.pad(lt.hh) + ':' + g.Saju.pad(lt.mm) + ' 기준으로 계산했어요')
      : li('태어난 시간', '모름', '일주는 정오(12:00)를 계산 기준으로 쓰고 시주는 비워 뒀어요. 정오는 실제 출생 시각이 아니에요');
    var h = '<div class="card x-plain"><div class="ttl">계산값</div><p class="p">입력한 날짜와 시간으로 계산한 값이에요.</p><ul class="x-list">' +
      li('연주', pl(P.year)) + li('월주', pl(P.month)) + li('일주', pl(P.day)) +
      li('시주', P.hour ? pl(P.hour) : '비움', P.hour ? '' : '시간을 몰라 계산하지 않았어요') +
      li('일간', dm.stem + '(' + D.name + ')', (dm.yang ? '양' : '음') + ' · ' + dm.el + ' · 일주의 천간이에요') +
      li('오행 개수', counts(S), '천간·지지 ' + total + '글자를 하나씩 센 값 · 가장 많은 오행 ' + most.join('·') + '(' + max + '개)' + (zero.length ? ' · 0개 ' + zero.join('·') : '')) +
      timeLine + (S.notes.length ? li('계산 안내', S.notes.map(esc).join('<br>')) : '') + '</ul>' +
      '<p class="p sub">오행 개수는 각 기둥의 천간과 지지를 하나씩 센 값이에요. 지지 속 지장간이나 계절 가중치는 더하지 않았어요.</p></div>';
    var grp = TY ? TY.season : '';
    if (grp) {
      var el = GROUP_EL[grp];
      h += '<div class="card x-plain"><div class="ttl">' + grp + ' 무리는 분류 이름이에요</div><p class="p">' + grp + ' 무리는 월지가 ' + GROUP_BR[grp] + ' 구간일 때 붙는 캐릭터 분류 이름이에요. 이번 월지는 ' + P.month.branch + '(' + g.Saju.BRANCH_KO[P.month.branch] + ')' + (jong(g.Saju.BRANCH_KO[P.month.branch]) ? '이에요' : '예요') + '.</p><p class="p">네 무리(바람·불·땅·물)는 월지 구간 이름이고, 목·화·토·금·수 오행 개수는 따로 세요. ' +
        (el ? '이번 결과의 ' + el + ' 개수는 ' + S.count[el] + '개예요.' : '바람은 오행 이름이 아니라 월지 구간 이름이에요.') + '</p></div>';
    }
    h += '<div class="card x-plain"><div class="ttl">전통적 상징 해석</div><p class="p">전통적으로 일간 ' + dm.stem + '(' + D.name + ')' + (jong(D.name) ? '은' : '는') + ' ' + TRAD[dm.stem] + '에 빗대어 상징해요. 앱은 이 상징을 ‘' + D.nick + '’' + (jong(D.nick) ? '이라는' : '라는') + ' 표현으로 옮기고 #' + D.key[0] + ' #' + D.key[1] + ' 키워드를 붙여요.</p><p class="p sub">이 부분은 전통 상징을 앱의 규칙으로 옮긴 해석이에요.</p></div>';
    return h;
  }

  // ---------- 성격유형 ----------
  var AX = [
    ['E', 'I', '에너지 방향', '사람들과 말하거나 함께 움직이며 생각과 에너지를 정리하는 쪽의 선호예요.', '혼자 곱씹으며 생각과 에너지를 정리하는 쪽의 선호예요.'],
    ['S', 'N', '정보를 살피는 방향', '구체적인 정보와 경험, 순서를 먼저 살피는 쪽의 선호예요.', '전체 흐름과 핵심 아이디어, 가능성을 먼저 살피는 쪽의 선호예요.'],
    ['T', 'F', '판단할 때 먼저 보는 기준', '논리와 근거를 먼저 살피는 쪽의 선호예요.', '사람에게 미치는 영향과 마음을 먼저 살피는 쪽의 선호예요.'],
    ['J', 'P', '계획을 다루는 방식', '일정과 방향을 미리 정해 두는 쪽의 선호예요.', '상황에 맞춰 선택을 열어 두는 쪽의 선호예요.']
  ];
  function source(st) {
    if (st.mbtiFromFace) return '사진 특징으로 본 추정 · 얼굴 비율을 앱 규칙으로 묶은 네 글자예요.';
    if (st.mbtiFromTest) return '간단 질문 12개(축마다 3문항)로 고른 네 글자예요.';
    return '직접 입력 · 직접 고른 네 글자예요.';
  }
  // v12g: 첫 분석 초안의 네 문단을 현재 결과의 조각으로 조합해요.
  var OPEN = ['높이 살피고 방향을 잡는','새로운 이야기를 나누는','조용히 핵심을 살피는','익숙한 틀 밖을 탐색하는','함께 갈 방향을 챙기는','가볍게 마음을 전하는','작은 역할을 꾸준히 잇는','자기 호흡으로 균형을 잡는','결정한 방향으로 움직이는','자기 색을 드러내는','다른 길을 찾아보는','작은 가능성을 키우는','앞에서 흐름을 이끄는','곁에서 마음을 챙기는','주변의 변화를 살피는','편안한 방식으로 취향을 지키는','묵직하게 방향을 지키는','함께할 사람을 챙기는','보이지 않는 곳을 차근차근 살피는','자기 공간을 소중히 두는','큰 흐름을 든든하게 받치는','차분히 곁을 지키는','필요한 구조를 쌓아 가는','서두르지 않고 자기 속도를 지키는','목표를 향해 흐름을 가르는','서로의 반응을 주고받는','여러 방향을 함께 살피는','섬세한 간격을 지키는','넓은 흐름을 품는','작은 즐거움을 나누는','자기만의 순서를 지키는','변화 속에서 여백을 찾는'];
  // 강점의 상징 / 엇박자 / 행동 제안. 실제 성격을 확정하지 않아요.
  var PROFILE = {
    '甲':['방향을 세우고 시작하는 힘','정한 방향을 지키다가 다른 의견을 늦게 살필 수 있다는 점','목표를 말한 뒤 다른 방법도 하나씩 들어 보세요.'],
    '乙':['상황에 맞춰 길을 찾고 관계를 잇는 힘','상대에게 맞추다 내 기준을 뒤로 미룰 수 있다는 점','배려할 부분과 꼭 지킬 부분을 나눠 말해 보세요.'],
    '丙':['생각을 드러내고 시작에 온기를 보태는 힘','표현의 속도가 상대의 생각할 시간보다 빨라질 수 있다는 점','내 이야기를 전한 뒤 상대가 답할 여백을 남겨 보세요.'],
    '丁':['작은 차이를 살피며 한곳에 마음을 모으는 힘','세심하게 살피다 내 뜻을 늦게 전할 수 있다는 점','신경 쓰이는 부분을 짧고 구체적인 말로 꺼내 보세요.'],
    '戊':['맡은 자리를 지키고 흐름을 받치는 힘','익숙한 방식을 지키다가 변화를 늦게 받아들일 수 있다는 점','지킬 원칙과 바꿔 볼 방법을 따로 적어 보세요.'],
    '己':['필요한 일을 차근차근 돌보고 가꾸는 힘','다른 사람을 챙기다가 내 몫을 놓칠 수 있다는 점','도울 수 있는 범위를 먼저 정하고 내 시간도 남겨 보세요.'],
    '庚':['엉킨 문제를 나누고 다음 행동을 정하는 힘','결론부터 전하면 도와주려던 말이 단단하게 들릴 수 있다는 점','내 기준을 말하기 전 “나는 이렇게 생각했어”를 붙여 보세요.'],
    '辛':['작은 차이를 다듬고 완성도를 살피는 힘','세부를 고치다가 마무리 기준이 높아질 수 있다는 점','이번에 꼭 고칠 것과 다음에 다듬을 것을 나눠 보세요.'],
    '壬':['넓게 살피고 서로 다른 생각을 연결하는 힘','가능성을 넓히다가 지금 할 일이 흐려질 수 있다는 점','여러 선택 중 오늘 해 볼 한 가지를 골라 보세요.'],
    '癸':['작은 흐름을 관찰하고 생각을 깊이 잇는 힘','생각을 충분히 정리하려다 말을 늦게 꺼낼 수 있다는 점','아직 정리 중인 생각도 질문 한 줄로 먼저 나눠 보세요.']
  };
  var LETTER = {
    '목':['사람들과 성장의 방향을 나누는','혼자 성장의 바탕을 다지는','구체적인 단계로 목표를 키우는','새로운 가능성을 그리는','성장의 기준을 근거로 고르는','함께 자랄 사람을 살피는','목표와 일정을 세우는','상황에 맞게 방법을 바꾸는'],
    '화':['생각과 열정을 밖으로 나누는','혼자 관심의 불씨를 다듬는','관심을 구체적인 행동으로 옮기는','새로운 아이디어를 펼치는','생각에 논리적인 순서를 더하는','표현에 상대의 마음을 담는','관심을 이어 갈 계획을 세우는','순간의 반응을 살려 움직이는'],
    '토':['사람들과 안정적인 흐름을 만드는','조용히 자기 자리를 다지는','현실적인 조건을 살피는','오래 갈 전체 구조를 그리는','함께 쓸 기준을 정리하는','주변의 필요를 살피는','약속과 순서를 지키는','기본을 두고 방법을 조정하는'],
    '금':['함께 방향과 기준을 정리하는','혼자 기준과 완성도를 다듬는','세부와 확인할 정보를 챙기는','핵심과 큰 그림을 살피는','논리와 원칙을 기준으로 삼는','기준 안에 사람의 사정을 담는','마감과 기준을 정해 두는','필요한 순간 방향을 바꾸는'],
    '수':['사람과 정보를 넓게 연결하는','혼자 생각의 흐름을 깊게 잇는','현실에서 쓸 방법을 찾는','서로 다른 가능성을 연결하는','복잡한 흐름을 근거로 나누는','상대의 마음을 함께 살피는','생각이 갈 방향을 정해 두는','변화에 맞춰 선택을 열어 두는']
  };
  function data(st) { var D=g.Texts.DM[st.saju.dayMaster.stem], m=st.mbti; return {D:D,m:m,p:PROFILE[st.saju.dayMaster.stem],l:m.split('').map(function(c){return LETTER[st.saju.dayMaster.el]['EISNTFJP'.indexOf(c)];})}; }
  function para(s) { return '<p class="p">'+esc(s)+'</p>'; }
  function section(title,text) { return '<div class="card x-plain"><div class="ttl">'+esc(title)+'</div>'+para(text)+'</div>'; }
  function more(title,html) { return '<details class="x-values"><summary>'+title+'</summary>'+html+'</details>'; }
  function uniq(arr) {
    var s = {}, out = [];
    arr.forEach(function (x) { if (x && !s[x]) { s[x] = 1; out.push(x); } });
    return out;
  }
  function joinWa(arr) {
    if (!arr.length) return '';
    if (arr.length === 1) return arr[0];
    if (arr.length === 2) return waJoin(arr[0], arr[1]);
    return arr.slice(0, -1).join(', ') + ', ' + arr[arr.length - 1];
  }
  function waJoin(a, b) {
    return a + g.Josa.wa(a) + ' ' + b;
  }

  function flowBody(who, analysis, cores, lead) {
    cores = (cores || []).filter(Boolean);
    var persons = uniq(cores.map(function (r) { return r.person; }).filter(Boolean));
    var goods = uniq(cores.map(function (r) { return r.good; }).filter(Boolean)).slice(0, 3);
    var weaks = uniq(cores.map(function (r) { return r.weak; }).filter(Boolean)).slice(0, 3);
    var cares = uniq(cores.map(function (r) { return r.care; }).filter(Boolean)).slice(0, 3);
    var aheads = uniq(cores.map(function (r) { return r.ahead; }).filter(Boolean)).slice(0, 3);
    var body = para(analysis) + para(lead + eun(who) + ' ' + joinWa(persons) + ' 사람이에요.') + para('장점은 ' + eyo(joinWa(goods)) + '.');
    if (weaks.length) body += para('단점은 ' + eyo(joinWa(weaks)) + '.');
    if (cares.length) body += para('조심할 점은 ' + eyo(joinWa(cares)) + '.');
    if (aheads.length) body += para('앞으로는 ' + aheads.join(', ') + ' 게 좋아요.');
    return body;
  }
  // 관상 특징별 성격·장점·단점·조심할 점·앞으로의 조언. 운·재물·능력 단정은 넣지 않고, 같은 특징은 같은 문장으로 나와요.
  var FACE_READ = {
    '긴 얼굴형': { see:'이마에서 턱까지 길게 뻗은 얼굴형', person:'생각이 깊고 계획을 먼저 세우는', good:'한 분야를 오래 파고드는 집중력', weak:'계획을 다지느라 첫 행동이 느린 점', care:'생각만 길어져 기회가 지나가는 점', ahead:'계획은 큰 줄만 잡고 바로 작은 한 걸음을 시작하는' },
    '각진 얼굴형': { see:'턱선이 또렷한 각진 얼굴형', person:'의지와 실행력이 강한', good:'어려운 일도 끝까지 밀고 나가는 뚝심', weak:'한번 정한 방향을 잘 바꾸지 않는 점', care:'뜻을 굽히지 않으려다 주변과 부딪히는 점', ahead:'방향을 지키기 전에 다른 의견도 한 번 듣는' },
    '둥근 얼굴형': { see:'부드러운 둥근 얼굴형', person:'원만하고 사람을 편하게 하는', good:'처음 보는 사람과도 금방 가까워지는 친화력', weak:'거절이 어려워 자기 뜻을 뒤로 미루는 점', care:'부탁을 다 받다 제 일정이 밀리는 점', ahead:'상대 부탁을 듣기 전에 자기 뜻을 먼저 한 줄로 말하는' },
    '역삼각 얼굴형': { see:'이마와 광대가 넓고 턱이 갸름한 얼굴형', person:'감각과 아이디어가 앞서는', good:'새로운 발상을 빠르게 떠올리는 힘', weak:'아이디어를 열어 두느라 마무리가 미뤄지는 점', care:'새 구상에 마음이 가서 하던 일이 흩어지는 점', ahead:'열어 둔 아이디어 중 하나를 골라 끝까지 마무리하는' },
    '계란형 얼굴': { see:'균형 잡힌 계란형 얼굴', person:'조화와 센스가 있는', good:'어디서나 무난하게 어울리는 적응력', weak:'맞춰 가다 자기 색을 뚜렷이 남기지 못하는 점', care:'무난함에 머물다 자기 입장이 흐려지는 점', ahead:'맞추기 전에 내가 남기고 싶은 한 가지를 분명히 하는' },
    '길고 깊은 눈매': { see:'길고 깊은 눈매', person:'신중하고 관찰력이 좋은', good:'상황을 먼저 살피는 판단력', weak:'속내를 감추느라 오해가 쌓이는 점', care:'침묵이 길어져 상대가 마음을 짐작하게 되는 점', ahead:'정리되지 않은 생각도 짧은 한 줄로 먼저 전하는' },
    '또렷하고 맑은 눈': { see:'또렷하고 맑은 눈', person:'감수성과 표현력이 풍부한', good:'감정이 눈빛으로 잘 전해지는 힘', weak:'감정이 그대로 드러나 선을 지키기 어려운 점', care:'감정이 먼저 나와 나중에 수습이 필요해지는 점', ahead:'마음이 커질 때 한 박자 쉬고 나서 말하는' },
    '균형 잡힌 눈': { see:'가로세로 비율이 균형 잡힌 눈', person:'판단과 감정의 균형이 좋은', good:'이성과 감정을 함께 살피는 힘', weak:'', care:'', ahead:'' },
    '살짝 올라간 눈꼬리': { see:'살짝 올라간 눈꼬리', person:'결단력과 승부욕이 있는', good:'필요한 순간 결정을 밀어붙이는 힘', weak:'승부가 걸리면 여지를 잘 남기지 않는 점', care:'밀어붙이다 상대의 자리를 좁히는 점', ahead:'결정을 밀기 전에 상대가 고를 여지를 한 가지는 남기는' },
    '살짝 내려간 눈꼬리': { see:'살짝 내려간 눈꼬리', person:'부드럽고 다정한', good:'사람이 편하게 다가오는 온기', weak:'거절보다 맞추기를 먼저 고르는 점', care:'편한 사람으로 남으려다 자기 기준이 밀리는 점', ahead:'맞추기 전에 받아들일 것과 아닐 것을 먼저 정하는' },
    '여유로운 미간': { see:'여유로운 미간', person:'마음이 너그럽고 여유가 있는', good:'작은 일에 쉽게 흔들리지 않는 품', weak:'여유가 길어져 급한 일을 뒤로 미루는 점', care:'느긋함이 지나쳐 마감이 코앞에 몰리는 점', ahead:'급한 일은 먼저 짧게 잘라 두고 여유를 쓰는' },
    '집중형 미간': { see:'집중형 미간', person:'집중력이 강하고 섬세한', good:'한 가지에 깊게 파고드는 힘', weak:'세부에 몰리다 큰 흐름을 놓치는 점', care:'한곳에 깊이 들어가 주변을 놓치는 점', ahead:'세부만 보기 전에 전체 순서를 한 줄로 적어 두는' },
    '길게 뻗은 눈썹': { see:'길게 뻗은 눈썹', person:'인연을 넓게 두는', good:'사람들과 쉽게 연결되어 도움을 주고받는 힘', weak:'부탁을 거절하기 어려운 점', care:'인연을 넓히다 제 시간과 힘이 빠지는 점', ahead:'도울 범위를 먼저 정하고 그 안에서 연결하는' },
    '단정한 눈썹': { see:'단정한 눈썹', person:'자기 관리가 있고 독립적인', good:'제 일은 제 힘으로 해내는 힘', weak:'도움을 잘 청하지 않아 혼자 짐을 지는 점', care:'혼자 해내려다 일이 무거워지는 점', ahead:'혼자서 할 일과 도움을 청할 일을 나눠 두는' },
    '넓은 전택궁': { see:'눈썹과 눈 사이가 넓은 상', person:'마음이 넉넉하고 여유로운', good:'주변 사람을 너그럽게 품는 힘', weak:'느긋함이 길어져 행동이 늦어지는 점', care:'여유를 두다 타이밍이 늦어지는 점', ahead:'느긋함을 지키되 시작할 시점은 먼저 잡아 두는' },
    '좁은 전택궁': { see:'눈썹과 눈 사이가 가까운 상', person:'반응이 빠르고 열정적인', good:'바로 움직이며 분위기를 여는 힘', weak:'생각보다 먼저 움직이는 점', care:'속도가 앞서 설명이 뒤따르는 점', ahead:'움직이기 전에 한 박자만 멈추고 순서를 확인하는' },
    '든든한 콧방울': { see:'든든한 콧방울', person:'실속을 챙기고 지키려는 마음이 강한', good:'가진 것을 지키고 차곡차곡 모으는 힘', weak:'익숙한 것을 지키려다 새로운 시도를 미루는 점', care:'안전한 쪽만 고르다 기회가 지나가는 점', ahead:'지킬 것과 시험해 볼 것을 나눠 두는' },
    '날렵한 코': { see:'날렵한 코', person:'자존심과 미적 감각이 뚜렷한', good:'기준이 분명하고 감각이 빠른 힘', weak:'기준이 높아 주변과 부딪히는 순간이 잦은 점', care:'내 기준만 앞세워 상대가 거리를 두는 점', ahead:'기준을 말하기 전에 상대의 기준도 한 줄로 듣는' },
    '균형 잡힌 코': { see:'얼굴과 조화로운 코', person:'자기 중심이 잘 잡힌', good:'한쪽으로 치우치지 않는 균형', weak:'', care:'', ahead:'' },
    '시원한 입매': { see:'시원한 입매', person:'포부가 크고 말에 힘이 있는', good:'한마디로 사람을 모으고 방향을 밝히는 힘', weak:'말이 앞서 실행이 뒤따르는 점', care:'큰 말을 먼저 해 두고 실행이 따라가지 못하는 점', ahead:'말한 내용 중 오늘 실행할 한 가지를 바로 시작하는' },
    '단정한 입매': { see:'단정한 입매', person:'신중하고 말을 아끼는', good:'한마디의 무게를 지키는 힘', weak:'말을 아끼다 속마음을 늦게 전하는 점', care:'말을 아끼다 오해가 남는 점', ahead:'중요한 마음은 짧은 말로라도 제때 전하는' },
    '균형 잡힌 입': { see:'얼굴과 조화로운 입', person:'말과 행동이 잘 맞는', good:'한 말은 행동으로 옮기는 힘', weak:'', care:'', ahead:'' },
    '도톰한 입술': { see:'도톰한 입술', person:'정이 많고 사람을 아끼는', good:'가까운 사람을 세심하게 챙기는 힘', weak:'정을 주다 제 마음을 뒤로 미루는 점', care:'상대를 챙기다 제 휴식과 경계가 무너지는 점', ahead:'남을 챙기기 전에 내가 지킬 시간과 마음을 먼저 남겨 두는' },
    '올라간 입꼬리': { see:'올라간 입꼬리', person:'밝은 기운을 주변에 전하는', good:'분위기를 환하게 여는 힘', weak:'밝은 얼굴을 유지하느라 힘든 속을 잘 보이지 않는 점', care:'밝은 모습만 보여 주다 속마음을 혼자 감수하는 점', ahead:'가까운 사람에게는 힘든 점도 짧게 말하는' }
  };
  function samRead(item) {
    var t = item.title || '';
    if (t.indexOf('삼정 균형형') === 0) return { see:'이마와 코, 턱의 길이가 고르게 나뉜 상', person:'한쪽으로 치우치지 않고 균형을 잡는', good:'생각과 실행, 마무리를 고르게 가져가는 힘', weak:'어느 한쪽으로 확실히 밀지 못해 결정이 늦어지는 점', care:'균형을 지키려다 선택이 늦어지는 점', ahead:'균형은 유지하되 오늘은 한쪽으로 먼저 결정하는' };
    if (t.indexOf('상정') === 0) return { see:'이마가 발달한 상', person:'생각과 계획이 앞서는', good:'일을 시작하기 전에 방향을 분명히 잡는 힘', weak:'생각이 길어져 실행이 뒤로 밀리는 점', care:'계획을 다듬다 시작 시점을 놓치는 점', ahead:'방향을 잡은 뒤 바로 작은 실행을 붙이는' };
    if (t.indexOf('중정') === 0) return { see:'눈썹부터 코끝까지가 발달한 상', person:'사회 활동과 추진이 강한', good:'사람들 사이에서 일을 밀고 나가는 힘', weak:'바깥일에 힘이 쏠려 속을 돌볼 틈이 줄어드는 점', care:'바깥 일정이 가득 차 쉬고 정리할 시간이 사라지는 점', ahead:'바깥일을 받기 전에 혼자 정리할 시간을 먼저 잡아 두는' };
    if (t.indexOf('하정') === 0) return { see:'코끝부터 턱까지가 발달한 상', person:'끈기와 실속이 있는', good:'시작한 일을 끝까지 지키는 힘', weak:'실속을 챙기느라 새로운 시도를 미루는 점', care:'익숙한 방식만 고집하다 변화가 늦어지는 점', ahead:'지킬 실속과 이번에 시도할 한 가지를 나눠 두는' };
    return null;
  }
  function faceReadOf(item) {
    if (item.part === '삼정') return samRead(item);
    return FACE_READ[item.title] || null;
  }

  var SAJU_STEM = {
    '甲': { see:'목표가 분명한 갑목 일간', person:'방향을 세우고 앞장서는', good:'새 판을 열고 사람을 이끄는 힘', weak:'한번 정한 방향을 잘 바꾸지 않는 점', care:'뜻을 지키려다 다른 의견을 늦게 살피는 점', ahead:'목표를 말한 뒤 다른 방법도 한 가지 듣는' },
    '乙': { see:'유연하게 길을 찾는 을목 일간', person:'흐름에 맞춰 관계를 잇는', good:'상황에 맞춰 길을 찾아내는 적응력', weak:'상대에게 맞추다 내 기준을 뒤로 미루는 점', care:'배려가 길어져 자기 몫이 밀리는 점', ahead:'배려할 부분과 꼭 지킬 부분을 나눠 두는' },
    '丙': { see:'밝게 드러나는 병화 일간', person:'생각을 솔직하게 열고 온기를 전하는', good:'시작에 활기를 보태는 힘', weak:'표현이 빨라 상대의 호흡을 놓치는 점', care:'열정이 앞서 혼자 먼저 지치는 점', ahead:'내 이야기를 전한 뒤 상대가 답할 여백을 남기는' },
    '丁': { see:'한곳에 마음을 모으는 정화 일간', person:'섬세하고 한 사람을 깊게 챙기는', good:'작은 차이를 살피며 깊게 파고드는 힘', weak:'세심하게 살피다 내 뜻을 늦게 전하는 점', care:'마음에 담아 두다 말이 늦어지는 점', ahead:'신경 쓰이는 부분을 짧고 구체적인 말로 꺼내는' },
    '戊': { see:'자리를 지키는 무토 일간', person:'묵직하고 흐름을 받치는', good:'맡은 자리를 끝까지 지키는 힘', weak:'익숙한 방식을 지키다 변화를 늦게 받아들이는 점', care:'안정을 지키려다 새 선택이 미뤄지는 점', ahead:'지킬 원칙과 바꿔 볼 방법을 따로 적어 두는' },
    '己': { see:'차근차근 가꾸는 기토 일간', person:'사람과 일을 실속으로 돌보는', good:'필요한 일을 차근차근 키워 가는 힘', weak:'다른 사람을 챙기다가 내 몫을 놓치는 점', care:'돌봄이 길어져 제 시간이 비는 점', ahead:'도울 범위를 먼저 정하고 내 시간도 남겨 두는' },
    '庚': { see:'결단이 분명한 경금 일간', person:'옳고 그름을 가리고 과감하게 정리하는', good:'엉킨 일을 나누고 다음 행동을 정하는 힘', weak:'결론부터 전해 말이 단단하게 들리는 점', care:'직진하는 말에 상대가 거리를 두는 점', ahead:'기준을 말하기 전에 내 생각을 한 줄로 먼저 여는' },
    '辛': { see:'기준이 높은 신금 일간', person:'세부를 다듬고 완성도를 지키는', good:'작은 차이까지 살피며 완성하는 힘', weak:'세부를 고치다 마무리 기준이 높아지는 점', care:'자신에게 엄격해져 끝이 잘 안 나는 점', ahead:'이번에 꼭 고칠 것과 다음에 다듬을 것을 나눠 두는' },
    '壬': { see:'넓게 흐르는 임수 일간', person:'서로 다른 생각을 연결하고 폭을 여는', good:'사람과 정보를 모아 흐름을 만드는 힘', weak:'가능성을 넓히다 지금 할 일이 흐려지는 점', care:'관심사가 넓어져 한곳에 힘이 모이지 않는 점', ahead:'여러 선택 중 오늘 할 한 가지를 골라 두는' },
    '癸': { see:'깊게 스며드는 계수 일간', person:'조용히 관찰하고 생각을 깊게 잇는', good:'남이 놓치는 결을 알아채는 힘', weak:'생각을 정리하다 말을 늦게 꺼내는 점', care:'머릿속 정리가 길어져 타이밍이 늦어지는 점', ahead:'아직 정리 중인 생각도 질문 한 줄로 먼저 나누는' }
  };
  var SAJU_SEASON = {
    '봄': { see:'새 일을 열어 가는 봄 월지', person:'새로운 것을 키워 가는', good:'시작을 열고 범위를 넓히는 힘', weak:'새 항목을 더하다 하던 일이 흩어지는 점', care:'넓히다 마무리가 늦어지는 점', ahead:'새로 시작할 것과 계속 유지할 것을 구분해 두는' },
    '여름': { see:'밖으로 드러내는 여름 월지', person:'열기를 밖으로 전하는', good:'핵심을 드러내고 분위기를 여는 힘', weak:'드러내는 속도가 정리보다 빨라지는 점', care:'밖으로 쓰기 전에 확인할 것을 건너뛰는 점', ahead:'드러낼 핵심과 그 전에 확인할 내용을 따로 정리하는' },
    '가을': { see:'가려서 남기는 가을 월지', person:'필요한 것을 가리고 정리하는', good:'남길 것과 덜어낼 것을 나누는 힘', weak:'기준이 높아 선택을 오래 고르는 점', care:'정리에 매달리다 움직임이 느려지는 점', ahead:'남길 항목과 덜어낼 항목의 기준을 먼저 적어 두는' },
    '겨울': { see:'모으고 살피는 겨울 월지', person:'자료를 모으고 깊이 살피는', good:'충분히 살펴 방향을 가다듬는 힘', weak:'모으는 시간이 길어져 결론이 늦어지는 점', care:'더 살피려다 결정을 미루는 점', ahead:'결론을 정할 것과 자료를 더 모을 것을 나누어 두는' }
  };
  var SAJU_GROUP = {
    '비겁': { see:'자기 기준과 나란히 서는 기운', person:'자기 기준이 뚜렷한', good:'스스로 서서 방향을 지키는 힘', weak:'내 기준만 앞세워 다른 기준을 늦게 보는 점', care:'비슷한 사람과만 움직이려다 폭이 좁아지는 점', ahead:'내가 고를 기준과 다른 사람이 정한 기준을 따로 적어 두는' },
    '식상': { see:'표현하고 결과를 내놓는 기운', person:'생각한 것을 밖으로 내놓는', good:'말과 결과로 핵심을 남기는 힘', weak:'표현이 많아져 핵심이 흩어지는 점', care:'내놓는 양만 늘다 마무리가 약해지는 점', ahead:'전달할 핵심을 한 문장으로 적고 결과에 남겼는지 확인하는' },
    '재성': { see:'실행 범위와 실속을 다루는 기운', person:'쓸 것과 할 범위를 정하는', good:'시간과 도구를 정해 실행하는 힘', weak:'범위를 넓히다 실속이 흐려지는 점', care:'손에 잡히는 것만 쫓다 큰 순서를 놓치는 점', ahead:'쓸 시간과 도구를 먼저 정한 뒤 마친 범위를 기록하는' },
    '관성': { see:'역할과 책임을 살피는 기운', person:'약속과 기준을 지키는', good:'맡은 조건을 끝까지 지키는 힘', weak:'책임감이 커져 어깨가 무거워지는 점', care:'지켜야 할 것이 많아져 숨 쉴 틈이 줄어드는 점', ahead:'꼭 지킬 조건과 조정할 수 있는 조건을 나누어 적어 두는' },
    '인성': { see:'받아들이고 이해하는 기운', person:'배우고 뜻을 헤아리는', good:'핵심을 자기 말로 소화하는 힘', weak:'이해하려다 실행이 뒤로 밀리는 점', care:'자료를 모으다 결론을 미루는 점', ahead:'핵심을 자기 말로 요약하고 더 확인할 내용을 나누는' }
  };
  var SAJU_PAIR = {
    '육합': { see:'월지와 일지가 서로 묶이는 상', person:'서로 다른 것을 한쪽으로 모으는', good:'함께 쓸 기준을 만드는 힘', weak:'묶여 있다 각자 기준이 흐려지는 점', care:'맞추느라 필요한 구분이 약해지는 점', ahead:'함께 적용할 기준을 한 문장으로 쓰고 각 항목과 맞는지 확인하는' },
    '육충': { see:'월지와 일지가 서로 다른 방향을 보는 상', person:'긴장을 동력으로 삼는', good:'다른 방향을 비교해 기준을 벼리는 힘', weak:'방향이 갈려 선택이 늦어지는 점', care:'긴장만 남고 결정이 미뤄지는 점', ahead:'이미 정한 기준과 다시 확인할 기준을 나누어 두는' }
  };
  var AXIS_READ = {
    E: { see:'말을 나누며 에너지를 여는 방향', person:'사람들과 함께 생각을 키우는', good:'대화를 통해 빠르게 움직이는 힘', weak:'말을 나누다 혼자 정리할 시간이 줄어드는 점', care:'바깥 대화가 가득 차 속이 비는 점', ahead:'질문을 한 문장으로 말한 뒤 상대가 답할 여백도 남기는' },
    I: { see:'혼자 정리한 뒤 나누는 방향', person:'안에서 생각을 다듬는', good:'깊이 정리해 요점을 남기는 힘', weak:'정리가 길어져 전달이 늦어지는 점', care:'혼자 생각하다 상대가 마음을 짐작하게 되는 점', ahead:'생각을 짧게 적은 뒤 전달할 요점만 골라 전하는' },
    S: { see:'구체적인 정보와 순서를 보는 방향', person:'눈에 보이는 사실부터 챙기는', good:'확인된 것을 단계로 쌓는 힘', weak:'세부만 보다 큰 흐름을 놓치는 점', care:'사실에만 머물다 새로운 가능성을 늦게 보는 점', ahead:'확인된 사실과 다음 순서를 번호로 적어 두는' },
    N: { see:'전체의 연결과 가능성을 보는 방향', person:'큰 그림과 새로운 길을 먼저 그리는', good:'핵심 질문을 먼저 잡는 힘', weak:'가능성을 열어 두다 실행이 흩어지는 점', care:'그림만 넓어져 오늘의 한 걸음이 약해지는 점', ahead:'핵심 질문을 먼저 쓰고 관련 내용을 그 아래 연결하는' },
    T: { see:'근거와 일관성을 보는 방향', person:'논리와 기준으로 판단하는', good:'판단 기준과 근거를 짝짓는 힘', weak:'근거만 앞세워 마음이 뒤로 밀리는 점', care:'맞는 말만 전해 상대가 단단하게 느끼는 점', ahead:'판단 기준을 말하기 전에 상대의 입장도 한 줄로 듣는' },
    F: { see:'가치와 사람의 입장을 보는 방향', person:'마음에 미치는 영향을 먼저 살피는', good:'상대의 기준과 내 가치를 함께 보는 힘', weak:'사람을 챙기다 필요한 결정을 미루는 점', care:'분위기를 지키려다 할 말을 남기지 못하는 점', ahead:'중요하게 여기는 가치와 함께 확인할 상대의 기준을 구분해 두는' },
    J: { see:'미리 정한 순서를 따르는 방향', person:'일정과 마감을 먼저 잡아 두는', good:'완료 기준을 정해 밀어 가는 힘', weak:'정한 틀을 지키다 조정이 늦어지는 점', care:'계획이 꽉 차 여유가 사라지는 점', ahead:'완료 기준과 중간 확인 시점을 미리 적어 두는' },
    P: { see:'선택을 열어 두고 상황에 맞추는 방향', person:'흐름에 맞춰 길을 고르는', good:'상황에 맞게 방법을 바꾸는 힘', weak:'선택을 열어 두다 마감이 밀리는 점', care:'열어 둔 채로 결정이 계속 미뤄지는 점', ahead:'남겨 둘 선택과 결정을 멈출 마감 기준을 함께 적어 두는' }
  };
  function sajuCores(st) {
    var e = evidence(st), cores = [SAJU_STEM[st.saju.dayMaster.stem], SAJU_SEASON[e.B.season]];
    e.G.many.forEach(function (k) { cores.push(SAJU_GROUP[k]); });
    if (SAJU_PAIR[e.B.monthDay]) cores.push(SAJU_PAIR[e.B.monthDay]);
    return cores.filter(Boolean).slice(0, 4);
  }
  function mbtiCores(st) {
    return String(st.mbti || '').split('').map(function (k) { return AXIS_READ[k]; }).filter(Boolean);
  }
  function faceSummary(face) { return face?['얼굴형과 부위로 관상을 읽어요','성격과 장점·단점, 조심할 점과 앞으로의 조언을 함께 살펴봐요']:['사진 없이 본 결과예요','인상 칸은 사진 대신 일간의 음양으로 정했어요']; }
  function sajuSummary(st) { return ['명식의 일간과 월지로 사주를 읽어요','성격과 장점·단점, 조심할 점과 앞으로의 조언을 함께 살펴봐요']; }
  function mbtiSummary(st) { return ['네 글자의 성격 방향으로 읽어요','성격과 장점·단점, 조심할 점과 앞으로의 조언을 함께 살펴봐요']; }
  function facePane(st) {
    if(!st.face) return section('사진 없이 본 결과예요','사진을 넣지 않아 얼굴형이나 눈·코·입의 특징은 풀이하지 않았어요. 이번 동물의 인상 칸은 일간의 음양으로 정했어요.')+'<button class="btn secondary sm" id="addPhoto">사진 넣고 다시 보기</button>';
    var who=address(st), reads=st.face.items.map(faceReadOf).filter(Boolean);
    var analysis='사진에서 잰 비율로 보면 '+eun(who)+' '+eyo(reads[0].see)+'.';
    if(reads.length>1) analysis+=' 이어서 '+iga(joinWa(reads.slice(1).map(function(r){return r.see;})))+' 함께 보여요.';
    var core=[reads[0]];
    reads.slice(1).forEach(function(r){ if(r.weak) core.push(r); });
    core=core.slice(0,4);
    return '<div class="card x-plain">'+flowBody(who,analysis,core,'이 관상으로 보면 ')+'</div>'+more('사진 비율과 분류 기준 확인',faceMetrics(st));
  }
  // v12i: 문장 선택의 근거는 천간/지장간 본기 표와 관찰 빈도뿐.
  // 강약·용신·대운으로 확대하지 않는다. 십신 무리는 일간 자신을 제외해 센다.
  var GROUP_WORD={비겁:'자기 기준과 함께하는 관계',식상:'표현하고 밖으로 내놓는 과정',재성:'대상과 자원을 다루는 방식',관성:'규칙과 책임을 살피는 방향',인성:'받아들이고 이해하는 과정'};
  function extremes(obj,keys) {
    var max=Math.max.apply(null,keys.map(function(k){return obj[k];}));
    return {many:keys.filter(function(k){return obj[k]===max;}),zero:keys.filter(function(k){return obj[k]===0;}),max:max};
  }
  function evidence(st) {
    var S=st.saju,B=g.Saju.basis(S.pillars),gKeys=['비겁','식상','재성','관성','인성'],G=extremes(B.groups,gKeys),E=extremes(B.expanded,g.Saju.ELEMENTS),R=extremes(S.count,g.Saju.ELEMENTS);
    var month='월지는 '+B.monthBranch+'('+g.Saju.BRANCH_KO[B.monthBranch]+')이고 '+B.season+' 구간이에요. 본기는 '+B.monthMain+'('+g.Saju.STEM_KO[B.monthMain]+B.monthMainEl+')이며 '+(B.sameMonthElement?'일간과 같은 오행':B.monthCommand)+g.Josa.eyo(B.sameMonthElement?'일간과 같은 오행':B.monthCommand)+'.';
    var gods='다른 천간과 지지 본기를 세면 '+G.many.map(function(k){return iga(k)+' '+B.groups[k]+'개';}).join('·')+'로 가장 많아요. 전통적 해석에서는 '+G.many.map(function(k){return GROUP_WORD[k];}).join('·')+'에 초점을 둬요.';
    var missing=G.zero.length?'이 집계에는 '+G.zero.join('·')+' 항목이 없어요.':'다섯 십신 무리가 이 집계에 모두 있어요.';
    var els='천간과 지장간을 각각 한 번씩 세면 '+iga(E.many.join('·')+'('+E.max+'개)')+' 가장 많고, '+(E.zero.length?eun(E.zero.join('·'))+' 0개예요.':'빈 오행은 없어요.');
    var dg=g.Saju.tenGod(S.dayMaster.stem,g.Saju.HIDDEN[B.dayBranch][0]);
    var day='일지는 '+B.dayBranch+'('+g.Saju.BRANCH_KO[B.dayBranch]+')이고 본기 '+g.Saju.HIDDEN[B.dayBranch][0]+'의 십신은 '+eyo(dg)+'. 전통적으로 '+GROUP_WORD[g.Saju.GOD_GROUP[dg]]+'에 초점을 둬요.';
    var pair=B.monthDay==='육합'?'월지와 일지는 육합 표에 해당해요. 함께 묶이는 상징으로 읽어요.':B.monthDay==='육충'?'월지와 일지는 육충 표에 해당해요. 서로 다른 방향의 긴장으로 읽어요.':'월지와 일지는 이번 육합·육충 표에 해당하지 않아요.';
    return {B:B,G:G,E:E,R:R,month:month,gods:gods,missing:missing,els:els,day:day,pair:pair};
  }
  function basisMetrics(st) {
    var e=evidence(st),B=e.B,labels={year:'연주',month:'월주',day:'일주',hour:'시주'};
    var rows=B.rows.map(function(r){return li(labels[r.key],r.stem+' · '+r.stemGod+' / '+r.branch+' 본기 · '+r.mainGod,'지장간 '+r.hidden.map(function(t,i){return t+'('+g.Saju.STEM_KO[t]+g.Saju.STEM_EL[t]+') '+r.hiddenGods[i];}).join(' · '));});
    return section('두 가지 오행 집계','겉글자: '+g.Saju.ELEMENTS.map(function(k){return k+' '+st.saju.count[k];}).join(' · ')+'. 천간+지장간: '+g.Saju.ELEMENTS.map(function(k){return k+' '+B.expanded[k];}).join(' · ')+'. 지장간을 셀 때 지지의 대표 오행은 다시 더하지 않아요. 모든 숨은 천간에 같은 1을 주며 계절 가중치는 넣지 않았어요. 지장간 수가 많은 지지는 더 많이 집계되므로 두 표는 서로 다른 관찰값이에요.')+
      '<div class="card x-plain"><div class="ttl">천간·지장간의 십신</div><ul class="x-list">'+rows.join('')+'</ul><p class="p sub">빈도는 다른 천간과 각 지지 본기만 세었어요. 일간 자신과 지장간의 나머지 천간은 빈도에 넣지 않았어요.</p></div>'+
      section('십신 무리 집계',Object.keys(B.groups).map(function(k){return k+' '+B.groups[k];}).join(' · ')+'.')+
      section('월령 참고 범위','월지 본기와 일간의 오행이 '+(B.sameMonthElement?'같아요. 본기 동일오행 기준으로 월령을 얻은 쪽에 해당해요.':'달라요. 본기 동일오행 기준으로는 월령을 얻었다고 표시하지 않았어요.'));
  }
  function sajuPane(st) {
    var e=evidence(st), who=address(st), D=g.Texts.DM[st.saju.dayMaster.stem], monthKo=g.Saju.BRANCH_KO[e.B.monthBranch], dayKo=g.Saju.BRANCH_KO[e.B.dayBranch];
    var cores=sajuCores(st);
    var analysis='명식을 보면 '+eun(who)+' 월지 '+monthKo+'('+e.B.season+')에 일간 '+iga(D.name)+' 놓인 사주예요.';
    var follows=cores.slice(1).map(function(r){return r.see;});
    follows.push('일지 '+dayKo);
    analysis+=' 이어서 '+iga(joinWa(uniq(follows)))+' 함께 보여요.';
    return '<div class="card x-plain">'+flowBody(who,analysis,cores,'이 사주로 보면 ')+'</div>'+more('네 기둥·오행·십신 근거 확인',sajuMetrics(st)+basisMetrics(st));
  }
  function mbtiPane(st) {
    var who=address(st), cores=mbtiCores(st), typeName=g.Texts.MBTI[st.mbti][0];
    var lead=st.mbtiFromFace?'사진 특징으로 본 네 글자로 보면 ':st.mbtiFromTest?'문항으로 고른 네 글자로 보면 ':'직접 고른 네 글자로 보면 ';
    var analysis=lead+eun(who)+' ‘'+typeName+'’이에요. 네 글자는 '+st.mbti+'예요.';
    if(cores.length) analysis+=' 이어서 '+iga(joinWa(cores.map(function(r){return r.see;})))+' 함께 보여요.';
    return '<div class="card x-plain">'+flowBody(who,analysis,cores,'이 성격 방향으로 보면 ')+'</div>'+more('네 축별 뜻 확인',AX.map(function(a,k){return section(a[0]+'/'+a[1]+' · '+a[2],a[st.mbti[k]===a[0]?3:4]);}).join(''));
  }
  // v12k: 입력 별명은 표시용으로만 사용. 모든 동적 문장은 para/esc를 거친다.
  function address(st) { var n=String(st.name==null?'':st.name).trim().replace(/\s+/g,' '); return n?n+'님':'당신'; }
  function youAre(st) { return eun(address(st)) + ' ' + String(st.type && st.type.desc ? st.type.desc : ''); }
  var PRACTICE_GROUP={
    비겁:['자기 기준과 나란히 서는 관계','내가 고를 기준과 다른 사람이 정한 기준을 따로 적어 보세요'],
    식상:['표현하고 결과를 내놓는 과정','전달할 핵심을 한 문장으로 적고 결과에 그 핵심이 남았는지 확인해 보세요'],
    재성:['자원을 다루고 실행 범위를 정하는 과정','쓸 시간과 도구를 먼저 정한 뒤 실제로 마친 범위를 기록해 보세요'],
    관성:['역할과 지켜야 할 기준','꼭 지킬 조건과 조정할 수 있는 조건을 나누어 적어 보세요'],
    인성:['받아들이고 이해하는 과정','핵심을 자기 말로 요약하고 이해한 내용과 더 확인할 내용을 나누어 보세요']
  };
  var PRACTICE_SEASON={봄:['넓혀 가는 과정','새로 시작할 항목과 계속 유지할 항목을 구분해 보세요'],여름:['밖으로 드러내는 과정','드러낼 핵심과 그 전에 확인할 내용을 따로 정리해 보세요'],가을:['가려서 남기는 과정','남길 항목과 덜어낼 항목의 기준을 먼저 적어 보세요'],겨울:['모으고 살피는 과정','결론을 정할 항목과 자료를 더 모을 항목을 나누어 보세요']};
  var PRACTICE_ELEMENT={목:['확장','추가할 것과 지금 유지할 것을 하나씩 정해 보세요'],화:['표현','공유할 핵심을 먼저 요약하고 빠진 설명을 확인해 보세요'],토:['받치고 연결함','유지할 기준을 적고 다른 항목이 그 기준과 어떻게 이어지는지 확인해 보세요'],금:['구분과 정리','포함할 것과 제외할 것의 기준을 한 줄씩 적어 보세요'],수:['모으고 연결함','모은 내용을 질문별로 묶고 아직 답이 없는 질문을 표시해 보세요']};
  var PRACTICE_ZERO={비겁:'스스로 고를 기준 하나를 적어 보는 연습',식상:'이해한 내용을 한 문장으로 내놓는 연습',재성:'실행에 필요한 시간과 도구를 적어 보는 연습',관성:'완료 조건과 지킬 약속을 먼저 정하는 연습',인성:'확인한 자료와 아직 모르는 점을 구분하는 연습'};
  var PRACTICE_AXIS={
    E:['말을 나누며 정리하는 선호','질문을 한 문장으로 말한 뒤 답을 기록해 보세요'],I:['혼자 정리한 뒤 나누는 선호','생각을 짧게 적은 뒤 전달할 요점만 골라 보세요'],
    S:['구체적인 정보와 순서를 보는 선호','확인된 사실과 다음 순서를 번호로 적어 보세요'],N:['전체의 연결과 가능성을 보는 선호','핵심 질문을 먼저 쓰고 관련 내용을 그 아래 연결해 보세요'],
    T:['근거와 일관성을 보는 선호','판단 기준과 그 기준을 뒷받침하는 근거를 짝지어 보세요'],F:['가치와 사람의 입장을 보는 선호','중요하게 여기는 가치와 함께 확인할 상대의 기준을 구분해 보세요'],
    J:['미리 정한 순서를 따르는 선호','완료 기준과 중간 확인 시점을 미리 적어 보세요'],P:['선택을 열어 두는 선호','남겨 둘 선택지와 결정을 멈추지 않을 마감 기준을 함께 적어 보세요']
  };
  function practice(st) {
    var e=evidence(st),B=e.B,season=PRACTICE_SEASON[B.season],who=address(st);
    var group=e.G.many.map(function(k){return k+' '+B.groups[k]+'개는 '+PRACTICE_GROUP[k][0]+'의 상징으로 읽어요 → '+PRACTICE_GROUP[k][1]+'.';}).join(' ');
    var p1=B.monthBranch+'월지의 '+B.season+g.Josa.eun(B.season)+' 전통적으로 '+season[0]+'의 상징으로 읽어요 → '+season[1]+'. '+group;
    var dayGroup=g.Saju.GOD_GROUP[g.Saju.tenGod(st.saju.dayMaster.stem,g.Saju.HIDDEN[B.dayBranch][0])];
    var p2='일지 '+B.dayBranch+'의 본기 '+g.Saju.HIDDEN[B.dayBranch][0]+'('+g.Saju.STEM_KO[g.Saju.HIDDEN[B.dayBranch][0]]+')'+g.Josa.eun(g.Saju.STEM_KO[g.Saju.HIDDEN[B.dayBranch][0]])+' 일간 기준 '+dayGroup+' 무리예요. '+PRACTICE_GROUP[dayGroup][0]+'의 상징을 일지에서도 참고해요 → '+PRACTICE_GROUP[dayGroup][1]+'. ';
    p2+=B.monthDay==='육충'?'월지·일지는 육충 표의 서로 다른 방향이라는 상징으로 읽어요 → 이미 정한 기준과 다시 확인할 기준을 나누어 보세요.':B.monthDay==='육합'?'월지·일지는 육합 표의 함께 묶임이라는 상징으로 읽어요 → 함께 적용할 기준을 한 문장으로 쓰고 각 항목과 맞는지 확인해 보세요.':'월지·일지는 이번 육합·육충 표에 해당하지 않아요 → 월지와 일지의 근거를 따로 비교해 보세요.';
    var p3=e.E.many.map(function(k){return '천간+지장간 집계의 '+k+' '+B.expanded[k]+'개는 '+PRACTICE_ELEMENT[k][0]+g.Josa.ira(PRACTICE_ELEMENT[k][0])+' 전통적 상징을 참고하는 단서예요 → '+PRACTICE_ELEMENT[k][1]+'.';}).join(' ');
    if(e.G.zero.length)p3+=' '+e.G.zero.join('·')+' 무리가 이 집계에서 0개예요. 관찰 범위를 넓혀 보고 싶다면 '+e.G.zero.map(function(k){return PRACTICE_ZERO[k];}).join('·')+'을 골라 해 보세요.';
    if(e.E.zero.length)p3+=' '+e.E.zero.join('·')+'도 이 집계에서 0개예요.';
    var label=st.mbtiFromFace?'사진 특징으로 본 추정 기준':st.mbtiFromTest?'문항 응답 기준 · 12개 응답의 앱 규칙 결과':'직접 입력 기준 · 스스로 고른 네 글자';
    var axes=String(st.mbti).split('').map(function(k){var a=PRACTICE_AXIS[k];return k+g.Josa.eun(k)+' '+a[0]+g.Josa.ro(a[0])+' 읽는 조각이에요 → '+a[1]+'.';}).join(' ');
    return '<div class="x-practice" style="overflow-wrap:anywhere;padding:12px 4px 0;border-top:1px solid #d6b57940;margin-top:16px"><h3 class="ttl" style="font-size:14px">'+esc(who+'을 위한 근거와 실천')+'</h3>'+para(who+'에게 맞는 부분을 골라 볼 수 있도록 근거와 실천을 연결했어요. 아래는 그 근거와 이어 본 실천 제안이에요.')+'<p class="eyebrow">사주 전통 해석 근거 · 앱의 실천 제안</p>'+para(p1)+'<details><summary>일지·분포 근거와 실천 더 보기</summary>'+para(p2)+para(p3)+para('무가중치 집계와 전통적 상징을 바탕으로 한 제안이에요.')+'</details><p class="eyebrow">'+esc(label+' · '+st.mbti)+'</p>'+para(st.mbtiFromFace?'사진 비율에 앱 규칙을 적용한 추정이에요. 아래 연습으로 이 방향을 이어서 살펴보세요.':'이 네 글자는 '+(st.mbtiFromTest?'문항 응답을 앱 규칙으로 묶은':'직접 고른')+' 값이며, 사주 계산과는 다른 출처예요.')+para(axes)+'</div>';
  }
  function synth(st) {
    var e=evidence(st), who=address(st), D=g.Texts.DM[st.saju.dayMaster.stem], T=st.type;
    var monthKo=g.Saju.BRANCH_KO[e.B.monthBranch], typeName=g.Texts.MBTI[st.mbti][0];
    var cores=[];
    if(st.face){
      var freads=st.face.items.map(faceReadOf).filter(Boolean);
      if(freads.length) cores.push(freads[0]);
    }
    cores=cores.concat([SAJU_STEM[st.saju.dayMaster.stem], SAJU_SEASON[e.B.season], mbtiCores(st)[0]]).filter(Boolean).slice(0,4);
    var follows=['일간 '+D.name, '월지 '+monthKo+'('+e.B.season+')', '‘'+typeName+'’ 방향'];
    var analysis;
    if(st.face && cores[0] && cores[0].see){
      analysis='관상·사주·성격유형을 함께 보면 '+eun(who)+' '+eyo(cores[0].see)+'. 이어서 '+iga(joinWa(follows))+' 함께 보여요.';
    } else {
      analysis='사주와 성격유형을 함께 보면 '+eun(who)+' 일간 '+iga(D.name)+' 놓인 사주예요. 이어서 '+iga(joinWa(follows.slice(1)))+' 함께 보여요.';
    }
    var details=para(source(st))+para(e.month+' '+e.gods)+para(e.missing+' '+e.els+' '+e.day+' '+e.pair)+(st.face?'':para('사진을 넣지 않아 관상 실측은 비워 두었어요. 동물의 인상 칸은 일간 음양으로 정했어요.'));
    return '<div class="card x-plain x-synth" id="xSynth"><p class="eyebrow">나의 종합 해설</p>'+para(youAre(st))+flowBody(who,analysis,cores,'이 결과로 보면 ')+more('관상·사주·성격유형 근거 확인',details)+'<div class="x-sources">'+['face','saju','mbti'].map(function(k,i){return '<button type="button" data-x-open="'+k+'">'+['관상','사주','성격유형'][i]+' 풀이 보기</button>';}).join('')+'</div></div>';
  }
  function resultWords(st) {
    var d=data(st),t=st.type,e=evidence(st);
    return {
      nick: OPEN[t.no-1]+' '+t.name,
      tags: [e.G.many[0],e.E.many[0]+' 분포',t.group],
      summary:'사주 전통 해석 · '+e.B.monthBranch+'월지('+e.B.season+'), '+iga(e.G.many.join('·'))+' 집계에서 많아요. 일지는 '+e.B.dayBranch+'이고 월지와 '+(e.B.monthDay==='해당 없음'?'육합·육충 표에 해당하지 않아요.':e.B.monthDay+' 표에 해당해요.'),
      moments: [e.B.season+' 월지',e.G.many.join('·')+' 중심 집계'],
      habit: e.missing+' '+e.els,
      tip: '명식의 집계와 성격유형의 출처를 나눠 읽어 보세요.'
    };
  }
  g.Explain = { practice:practice,address:address,youAre:youAre,evidence:evidence,basisMetrics:basisMetrics,source:source,resultWords:resultWords,synth:synth,facePane:facePane,sajuPane:sajuPane,mbtiPane:mbtiPane,faceSummary:faceSummary,sajuSummary:sajuSummary,mbtiSummary:mbtiSummary,shapeName:shapeName };
})(window);
