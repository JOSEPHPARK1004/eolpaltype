/* 공유용 결과 카드 1080×1920 — 디자인팀 시안(공유용_결과카드) 기준.
 * 사진·생년월일·시간·4주 원값은 넣지 않고, 별명·MBTI·강한 기운·한 줄 요약 같은 결과만 넣어요. */
(function (g) {
  var T = g.Texts, HANJA = { '목': '木', '화': '火', '토': '土', '금': '金', '수': '水' };
  var EL_COL = { '목': '#86C9B5', '화': '#E48B6B', '토': '#D6B579', '금': '#E6E1D6', '수': '#7D9BE0' };
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function lines(c, text, maxW) { var out = [], line = ''; text.split(' ').forEach(function (w) { var t = line ? line + ' ' + w : w; if (c.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; }); if (line) out.push(line); return out; }
  function svgImg(svg) { return new Promise(function (res) { var i = new Image(); i.onload = function () { res(i); }; i.onerror = function () { res(null); }; i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }); }
  async function draw(canvas, st) {
    await EIcons.ready();
    try { await Promise.all(['700 80px "Gowun Batang"', '400 40px EolpalSans', '600 40px EolpalSans', '700 40px EolpalSans', '700 40px "Noto Serif KR Hanja"'].map(function (f) { return document.fonts.load(f, '가A木'); })); } catch (e) { }
    var c = canvas.getContext('2d'), W = 1080, H = 1920, SERIF = '"Gowun Batang","Noto Serif KR Hanja",serif', SANS = 'EolpalSans,"Noto Serif KR Hanja",sans-serif';
    // 배경: 먹빛 밤하늘 + 골드/제이드 빛 번짐 + 별
    c.fillStyle = '#0D1120'; c.fillRect(0, 0, W, H);
    var r1 = c.createRadialGradient(W / 2, -100, 0, W / 2, -100, 1100); r1.addColorStop(0, 'rgba(214,181,121,.16)'); r1.addColorStop(1, 'rgba(214,181,121,0)'); c.fillStyle = r1; c.fillRect(0, 0, W, H);
    var r2 = c.createRadialGradient(W, H, 0, W, H, 900); r2.addColorStop(0, 'rgba(134,201,181,.10)'); r2.addColorStop(1, 'rgba(134,201,181,0)'); c.fillStyle = r2; c.fillRect(0, 0, W, H);
    for (var i = 0; i < 120; i++) { var h = g.Reading.hash('star' + i); c.fillStyle = 'rgba(243,235,221,' + (0.25 + (h % 50) / 100) + ')'; c.beginPath(); c.arc(h % W, (h >>> 11) % H, 0.6 + (h % 5) * 0.25, 0, 7); c.fill(); }
    // 워드마크
    // 워드마크(어두운 배경용): 높이 56px(폭 약 288px), 사방 0.5X 이상 여백
    var A = g.APP_CONFIG, logo = A.wordmarkSvg ? await svgImg(A.wordmarkSvg) : null;
    if (logo) c.drawImage(logo, 90, 96, 56 * logo.naturalWidth / logo.naturalHeight, 56);
    else { c.fillStyle = '#F3EBDD'; c.font = '700 44px ' + SERIF; c.textAlign = 'left'; c.fillText(A.name, 90, 142); }
    c.textAlign = 'left';
    // 아이브로 + 별명
    c.fillStyle = '#D6B579'; c.font = '600 32px ' + SANS; c.textAlign = 'left'; c.fillText('관 상  ×  사 주  ×  성 격 유 형', 90, 290);
    // 얼팔타입 번호 + 타입 이름(한 줄에 맞춰 크기 조절) + 지금 별명(작은 줄)
    var TY = st.type;
    c.fillStyle = '#BEB7AA'; c.font = '400 46px ' + SERIF; c.fillText('나는 얼팔타입 No.' + TY.no, 90, 370);
    EIcons.draw(c, EIcons.season(TY.no), 838, 313, 116);
    c.fillStyle = '#F3EBDD'; var size = 96; c.font = '700 ' + size + 'px ' + SERIF;
    while (c.measureText(TY.name).width > 900 && size > 64) { size -= 4; c.font = '700 ' + size + 'px ' + SERIF; }
    c.fillText(TY.name, 90, 480);
    c.fillStyle = '#BEB7AA'; c.font = '400 34px ' + SANS;
    var nk = st.reading.nick; while (c.measureText(nk).width > 900 && nk.length > 4) nk = nk.slice(0, -2) + '…';
    c.fillText(nk, 90, 548);
    // 관상풀이 1~2줄(사진이 있을 때만): 얼굴형·삼정 문장의 첫 문장, 별명 아래 왼쪽 정렬
    var FS = st.face ? 0.9 : 1;
    if (st.face) {
      c.fillStyle = '#BEB7AA'; c.font = '400 30px ' + SANS; c.textAlign = 'left';
      var fl = lines(c, '사진의 비율을 묶은 ‘'+TY.imp+'한 인상’이에요.', 900);
      fl.slice(0, 2).forEach(function (l, k) { c.fillText(l, 90, 620 + k * 42); });
    }
    // 라인아트 원형(사진 대신) — 관상풀이가 들어가면 원을 0.9배로 줄이고 아래로 55px 내려 겹치지 않게
    var cx = W / 2, cy = st.face ? 1055 : 1000, R = 300 * FS;
    c.strokeStyle = 'rgba(214,181,121,.18)'; c.lineWidth = 2; c.setLineDash([6, 10]); c.beginPath(); c.arc(cx, cy, R + 40, 0, 7); c.stroke(); c.setLineDash([]);
    var rg = c.createRadialGradient(cx, cy, 0, cx, cy, R); rg.addColorStop(0, 'rgba(214,181,121,.14)'); rg.addColorStop(1, 'rgba(20,26,44,.6)'); c.fillStyle = rg; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill();
    c.strokeStyle = 'rgba(214,181,121,.55)'; c.lineWidth = 2.5; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke();
    var art = await svgImg(g.Art.face('#D6B579', '#86C9B5'));
    if (art) c.drawImage(art, cx - 200 * FS, cy - 240 * FS, 400 * FS, 480 * FS);
    c.fillStyle = 'rgba(134,201,181,.85)'; c.font = '400 24px "Noto Serif KR Hanja",serif'; c.textAlign = 'left';
    c.fillText('上停', cx - 250 * FS, cy - 90 * FS); c.fillText('中停', cx - 250 * FS, cy + 22 * FS); c.fillText('下停', cx - 250 * FS, cy + 134 * FS);
    // 3칸 정보
    var by = 1380, bw = 900, bx = 90;
    c.fillStyle = 'rgba(27,35,56,.92)'; rr(c, bx, by, bw, 200, 32); c.fill(); c.strokeStyle = 'rgba(243,235,221,.10)'; c.lineWidth = 2; c.stroke();
    var el = st.strong || st.saju.dayMaster.el;
    var cols = [['일간의 상징', T.DM[st.saju.dayMaster.stem].name, '#E8CF9B'], [st.mbtiFromFace ? '사진 추정 · 재미용' : st.mbtiFromTest ? '간단 질문 결과' : '직접 입력', st.mbti, '#F3EBDD'], ['월지의 무리', TY.season, '#86C9B5']];
    cols.forEach(function (col, k) {
      var x = bx + bw / 6 + k * bw / 3; c.textAlign = 'center';
      c.fillStyle = '#BEB7AA'; c.font = '500 28px ' + SANS; c.fillText(col[0], x, by + 66);
      c.fillStyle = col[2]; c.font = '700 66px ' + SERIF; c.fillText(col[1], x, by + 152);
      if (k) { c.strokeStyle = 'rgba(243,235,221,.10)'; c.beginPath(); c.moveTo(bx + k * bw / 3, by + 40); c.lineTo(bx + k * bw / 3, by + 160); c.stroke(); }
    });
    c.textAlign = 'center'; c.fillStyle = '#BEB7AA'; c.font = '400 24px ' + SANS;
    c.fillText(st.mbtiFromFace ? '사진 특징으로 본 추정' : st.mbtiFromTest ? '간단 질문 12개로 고른 방향' : '직접 입력한 성격유형을 사용했어요', W/2, 1615);
    // 한 줄 요약 (키워드 기반)
    c.fillStyle = '#F3EBDD'; c.font = '500 38px ' + SANS; c.textAlign = 'center';
    var sum = st.reading.tags.map(function (t) { return '#' + t; }).join('  ');
    c.fillText(sum, W / 2, 1655);
    c.fillStyle = '#BEB7AA'; c.font = '400 27px ' + SANS;
    lines(c, st.reading.summary, 900).slice(0,3).forEach(function(l,k){ c.fillText(l,W/2,1693+k*32); });
    // CTA 버튼
    var bw2 = 340, bx2 = W / 2 - bw2 / 2, by2 = 1752;
    var gg = c.createLinearGradient(0, by2, 0, by2 + 96); gg.addColorStop(0, '#E8CF9B'); gg.addColorStop(1, '#D6B579'); c.fillStyle = gg; rr(c, bx2, by2, bw2, 96, 48); c.fill();
    c.fillStyle = '#1A1408'; c.font = '700 38px ' + SANS; c.fillText('너도 해 봐  →', W / 2, by2 + 61);
    c.fillStyle = '#7F7D88'; c.font = '400 24px ' + SANS; c.fillText('재미로 보는 콘텐츠예요. 과학적 판단이나 미래 예측이 아니에요. · ' + g.APP_CONFIG.name, W / 2, 1890);
    // 출석 보상 프레임(v11): 4일차 = 타입 상징 색 테두리 + '출석 4일' 배지, 7일 완주 = 금색 테두리 + '7일 완주' 배지
    if (st.cardFrame) {
      var gold = st.cardFrame === 'gold', fc = gold ? '#E8CF9B' : TY.color;
      c.strokeStyle = fc; c.lineWidth = 10; rr(c, 10, 10, W - 20, H - 20, 56); c.stroke(); // 하단 면책 문구(1890)와 겹치지 않게 가장자리에만
      var bt = gold ? '7일 완주' : '출석 4일', bw3 = 250, bx3 = W - 90 - bw3, by3 = 92;
      c.fillStyle = gold ? 'rgba(232,207,155,.18)' : 'rgba(27,35,56,.92)'; rr(c, bx3, by3, bw3, 68, 34); c.fill(); c.strokeStyle = fc; c.lineWidth = 3; c.stroke();
      c.fillStyle = gold ? '#E8CF9B' : '#F3EBDD'; c.font = '700 32px ' + SANS; c.textAlign = 'center'; c.fillText(bt, bx3 + bw3 / 2, by3 + 46);
    }
    return canvas;
  }
  g.Card = { draw: draw };
})(window);
