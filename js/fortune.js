/* 운세(오늘·내일·2027 신년운세)와 7일 출석 보상 계산 — 규칙 기반, 서버 없이 이 기기에서만 계산해요.
 * 같은 사람 + 같은 날짜면 늘 같은 결과(무작위 없음). 모든 문장은 재미용으로 직접 지었어요.
 * 근거: team/기획/07_운세기능_시안_20261030.md (v2), 화면시안 09·10·11·12 */
(function (g) {
  var S = function () { return g.Saju; }, T = function () { return g.Texts; };
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function key(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12, 0, 0); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  var WD = ['일', '월', '화', '수', '목', '금', '토'];
  var HAP = ['子丑', '寅亥', '卯戌', '辰酉', '巳申', '午未'], CHUNG = ['子午', '丑未', '寅申', '卯酉', '辰戌', '巳亥'];
  function pin(l, a, b) { return l.indexOf(a + b) >= 0 || l.indexOf(b + a) >= 0; }
  function weakest(c) { return S().ELEMENTS.slice().sort(function (a, b) { return c[a] - c[b]; })[0]; }
  var SCORE_MIN = 62, SCORE_MAX = 96, FIELD_MIN = 60, FIELD_MAX = 98;
  var BASE = { '인성': 78, '식상': 76, '비겁': 74, '재성': 74, '관성': 70 };
  var THEME = { '비겁': '동료와 함께', '식상': '표현과 창작', '재성': '재물과 성과', '관성': '책임과 평판', '인성': '배움과 도움' };
  var KEYWORD = { '비겁': '함께', '식상': '표현', '재성': '실속', '관성': '신뢰', '인성': '충전' };
  var LEAD = {
    '재성': ['손에 잡히는 결과가 생기기 쉬운 날이에요. 미뤄 둔 정산이나 견적을 오늘 끝내 보세요.', '노력한 만큼 눈에 보이는 성과가 따라오기 쉬운 날이에요. 작은 목표 하나를 숫자로 정해 보세요.', '실속을 챙기기 좋은 날이에요. 장바구니를 한 번 더 살펴보면 아끼는 재미가 있어요.'],
    '관성': ['약속을 지키는 모습이 신뢰로 돌아오는 날이에요. 일정표를 한 번만 더 확인해 두세요.', '맡은 일을 깔끔하게 마무리하면 평판이 올라가기 쉬운 날이에요.', '조금 부담이 느껴져도 차근차근 하면 인정받는 날이에요. 쉬는 시간도 일정에 넣어 두세요.'],
    '인성': ['배우고 정리하기 좋은 날이에요. 책 한 챕터나 강의 하나가 큰 힌트가 될 수 있어요.', '주변의 도움을 받기 쉬운 날이에요. 막힌 일은 혼자 끙끙대지 말고 물어보세요.', '충전이 잘 되는 날이에요. 일찍 쉬면 내일이 훨씬 가벼워져요.'],
    '식상': ['말과 글에 힘이 실리는 날이에요. 미뤄 둔 아이디어를 꺼내 보세요.', '재능을 보여 줄 기회가 생기기 쉬운 날이에요. 작은 결과물이라도 공유해 보세요.', '표현할수록 흐름이 열리는 날이에요. 고마운 사람에게 먼저 연락해 보세요.'],
    '비겁': ['혼자보다 함께일 때 힘이 나는 날이에요. 같이 할 사람을 찾아보세요.', '비슷한 생각을 가진 사람을 만나기 좋은 날이에요. 모임 제안에 응해 보세요.', '내 의견이 강해지기 쉬운 날이에요. 한 번 양보하면 더 큰 걸 얻을 수 있어요.']
  };
  var BOOST = { '재성': '금전', '관성': '일·공부', '식상': '애정', '인성': '컨디션', '비겁': '애정' };
  var FIELDS = [['애정', 'connect'], ['금전', 'wealth'], ['일·공부', 'book'], ['컨디션', 'leaf']];
  var SLOT = { '재성': ['focus', '집중', '하나에 집중하면 결과가 빨리 나와요. 알림을 잠깐 꺼 두세요.'], '식상': ['talk', '소통', '연락이 술술 풀려요. 미뤄 둔 답장을 보내 보세요.'], '인성': ['rest', '휴식', '쉬어 가며 채우는 시간이에요. 따뜻한 차 한 잔 어때요?'], '관성': ['attend', '정리', '할 일을 정리하기 좋아요. 다음 일정을 미리 적어 두세요.'], '비겁': ['connect', '함께', '누군가와 함께하면 힘이 나요. 같이 걷거나 통화해 보세요.'] };
  var SLOT_TIME = [['오전', 10], ['오후', 15], ['밤', 21]];
  var ROLES = ['직진러', '스포트라이트', '레이저', '비밀병기', '반장', '온기 메신저', '정리왕', '등대'];
  var TYPE_DAY = {
    '재성': ['미뤄 둔 신청서나 견적, 오늘 먼저 보내면 결과가 빨라요.', '내가 해낸 일을 가볍게 자랑해도 좋은 날이에요. 칭찬이 성과로 이어지기 쉬워요.', '할 일 목록에서 딱 하나만 골라 끝까지 밀어붙이면, 오늘의 성과가 그걸로 정해져요.', '조용히 준비해 둔 것을 꺼낼 타이밍이에요. 한 명에게만 먼저 보여 줘 보세요.', '모임 정산이나 공동 일정, 오늘 내가 정리하면 모두가 편해져요.', '고마운 사람에게 작은 커피 한 잔을 건네 보세요. 오늘은 그게 제일 좋은 성과예요.', '영수증이나 구독 목록을 한 번 정리하면 새는 돈이 보여요.', '꾸준히 해 온 일이 조용히 빛을 보는 날이에요. 기록을 남겨 두세요.'],
    '관성': ['속도보다 순서가 중요한 날이에요. 시작 전에 순서 세 줄만 적어 보세요.', '오늘은 주목보다 신뢰가 먼저예요. 약속 하나를 꼭 지켜 보세요.', '검토할 문서가 있다면 오늘이 적기예요. 한 번 더 보면 빈틈이 보여요.', '맡은 역할을 묵묵히 해내면 누군가 알아봐 줄 거예요.', '규칙을 정리해서 공유하면 팀이 훨씬 편해져요. 반장 본능을 꺼내 보세요.', '부탁을 다 들어주지 않아도 괜찮아요. 오늘은 정중한 거절도 신뢰예요.', '마감이 있는 일부터 차례로 끝내면 저녁이 가벼워져요.', '누군가 기대 오면 들어 주기만 해도 충분해요. 그게 오늘의 평판이에요.'],
    '인성': ['달리기 전에 지도부터 보는 날이에요. 관련 글 하나만 읽고 출발해 보세요.', '오늘은 말하기보다 듣는 쪽이 이득이에요. 선배의 한마디에 힌트가 있어요.', '파고들던 주제의 답이 책 한 권에서 나올 수 있어요. 메모를 준비해 두세요.', '혼자 배우는 시간이 실력으로 쌓이는 날이에요. 30분만 내어 보세요.', '오늘은 챙기는 쪽보다 챙김을 받는 쪽이 되어 보세요. 도움을 청해도 괜찮아요.', '나를 아껴 주는 사람에게 고민을 털어놓기 좋은 날이에요.', '배운 걸 한 장으로 정리하면 오래 남아요. 오늘은 노트 정리의 날이에요.', '스스로를 비추는 날이에요. 좋아하는 음악과 함께 일찍 쉬어 보세요.'],
    '식상': ['떠오른 아이디어를 바로 메모하고 한 명에게 말해 보세요. 실행 속도가 붙어요.', '무대가 열리는 날이에요. 사진 한 장, 글 한 줄로 나를 보여 주세요.', '핵심만 담은 한 줄 요약이 오늘 가장 큰 무기예요.', '숨겨 둔 취미나 작업물을 살짝 공개해 보세요. 반응이 생각보다 좋을 수 있어요.', '회의나 모임에서 먼저 의견을 꺼내면 흐름이 정리돼요.', '칭찬 한마디를 먼저 건네 보세요. 대화가 훨씬 부드러워져요.', '머릿속 생각을 글로 꺼내면 정리가 끝나요. 짧은 일기를 써 보세요.', '말로 하기 어려운 마음은 짧은 메시지로 전해 보세요.'],
    '비겁': ['혼자 달리기보다 같이 달릴 사람을 찾으면 더 멀리 가요.', '친구와 함께 찍은 사진 한 장이 오늘의 하이라이트가 될 수 있어요.', '나와 비슷한 고수를 찾아 대화해 보세요. 생각이 한 단계 정리돼요.', '같은 취미를 가진 사람과 이야기하면 숨은 매력이 드러나요.', '경쟁보다 협력이 이득인 날이에요. 역할을 나눠 맡겨 보세요.', '오랜만인 친구에게 먼저 안부를 물어보세요.', '함께 쓰는 자료를 정리해 공유하면 고맙다는 말을 듣기 쉬운 날이에요.', '가까운 한 사람과의 조용한 시간이 가장 큰 충전이 돼요.']
  };
  // 출석 보상 문장
  var ITEMS = { '목': ['작은 화분', '초록색 펜', '나무 소품', '허브차', '초록 양말', '식물 사진 배경화면'], '화': ['빨간 펜', '따뜻한 무드등', '붉은 과일', '코랄색 립밤', '빨간 끈 키링', '모닥불 사진 배경화면'], '토': ['베이지 머그컵', '도자기 소품', '고소한 견과류', '노란 메모지', '둥근 쿠션', '흙빛 가방'], '금': ['작은 은색 액세서리', '흰 셔츠', '금속 볼펜', '은색 키링', '흰 머그컵', '유리컵'], '수': ['남색 손수건', '물 한 병', '파란 노트', '투명 텀블러', '검정 이어폰', '물결무늬 소품'] };
  var ROLE_STRENGTH = ['망설임 없는 첫걸음이 주변을 움직여요.', '분위기를 읽고 사람을 웃게 하는 힘이 있어요.', '남들이 놓친 숫자 하나를 찾아내요.', '알수록 깊어지는 취향과 꾸준함이 무기예요.', '흩어진 사람과 일을 한 줄로 묶어 내요.', '말 한마디로 분위기를 데우는 힘이 있어요.', '복잡한 걸 차곡차곡 쌓아 완성도를 높여요.', '한결같음 덕분에 사람들이 오래 곁에 머물러요.'];
  var REL_USE = { '재성': '오늘은 그 강점을 성과를 챙기는 데 써 보세요.', '관성': '오늘은 그 강점이 신뢰로 이어지기 쉬워요.', '인성': '오늘은 그 강점을 배우는 데 쓰면 오래 남아요.', '식상': '오늘은 그 강점을 밖으로 보여 줄 때예요.', '비겁': '오늘은 그 강점을 친구와 나눠 보세요.' };
  var TALK = { '재성': ['요즘 제일 잘한 소비는 뭐야?', '갖고 싶은 거 딱 하나만 고르면?', '올해 이룬 작은 성과 하나는?'], '관성': ['요즘 제일 지키고 싶은 약속은?', '네가 생각하는 믿음직한 사람은 어떤 사람이야?', '이번 주에 꼭 끝내고 싶은 일은?'], '인성': ['요즘 새로 배우고 싶은 거 있어?', '최근에 들은 말 중 제일 힘이 된 말은?', '나만의 쉬는 방법은 뭐야?'], '식상': ['요즘 빠진 노래나 영상 있어?', '최근에 웃겼던 일 하나만 말해 줘', '뭐든 하나 만든다면 뭘 만들래?'], '비겁': ['우리 같이 해 보고 싶은 거 있어?', '처음 만났을 때 서로 첫인상 기억나?', '요즘 제일 자주 연락하는 사람은?'] };

  function roleIndex(type) { return (type.no - 1) % 8; }

  /** 하루 운세. offset: 0 오늘, 1 내일, 2 모레 */
  function day(saju, type, base, offset) {
    var d = addDays(base || new Date(), offset || 0), k = key(d), Sj = S();
    var tp = Sj.todayPillar(d), dmEl = saju.dayMaster.el, rel = Sj.relation(dmEl, tp.stemEl);
    var h = hash(k + '|' + saju.text), s = BASE[rel], notes = [], myB = saju.pillars.day.branch, w = weakest(saju.count);
    if (pin(HAP, myB, tp.branch)) { s += 8; notes.push('일진과 내 일지가 합을 이뤄 사람 사이가 부드러운 날이에요.'); }
    if (pin(CHUNG, myB, tp.branch)) { s -= 6; notes.push('일진과 내 일지가 충이라 리듬이 바뀌기 쉬워요. 계획에 여유 시간을 두면 좋아요.'); }
    if (tp.stemEl === w || tp.branchEl === w) { s += 6; notes.push('부족한 ' + T().EL_INFO[w].name + ' 기운이 채워지는 날이라 컨디션이 가볍게 올라가요.'); }
    s = clamp(s + h % 9, SCORE_MIN, SCORE_MAX);
    var fields = FIELDS.map(function (f, i) { return { name: f[0], icon: f[1], v: clamp(s + (BOOST[rel] === f[0] ? 8 : -3) + ((h >>> (4 + i * 3)) % 7) - 3, FIELD_MIN, FIELD_MAX) }; });
    var slots = SLOT_TIME.map(function (t) {
      var tg = g.Solar.fromYmdHms(d.getFullYear(), d.getMonth() + 1, d.getDate(), t[1], 0, 0).getLunar().getTimeInGanZhi();
      var r = Sj.relation(dmEl, Sj.STEM_EL[tg[0]]), L = SLOT[r];
      return { label: t[0], icon: L[0], word: L[1], detail: L[2], rel: r };
    });
    var ei = T().EL_INFO[w], ri = type ? roleIndex(type) : 0;
    return {
      date: k, y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(), wd: WD[d.getDay()], offset: offset || 0,
      gz: tp.gz, ko: tp.ko, rel: rel, theme: THEME[rel], title: THEME[rel] + '의 날', lead: LEAD[rel][h % 3], notes: notes,
      score: s, fields: fields, focus: BOOST[rel], /* 그날 힘이 실리는 분야(내일 화면은 점수 대신 이것만 표시) */ slots: slots, keyword: KEYWORD[rel],
      typeLine: type ? TYPE_DAY[rel][ri] : '', typeTitle: type ? type.name + (offset === 1 ? '의 내일' : offset === 2 ? '의 모레' : '의 오늘') : '',
      color: ei.lucky, colorHex: ei.color, number: ei.nums[(h >>> 7) % 2],
      // 출석 보상용(그때그때 계산, 저장 안 함)
      item: ITEMS[w][(h >>> 9) % 6], itemEl: ei.name,
      strength: type ? type.name + '의 숨은 강점: ' + ROLE_STRENGTH[ri] + ' ' + REL_USE[rel] : '',
      talk: TALK[rel]
    };
  }
  function week(saju, type, base, from, n) { var out = []; for (var i = 0; i < (n || 7); i++) out.push(day(saju, type, base, (from || 0) + i)); return out; }

  // ===== 2027 신년운세: 세운 丁未(정미, 붉은 양의 해) =====
  var YEAR_TITLE = { '재성': '실속을 거두는 한 해', '관성': '자리를 다지는 한 해', '인성': '배우고 채우는 한 해', '식상': '나를 펼쳐 보이는 한 해', '비겁': '함께 커 가는 한 해' };
  var YEAR_LEAD = {
    '재성': '2027년의 기운은 나에게 ‘성과와 실속’으로 들어와요. 해 온 일이 숫자와 결과로 보이기 시작해요.',
    '관성': '2027년의 기운은 나에게 ‘책임과 자리’로 들어와요. 맡는 일이 늘어나는 만큼 인정받을 기회도 커져요.',
    '인성': '2027년의 기운은 나에게 ‘배움과 도움’으로 들어와요. 새로 배우고 채우는 만큼 다음 해의 발판이 단단해져요.',
    '식상': '2027년의 기운은 나에게 ‘표현과 창작’으로 들어와요. 하고 싶던 말과 만들고 싶던 것을 꺼내기 좋은 해예요.',
    '비겁': '2027년의 기운은 나에게 ‘동료와 함께’로 들어와요. 같은 방향을 보는 사람을 만나 힘이 두 배가 되는 해예요.'
  };
  var YEAR_FIELDS = {
    '재성': ['성과가 숫자로 남는 해예요. 목표를 분기마다 하나씩 정해 보세요.', '들어오고 나가는 흐름이 활발해요. 가계부로 흐름을 보면 실속이 커져요.', '함께 계획을 세우는 사람과 가까워지기 쉬워요.', '바쁜 만큼 쉬는 날을 달력에 먼저 표시해 두세요.'],
    '관성': ['맡는 역할이 커지는 해예요. 혼자 다 하려 하기보다 나눠 맡기면 더 빛나요.', '큰 지출보다 꾸준한 관리가 어울리는 해예요. 고정 지출을 한 번 점검해 보세요.', '믿음을 주는 모습이 좋은 인연을 불러요. 약속을 지키는 게 최고의 매력이에요.', '책임이 늘어나는 만큼 잠과 휴식을 먼저 챙겨 주세요.'],
    '인성': ['자격증, 강의, 독서처럼 배우는 일에 힘이 붙는 해예요.', '당장의 수입보다 나를 키우는 데 쓰는 돈이 아깝지 않은 해예요.', '도움을 주는 선배나 어른을 만나기 쉬워요. 먼저 물어보는 용기가 열쇠예요.', '충전이 잘 되는 해예요. 나만의 쉬는 루틴을 하나 만들어 보세요.'],
    '식상': ['아이디어를 밖으로 꺼낼수록 기회가 생기는 해예요. 기록을 공개해 보세요.', '재능이 수입으로 이어질 수 있는 해예요. 작게라도 시작해 보세요.', '표현이 풍부해져 새로운 인연이 생기기 쉬워요.', '하고 싶은 게 많아지는 해라 일정은 여유 있게 잡아 주세요.'],
    '비겁': ['협업과 팀플에서 힘이 나는 해예요. 함께할 사람을 고르는 눈이 중요해요.', '함께 쓰는 돈이 늘 수 있어요. 나눠 내는 규칙을 미리 정해 두면 편해요.', '친구가 늘고 모임이 많아지는 해예요. 오래된 친구도 한 번 챙겨 보세요.', '같이 운동할 친구를 만들면 꾸준함이 생겨요.']
  };
  var YEAR_FIELD_NAMES = [['일·공부', 'book'], ['금전', 'wealth'], ['관계·애정', 'connect'], ['컨디션', 'leaf']];
  var SEASON_YEAR = { '바람': '바람처럼 가볍게 새 장소와 사람에게 먼저 날아가 봐요.', '불': '불처럼 내가 좋아하는 것을 숨기지 말고 환하게 나눠 봐요.', '땅': '땅처럼 차곡차곡 쌓아 온 것을 돌아보며 단단히 다져 봐요.', '물': '물처럼 흐름에 맡기며 조용히 나를 채우는 시간을 넣어 봐요.' };
  var ROLE_YEAR = ['올해는 시작한 일 중 하나를 끝까지 완주해 보세요.', '올해는 나를 보여 줄 무대를 하나 정해 꾸준히 서 보세요.', '목표를 세 개 말고 하나만 정하면, 연말에 가장 크게 웃는 타입이에요.', '올해는 숨겨 둔 카드 하나를 꺼내 보는 해로 만들어 보세요.', '올해는 모임 하나를 맡아 내 방식대로 꾸려 보세요.', '올해는 고마운 사람에게 한 달에 한 번씩 마음을 전해 보세요.', '올해는 1년 계획을 한 장에 정리하고 분기마다 고쳐 보세요.', '올해는 나를 위한 시간을 일정표에 먼저 넣어 주세요.'];
  function year(saju, type, Y) {
    Y = Y || 2027; var Sj = S(), gz = g.Solar.fromYmd(Y, 6, 1).getLunar().getYearInGanZhiExact();
    var rel = Sj.relation(saju.dayMaster.el, Sj.STEM_EL[gz[0]]), myB = saju.pillars.day.branch, yB = saju.pillars.year.branch, w = weakest(saju.count), note = '';
    if (pin(CHUNG, myB, gz[1])) note = '올해는 생활 리듬이 크게 바뀔 수 있는 해예요. 이사·이직 같은 변화가 생기면 새 판을 짤 기회로 써 보세요.';
    else if (pin(HAP, myB, gz[1])) note = '올해는 곁에 있는 사람과 손발이 잘 맞는 해예요. 함께하는 계획이 순조롭게 풀리기 쉬워요.';
    else if (pin(CHUNG, yB, gz[1])) note = '올해는 바깥 환경이 자주 바뀔 수 있어요. 변화에 맞춰 계획을 유연하게 잡아 보세요.';
    else if (pin(HAP, yB, gz[1])) note = '올해는 바깥 일이 수월하게 풀리기 쉬운 해예요. 새 제안에 귀를 열어 두세요.';
    var months = [];
    for (var m = 1; m <= 12; m++) {
      var mg = g.Solar.fromYmd(Y, m, 15).getLunar().getMonthInGanZhiExact(), r = Sj.relation(saju.dayMaster.el, Sj.STEM_EL[mg[0]]);
      var sc = BASE[r] + (pin(HAP, myB, mg[1]) ? 6 : 0) - (pin(CHUNG, myB, mg[1]) ? 5 : 0) + ((Sj.STEM_EL[mg[0]] === w || Sj.BRANCH_EL[mg[1]] === w) ? 4 : 0) + hash(Y + '-' + m + '|' + saju.text) % 7;
      months.push({ m: m, gz: mg, rel: r, theme: THEME[r], score: clamp(sc, SCORE_MIN, SCORE_MAX) });
    }
    var order = months.slice().sort(function (a, b) { return b.score - a.score || a.m - b.m; });
    var best = order.slice(0, 3).map(function (x) { return x.m; }).sort(function (a, b) { return a - b; });
    var slow = order.slice(-2).map(function (x) { return x.m; }).sort(function (a, b) { return a - b; });
    var ri = type ? roleIndex(type) : 0;
    return {
      year: Y, gz: gz, ko: Sj.STEM_KO[gz[0]] + Sj.BRANCH_KO[gz[1]], animal: '붉은 양', rel: rel, title: YEAR_TITLE[rel], lead: YEAR_LEAD[rel], note: note,
      fields: YEAR_FIELD_NAMES.map(function (f, i) { return { name: f[0], icon: f[1], text: YEAR_FIELDS[rel][i] }; }),
      months: months, best: best, slow: slow,
      typeTitle: type ? type.name + '의 ' + Y : '', typeLine: type ? (SEASON_YEAR[type.season] + ' ' + ROLE_YEAR[ri]) : '',
      startNote: Y + '년 기운은 입춘(2월 4일)부터 시작돼요. 1월은 아직 ' + (Y - 1) + '년 기운이 이어져요.'
    };
  }

  // ===== 7일 완주 보상: 숨은 궁합 타입 =====
  var EL_SEASON = { '목': 0, '화': 1, '금': 2, '수': 3 };
  function hiddenMatch(saju, type) {
    var Sj = S(), el = saju.dayMaster.el, gen = Object.keys(Sj.GEN).filter(function (k) { return Sj.GEN[k] === el; })[0];
    var src = gen === '토' ? el : gen; // 토는 별도 구간이 없어 같은 기운의 상징으로
    var si = EL_SEASON[src], ri = roleIndex(type) ^ 7, no = si * 8 + ri + 1, all = g.Reading.allTypes(), t = all[no - 1];
    var sName = ['바람', '불', '땅', '물'][si] + ' 무리', why;
    why = (gen === '토' ? sName + ' 상징을 가진 이 타입은 나와 같은 ' + el + ' 기운의 결을 나눠 든든하고, ' : sName + ' 상징을 가진 이 타입의 ' + gen + ' 기운이 내 ' + el + ' 기운과 어울리고, ') +
      '인상과 성격 방향이 나와 반대라 서로 빈칸을 채워 줘요. 주변에 이 타입 친구가 있나요?';
    return { no: no, name: t.name, desc: t.desc, emoji: '', why: why };
  }

  g.Fortune = { day: day, week: week, year: year, hiddenMatch: hiddenMatch, key: key, addDays: addDays, SCORE_MIN: SCORE_MIN, SCORE_MAX: SCORE_MAX,
    _copy: { LEAD: LEAD, TYPE_DAY: TYPE_DAY, SLOT: SLOT, ITEMS: ITEMS, ROLE_STRENGTH: ROLE_STRENGTH, REL_USE: REL_USE, TALK: TALK, YEAR_TITLE: YEAR_TITLE, YEAR_LEAD: YEAR_LEAD, YEAR_FIELDS: YEAR_FIELDS, SEASON_YEAR: SEASON_YEAR, ROLE_YEAR: ROLE_YEAR, THEME: THEME } };
})(typeof window !== 'undefined' ? window : globalThis);
