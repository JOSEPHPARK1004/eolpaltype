/* 조사 고르기: 마지막 '읽히는 글자'의 받침으로 은/는·이/가·을/를·와/과·으로/로·이에요/예요를 골라요.
 * 끝에 붙은 따옴표·문장부호·공백은 건너뛰고 봐요.
 * 끝이 괄호면 맞춤법대로 괄호 앞말을 기준으로 해요. 예: '진(봄)' → '진' 기준 → '진(봄)과', '사(여름)' → '사(여름)와'.
 * 다만 괄호 앞이 한자면 괄호 안 읽는 소리를 기준으로 해요. 예: '甲(갑)' → '갑' 기준 → '甲(갑)은'.
 * 숫자와 영문 대문자는 한국어로 읽는 소리 기준(예: 1=일, 2=이, L=엘, P=피). */
(function (g) {
  'use strict';
  // 0:받침 없음, 1:받침 있음(ㄹ 아님), 2:ㄹ 받침
  var DIGIT = { '0': 1, '1': 2, '2': 0, '3': 1, '4': 0, '5': 0, '6': 1, '7': 2, '8': 2, '9': 0 };
  var LATIN = { L: 2, M: 1, N: 1, R: 2 };
  var SKIP = /[\s)\]}>'"’”»」』〉》.,!?~·…:;\-_*]/;
  var QUOTE = /[\s'"’”»」』〉》.,!?~…:;]/, HANJA = /[\u3400-\u9FFF\uF900-\uFAFF]/;
  function tail(w) {
    var s = String(w == null ? '' : w), i = s.length - 1;
    while (i >= 0 && QUOTE.test(s.charAt(i))) i--;
    if (i >= 0 && s.charAt(i) === ')') {
      var open = s.lastIndexOf('(', i);
      if (open > 0) {
        var before = s.slice(0, open).replace(/\s+$/, '');
        if (before && !HANJA.test(before.charAt(before.length - 1))) return tail(before);
        if (before) s = s.slice(0, i), i = s.length - 1; // 한자(읽는 소리): 괄호 안 기준
      }
    }
    while (i >= 0 && SKIP.test(s.charAt(i))) i--;
    if (i < 0) return 0;
    var ch = s.charAt(i), c = s.charCodeAt(i);
    if (c >= 0xAC00 && c <= 0xD7A3) { var j = (c - 0xAC00) % 28; return j === 0 ? 0 : (j === 8 ? 2 : 1); }
    if (ch in DIGIT) return DIGIT[ch];
    var up = ch.toUpperCase();
    if (up >= 'A' && up <= 'Z') return LATIN[up] || 0;
    return 0;
  }
  function jong(w) { return tail(w) !== 0; }
  var J = {
    tail: tail,
    jong: jong,
    eun: function (w) { return jong(w) ? '은' : '는'; },
    iga: function (w) { return jong(w) ? '이' : '가'; },
    eul: function (w) { return jong(w) ? '을' : '를'; },
    wa: function (w) { return jong(w) ? '과' : '와'; },
    ro: function (w) { return tail(w) === 1 ? '으로' : '로'; },
    eyo: function (w) { return jong(w) ? '이에요' : '예요'; },
    ira: function (w) { return jong(w) ? '이라는' : '라는'; },
    // 'pair' 형식(예: '은는', '이가', '을를', '과와', '으로로', '이에요예요')으로 고르기
    pick: function (w, kind) {
      switch (kind) {
        case '은는': case '은': case '는': return J.eun(w);
        case '이가': case '이': case '가': return J.iga(w);
        case '을를': case '을': case '를': return J.eul(w);
        case '과와': case '와과': case '과': case '와': return J.wa(w);
        case '으로로': case '으로': case '로': return J.ro(w);
        case '이에요예요': case '이에요': case '예요': return J.eyo(w);
        default: return '';
      }
    }
  };
  g.Josa = J;
})(window);
