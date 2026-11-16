/* 관상 + 사주 + MBTI 통합 리딩, 오늘의 운세, 궁합 (규칙 기반) */
(function (g) {
  var T = g.Texts;
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  var FACE_ADJ = { '긴 얼굴형': '깊은 눈빛의', '각진 얼굴형': '단단한 턱선의', '둥근 얼굴형': '말랑한 인상의', '역삼각 얼굴형': '반짝이는 감각의', '계란형 얼굴': '균형 잡힌 인상의' };
  var DM_ADJ = { '甲': '큰 나무 같은', '乙': '덩굴꽃 같은', '丙': '태양 같은', '丁': '촛불 같은', '戊': '큰 산 같은', '己': '들판 같은', '庚': '강철 같은', '辛': '보석 같은', '壬': '바다 같은', '癸': '단비 같은' };
  function faceKeyword(face) {
    var t = face.items.map(function (i) { return i.title; });
    function has(x) { return t.indexOf(x) >= 0; }
    if (has('살짝 올라간 눈꼬리')) return '불꽃 눈매의';
    if (has('살짝 내려간 눈꼬리')) return '다정한 눈매의';
    if (has('또렷하고 맑은 눈')) return '또렷한 눈매의';
    if (has('길고 깊은 눈매')) return '깊은 눈매의';
    if (has('올라간 입꼬리')) return '미소 입꼬리의';
    if (has('시원한 입매')) return '시원한 미소의';
    return FACE_ADJ[face.shape];
  }
  var MOMENT = { '리더십': '팀플에서 방향을 정해야 할 때', '추진': '다들 망설일 때 먼저 시작하는 순간', '분석': '복잡한 문제를 정리해야 할 때', '공감': '친구가 힘들어서 연락해 올 때', '안정': '오래 꾸준히 해야 하는 일 앞에서', '표현': '사진, 글, 말로 나를 보여 줄 때', '직관': '처음 보는 상황에서 감으로 고를 때' };
  var HABIT = { '리더십': '단톡방에서 결국 내가 일정 정리를 하고 있는 것', '추진': '일단 결제부터 하고 나중에 고민하는 것', '분석': '맛집 하나 고르는 데 리뷰 30개 읽는 것', '공감': '남 챙기다 내 일정은 까먹는 것', '안정': '같은 메뉴만 계속 시키는 것', '표현': '사진 한 장 올리려고 50장 찍는 것', '직관': '“그냥 느낌이 그래”로 설명을 끝내는 것' };
  var TIP = { '리더십': '정리는 내가 해도, 결정은 같이 하자고 한 번 물어봐 주기', '추진': '결제 버튼 앞에서 딱 하루만 장바구니에 묵혀 두기', '분석': '리뷰는 딱 5개까지만 읽고 고르기', '공감': '내 약속부터 캘린더에 먼저 적어 두기', '안정': '한 달에 한 번은 처음 가 보는 곳 가 보기', '표현': '마음에 드는 사진 세 장 고르면 바로 올리기', '직관': '느낌이 온 이유를 한 줄로 적어 보기' };
  var BEST = { ISTJ: 'ESFP', ISFJ: 'ESTP', INFJ: 'ENFP', INTJ: 'ENTP', ISTP: 'ESFJ', ISFP: 'ENFJ', INFP: 'ENFJ', INTP: 'ENTJ', ESTP: 'ISFJ', ESFP: 'ISTJ', ENFP: 'INFJ', ENTP: 'INTJ', ESTJ: 'ISFP', ESFJ: 'ISTP', ENFJ: 'INFP', ENTJ: 'INTP' };

  function eyo(w) { return g.Josa.eyo(w); }
  function iga(w) { return g.Josa.iga(w); }
  function weakest(count) { var e = g.Saju.ELEMENTS.slice().sort(function (a, b) { return count[a] - count[b]; }); return e[0]; }
  function strongest(count) { var e = g.Saju.ELEMENTS.slice().sort(function (a, b) { return count[b] - count[a]; }); return e[0]; }

  function combined(saju, mbti, face) {
    var stem = saju.dayMaster.stem, dm = T.DM[stem], el = saju.dayMaster.el, mb = T.MBTI[mbti];
    var score = {};
    function add(t, w) { if (t) score[t] = (score[t] || 0) + w; }
    dm.key.forEach(function (t) { add(t, 1.5); });
    add(mb[1], 1.5); add(mb[2], 1.5);
    if (face) face.tags.forEach(function (t) { add(t, 1); });
    var tags = Object.keys(score).sort(function (a, b) { return score[b] - score[a] || a.localeCompare(b); }).slice(0, 3);
    // 별명 체계: 관상 키워드 + MBTI + 일간 오행 (예: 불꽃 눈매의 ENFJ 병화)
    var nick = (face ? faceKeyword(face) : DM_ADJ[stem]) + ' ' + mbti + ' ' + dm.name;
    var lines = [];
    if (face) lines.push('관상으로 보면 ' + face.items[0].text.split('. ')[0].replace(/\.$/, '') + '.');
    lines.push('사주로 보면 나를 나타내는 기운(일간)은 ' + '' + dm.name + ', ‘' + dm.nick + '’' + eyo(dm.nick) + '.');
    lines.push('성격유형 ' + mbti + '(' + mb[0] + ')와 만나면, ' + T.EL_LETTER[el][mbti[0]]);
    lines.push('세 가지가 공통으로 가리키는 키워드는 ' + tags.map(function (t) { return '#' + t; }).join(' ') + '이에요. ' + T.TAG_TEXT[tags[0]]);
    var twist = null;
    if (face && face.tags.length) {
      var ft = face.tags[0], inner = dm.key.concat([mb[1], mb[2]]);
      if (inner.indexOf(ft) < 0) twist = '첫인상은 #' + ft + ' 쪽인데, 타고난 기질과 성격은 #' + dm.key[0] + ' 쪽이에요. 알고 나면 “생각보다 ' + (dm.key[0] === '공감' ? '다정하네' : dm.key[0] === '분석' ? '꼼꼼하네' : dm.key[0] === '추진' ? '과감하네' : dm.key[0] === '직관' ? '감이 좋네' : dm.key[0] === '표현' ? '재밌네' : dm.key[0] === '리더십' ? '든든하네' : '한결같네') + '?” 소리를 듣는 반전 매력형이에요.';
      else twist = '얼굴에서 보이는 #' + ft + ' 기운이 사주와 성격유형에서도 똑같이 보여요. 보이는 그대로의 사람이라 첫인상과 실제가 잘 맞는 타입이에요.';
    }
    var weak = weakest(saju.count), strong = strongest(saju.count);
    return {
      nick: nick, tags: tags, lines: lines, twist: twist,
      summary: T.TAG_TEXT[tags[0]].split('. ')[0] + '.',
      moments: tags.map(function (t) { return MOMENT[t]; }), habit: HABIT[tags[tags.length - 1]], tip: TIP[tags[tags.length - 1]], best: BEST[mbti],
      element: '오행 중 ' + T.EL_INFO[strong].name + '의 기운이 가장 많고 ' + T.EL_INFO[weak].name + '의 기운이 ' + (saju.count[weak] === 0 ? '없어요' : '적은 편이에요') + '. ' + T.EL_INFO[weak].lucky + ' 계열 아이템으로 ' + T.EL_INFO[weak].word + '의 기운을 채워 보세요.',
      dmLetters: mbti.split('').map(function (L) { return T.EL_LETTER[el][L]; })
    };
  }

  function today(saju, date) {
    var d = date || new Date();
    var key = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    var tp = g.Saju.todayPillar(d);
    var rel = g.Saju.relation(saju.dayMaster.el, tp.stemEl);
    var h = hash(key + '|' + saju.text);
    var info = T.TODAY[rel], weak = weakest(saju.count), ei = T.EL_INFO[weak];
    return { date: key, pillar: tp, rel: rel, theme: info.theme, msg: info.msgs[h % info.msgs.length], score: 62 + (h >>> 3) % 35,
      color: ei.lucky, colorHex: ei.color, number: ei.nums[(h >>> 7) % 2] };
  }

  var HAP = ['子丑', '寅亥', '卯戌', '辰酉', '巳申', '午未'], CHUNG = ['子午', '丑未', '寅申', '卯酉', '辰戌', '巳亥'];
  function pairIn(list, a, b) { return list.indexOf(a + b) >= 0 || list.indexOf(b + a) >= 0; }
  function match(A, B, mA, mB, nameB) {
    var s = 55, notes = [];
    var ea = A.dayMaster.el, eb = B.dayMaster.el, S = g.Saju; var N = function (e) { return T.EL_INFO[e].name; };
    if (ea === eb) { s += 12; notes.push('두 사람의 일간이 같은 ' + N(ea) + ' 기운이라 말하지 않아도 통하는 친구 같은 사이예요.'); }
    else if (S.GEN[ea] === eb) { s += 18; notes.push('내 ' + N(ea) + ' 기운이 ' + nameB + '님의 ' + N(eb) + ' 기운을 키워 주는 상생 관계예요. 내가 챙겨 줄수록 관계가 깊어져요.'); }
    else if (S.GEN[eb] === ea) { s += 18; notes.push(nameB + '님의 ' + N(eb) + ' 기운이 내 ' + N(ea) + ' 기운을 북돋는 상생 관계예요. 곁에 있으면 힘이 나는 사이예요.'); }
    else { s += 6; notes.push('두 사람의 ' + N(ea) + ' 기운과 ' + N(eb) + ' 기운은 서로를 다듬는 관계예요. 티격태격하면서 서로 성장하는 자극이 되는 사이예요.'); }
    var ba = A.pillars.day.branch, bb = B.pillars.day.branch;
    if (pairIn(HAP, ba, bb)) { s += 12; notes.push('일지(' + S.BRANCH_KO[ba] + '·' + S.BRANCH_KO[bb] + ')가 육합이라 함께 있을 때 편안함이 커요.'); }
    else if (pairIn(CHUNG, ba, bb)) { s -= 4; notes.push('일지(' + S.BRANCH_KO[ba] + '·' + S.BRANCH_KO[bb] + ')가 충이라 생활 리듬이 달라요. 서로의 템포를 존중하면 오히려 활력이 돼요.'); }
    var fill = 0;
    S.ELEMENTS.forEach(function (e) { if (A.count[e] === 0 && B.count[e] >= 2) fill++; if (B.count[e] === 0 && A.count[e] >= 2) fill++; });
    if (fill) { s += Math.min(12, fill * 6); notes.push('한쪽에 부족한 오행을 다른 쪽이 넉넉히 가지고 있어 서로 빈자리를 채워 줘요.'); }
    var mm = 0; if (mA[1] === mB[1]) mm += 8; if (mA[0] !== mB[0]) mm += 4; if (mA[2] !== mB[2]) mm += 4; if (BEST[mA] === mB) mm += 6;
    s += mm;
    notes.push('성격유형은 ' + mA + ' × ' + mB + '. ' + (mA[1] === mB[1] ? '세상을 보는 방식(' + mA[1] + ')이 같아 대화가 잘 통해요. ' : '보는 방식(' + mA[1] + '·' + mB[1] + ')이 달라 서로에게 새로운 시야를 열어 줘요. ') + (mA[0] !== mB[0] ? '에너지 방향이 달라 서로 균형을 잡아 줘요.' : '에너지 방향이 같아 노는 스타일이 비슷해요.'));
    var parts = matchParts(A, B, mA, mB);
    s = Math.max(50, Math.min(99, Math.round(0.45 * parts.el + 0.2 * parts.br + 0.35 * parts.mb)));
    var label = s >= 88 ? '찰떡궁합' : s >= 80 ? '꿀조합' : s >= 72 ? '알수록 좋은 사이' : '서로 배우는 사이';
    var head = fill ? '서로의 빈칸을 채우는 사이' : ea === eb ? '말 안 해도 통하는 사이' : (S.GEN[ea] === eb || S.GEN[eb] === ea) ? '서로를 키워 주는 사이' : '서로를 다듬어 주는 사이';
    var chips = [mA[1] === mB[1] ? '대화가 잘 통함' : '새로운 시야', mA[0] !== mB[0] ? '에너지 밸런스' : '노는 스타일 비슷', pairIn(CHUNG, ba, bb) ? '템포 차이는 귀여운 포인트' : '함께 있으면 편안'];
    return { score: s, label: label, head: head, pair: ea + ({ '목': '과', '금': '과' }[ea] || '와') + ' ' + eb + '의 조합', parts: parts, chips: chips, notes: notes };
  }

  // 얼굴이 말하는 MBTI: 관상 키워드를 축별로 투표(동점은 얼굴 비율 해시로 결정)
  var VOTE = { '표현': 'ENFP', '리더십': 'E_TJ', '추진': 'ES_P', '분석': 'I_TJ', '안정': 'IS_J', '공감': '_NF_', '직관': 'IN__' };
  function faceMbti(face) {
    if (!face) return null;
    var c = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    face.tags.forEach(function (t) { var v = VOTE[t] || ''; v.split('').forEach(function (L) { if (c[L] !== undefined) c[L]++; }); });
    var h = hash(JSON.stringify(face.sam) + face.shape), axes = ['EI', 'SN', 'TF', 'JP'], out = '';
    axes.forEach(function (ax, i) { var a = c[ax[0]], b = c[ax[1]]; out += a > b ? ax[0] : b > a ? ax[1] : ax[(h >>> i) & 1]; });
    return out;
  }
  function matchParts(A, B, mA, mB) {
    var S = g.Saju, ea = A.dayMaster.el, eb = B.dayMaster.el;
    var el = ea === eb ? 78 : (S.GEN[ea] === eb || S.GEN[eb] === ea) ? 90 : 68, fill = 0;
    S.ELEMENTS.forEach(function (e) { if (A.count[e] === 0 && B.count[e] >= 2) fill++; if (B.count[e] === 0 && A.count[e] >= 2) fill++; });
    el = Math.min(98, el + fill * 4);
    var ba = A.pillars.day.branch, bb = B.pillars.day.branch;
    var br = pairIn(HAP, ba, bb) ? 94 : pairIn(CHUNG, ba, bb) ? 64 : 76;
    var mb = 62 + (mA[1] === mB[1] ? 14 : 0) + (mA[0] !== mB[0] ? 8 : 0) + (mA[2] !== mB[2] ? 6 : 0) + (BEST[mA] === mB ? 8 : 0);
    return { el: el, br: br, mb: Math.min(98, mb) };
  }

  // ===== 얼팔타입 32가지 분류 (05_얼팔타입_고유분류_시안 본안, 10/30 13:06 조셉님 확정) =====
  // 인상(관상) 2 × 사주 월지 네 구간에 붙인 원소 무리 4(바람·불·땅·물) × 성격유형(E/I · T/F) 4. 같은 입력이면 늘 같은 결과(무작위 없음).
  var T_SEASON = [["바람", "바람", "", "#8FD3BE"], ["불", "불", "", "#F2876A"], ["땅", "땅", "", "#D8AE6E"], ["물", "물", "", "#79AEE6"]];
  var T_ROLE = [['직진러', ''], ['스포트라이트', ''], ['레이저', ''], ['비밀병기', ''], ['반장', ''], ['온기 메신저', ''], ['정리왕', ''], ['등대', '']];
  var T_ANIMAL = ["송골매", "앵무새", "올빼미", "박쥐", "기러기", "제비", "꿀벌", "두루미", "치타", "공작", "여우", "불도마뱀", "사자", "삽살개", "미어캣", "레서판다", "코뿔소", "캥거루", "두더지", "고슴도치", "코끼리", "곰", "비버", "거북이", "상어", "돌고래", "문어", "해마", "고래", "수달", "펭귄", "해파리"];
  var T_DESC = [
    "방향이 정해지면 바람을 가르듯 곧장 날아가는 실행 담당이에요.",
    "처음 만난 자리도 재잘재잘 말 한마디로 환하게 바꾸는 분위기 메이커예요.",
    "다들 지나친 단서를 조용히 오래 보고 핵심을 짚어 내는 관찰자예요.",
    "평소엔 거꾸로 매달려 쉬는 듯해도 필요한 순간 뜻밖의 감각을 보여 줘요.",
    "긴 여정에서 앞장서 대열을 짜고 함께 갈 순서를 정하는 길잡이예요.",
    "소식과 안부를 물어 나르며 사람 사이를 가볍게 이어 주는 연락 담당이에요.",
    "흩어진 할 일을 칸칸이 정리해 결국 달콤한 결과를 모아 오는 정리왕이에요.",
    "서두르지 않는 걸음으로 곁을 지키며 오래 믿음을 주는 사람이에요.",
    "마음먹은 순간 누구보다 빠르게 출발해 첫 결과를 가져오는 스프린터예요.",
    "펼치는 순간 시선이 모이는 화려한 표현력으로 자리를 무대로 만들어요.",
    "상황을 재빨리 읽고 영리한 지름길을 찾아내는 전략가예요.",
    "조용히 열기를 품고 있다가 결정적인 순간 반짝 존재감을 드러내요.",
    "무리가 흩어질 때 앞에 서서 방향을 정하고 모두를 이끌어요.",
    "반가운 마음을 숨기지 않고 꼬리 치듯 주변에 온기를 나눠 줘요.",
    "망보듯 주변을 살피며 일정과 준비물을 미리 챙기는 꼼꼼이예요.",
    "느긋하고 말랑한 분위기로 가까운 사람의 긴장을 풀어 줘요.",
    "한번 정한 목표를 향해 묵직하게 밀고 나가는 뚝심 담당이에요.",
    "통통 튀는 리듬으로 모두를 일으켜 함께 뛰게 만드는 사람이에요.",
    "겉에선 안 보이는 깊은 곳까지 파고들어 답을 찾아내는 탐구형이에요.",
    "처음엔 가시처럼 조심스러워도 알고 나면 따뜻한 속을 보여 주는 반전형이에요.",
    "큰 그림과 지난 일을 기억해 무리를 든든하게 이끄는 맏이 같은 사람이에요.",
    "넉넉한 품으로 친구의 하소연을 끝까지 들어 주는 사람이에요.",
    "작은 재료를 차곡차곡 쌓아 튼튼한 결과물을 만드는 건축가예요.",
    "자기 속도로 꾸준히 걸어 결국 끝까지 곁에 남는 사람이에요.",
    "목표를 향해 멈추지 않고 헤엄치는 집중력 높은 직진형이에요.",
    "장난기 많은 소통으로 어떤 무리에서도 금방 친구를 만드는 사람이에요.",
    "여러 생각을 동시에 굴리며 기발한 해결책을 찾아내는 두뇌파예요.",
    "작고 조용해 보여도 자기만의 세계와 개성이 뚜렷한 사람이에요.",
    "깊고 넓은 시야로 큰 흐름을 잡고 무리를 품어 이끄는 사람이에요.",
    "손을 꼭 잡고 떠다니듯 가까운 사람을 살뜰히 챙기는 다정한 사람이에요.",
    "줄을 맞춰 차근차근 해내며 필요한 순서를 지키는 성실파예요.",
    "물결 따라 유유히 떠다니며 은은한 빛으로 곁을 밝혀 주는 사람이에요."
];
  var T_SEASON_OF = { '寅': 0, '卯': 0, '辰': 0, '巳': 1, '午': 1, '未': 1, '申': 2, '酉': 2, '戌': 2, '亥': 3, '子': 3, '丑': 3 };
  var T_CLEAR = ['추진', '리더십', '표현', '분석'], T_SHAPE_CLEAR = ['각진 얼굴형', '긴 얼굴형', '역삼각 얼굴형'], T_YANG = '甲丙戊庚壬';
  function impression(face) {
    var c = 0, s = 0;
    face.tags.forEach(function (t) { if (T_CLEAR.indexOf(t) >= 0) c++; else s++; });
    return c > s ? 0 : s > c ? 1 : (T_SHAPE_CLEAR.indexOf(face.shape) >= 0 ? 0 : 1); // 0 또렷, 1 포근
  }
  function typeOf(saju, mbti, face) {
    var si = T_SEASON_OF[saju.pillars.month.branch];
    var imp = face ? impression(face) : (T_YANG.indexOf(saju.dayMaster.stem) >= 0 ? 0 : 1); // 사진 없으면 일간 음양
    var ri = imp * 4 + (mbti[0] === 'E' ? 0 : 2) + (mbti[2] === 'T' ? 0 : 1);
    var no = si * 8 + ri + 1, S = T_SEASON[si], R = T_ROLE[ri];
    return { no: no, name: T_ANIMAL[no - 1], animal: T_ANIMAL[no - 1], role: R[0], emoji: '', desc: T_DESC[no - 1], season: S[0], color: S[3],
      imp: imp ? '포근' : '또렷', group: (mbti[0] === 'E' ? '바깥' : '안쪽') + '·' + (mbti[2] === 'T' ? '이성' : '마음'), fromPhoto: !!face };
  }
  function allTypes() { var out = []; for (var n = 1; n <= 32; n++) { var S = T_SEASON[(n - 1) >> 3], R = T_ROLE[(n - 1) % 8]; out.push({ no: n, name: T_ANIMAL[n - 1], animal: T_ANIMAL[n - 1], element: S[0], desc: T_DESC[n - 1] }); } return out; }
  g.Reading = { typeOf: typeOf, allTypes: allTypes, faceMbti: faceMbti, matchParts: matchParts, combined: combined, today: today, match: match, hash: hash };
})(window);
