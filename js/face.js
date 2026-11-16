/* 관상 분석 — face-api.js(MIT)로 브라우저 안에서만 얼굴 랜드마크 68점을 찾고,
 * 비율을 계산해 규칙 기반 문장으로 바꿉니다. 사진은 어디에도 업로드·저장되지 않습니다. */
(function (g) {
  var ready = null;
  function b64ToBuf(b64) { var s = atob(b64), u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; }
  function loadNet(net, prefix) {
    var M = g.FACE_MODELS, manifest = JSON.parse(M[prefix + '-weights_manifest.json'].d);
    var bufs = manifest[0].paths.map(function (p) { return new Uint8Array(b64ToBuf(M[p].d)); });
    var total = bufs.reduce(function (a, b) { return a + b.length; }, 0), all = new Uint8Array(total), o = 0;
    bufs.forEach(function (b) { all.set(b, o); o += b.length; });
    var specs = [].concat.apply([], manifest.map(function (m) { return m.weights; }));
    net.loadFromWeightMap(faceapi.tf.io.decodeWeights(all.buffer, specs));
  }
  function init() {
    if (!ready) ready = (async function () {
      try { await faceapi.tf.setBackend('webgl'); } catch (e) { await faceapi.tf.setBackend('cpu'); }
      await faceapi.tf.ready();
      loadNet(faceapi.nets.tinyFaceDetector, 'tiny_face_detector_model');
      loadNet(faceapi.nets.faceLandmark68Net, 'face_landmark_68_model');
      return true;
    })();
    return ready;
  }

  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function avg(pts) { var x = 0, y = 0; pts.forEach(function (p) { x += p.x; y += p.y; }); return { x: x / pts.length, y: y / pts.length }; }

  // 이마 위 헤어라인을 색 변화로 추정(68점에는 이마 윗선이 없음)
  function findHairline(img, P, browY, mid) {
    try {
      var c = document.createElement('canvas'); c.width = img.naturalWidth || img.width; c.height = img.naturalHeight || img.height;
      var ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
      var cx = Math.round(P[27].x), startY = Math.round(browY - 0.15 * mid), stopY = Math.max(0, Math.round(browY - 1.6 * mid));
      function row(y) { var d = ctx.getImageData(cx - 3, y, 7, 1).data, r = 0, gg = 0, b = 0; for (var i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; } return [r / 7, gg / 7, b / 7]; }
      var ref = [0, 0, 0]; for (var k = 0; k < 5; k++) { var r0 = row(startY - k); ref[0] += r0[0] / 5; ref[1] += r0[1] / 5; ref[2] += r0[2] / 5; }
      var run = 0;
      for (var y = startY - 5; y > stopY; y--) {
        var p = row(y), dd = Math.hypot(p[0] - ref[0], p[1] - ref[1], p[2] - ref[2]);
        if (dd > 55) { run++; if (run >= 4) return { y: y + 4, found: true }; } else run = 0;
      }
    } catch (e) { }
    return { y: browY - mid, found: false };
  }

  function measure(img, lm) {
    var raw = lm.positions.map(function (p) { return { x: p.x, y: p.y }; });
    // 두 눈 중심이 수평이 되도록 회전 정규화
    var le = avg(raw.slice(36, 42)), re = avg(raw.slice(42, 48));
    var ang = Math.atan2(re.y - le.y, re.x - le.x), c = Math.cos(-ang), s = Math.sin(-ang), o = avg([le, re]);
    var P = raw.map(function (p) { var dx = p.x - o.x, dy = p.y - o.y; return { x: o.x + dx * c - dy * s, y: o.y + dx * s + dy * c }; });
    var faceW = dist(P[0], P[16]), jawW = dist(P[4], P[12]);
    var browY = (P[19].y + P[24].y) / 2, noseY = P[33].y, chinY = P[8].y;
    var mid = noseY - browY, low = chinY - noseY;
    var hl = findHairline(img, raw, (raw[19].y + raw[24].y) / 2, mid);
    var up = Math.max(0.5 * mid, Math.min(1.6 * mid, ((raw[19].y + raw[24].y) / 2) - hl.y));
    var faceH = up + mid + low;
    var eyeW = (dist(P[36], P[39]) + dist(P[42], P[45])) / 2;
    var eyeH = ((dist(P[37], P[41]) + dist(P[38], P[40])) / 2 + (dist(P[43], P[47]) + dist(P[44], P[46])) / 2) / 2;
    var tilt = (((P[39].y - P[36].y) + (P[42].y - P[45].y)) / 2) / eyeW;
    var noseW = dist(P[31], P[35]), mouthW = dist(P[48], P[54]);
    var lips = (P[57].y - P[51].y) / mouthW;
    var cornerLift = (((P[62].y + P[66].y) / 2) - ((P[48].y + P[54].y) / 2)) / mouthW;
    var browLen = (dist(P[17], P[21]) + dist(P[22], P[26])) / 2 / eyeW;
    var browGap = (((P[37].y + P[38].y + P[43].y + P[44].y) / 4) - browY) / eyeW;
    return {
      hairFound: hl.found,
      ratio: { hw: faceH / faceW, jaw: jawW / faceW, up: up / faceH, mid: mid / faceH, low: low / faceH,
        eye: eyeH / eyeW, inter: dist(P[39], P[42]) / eyeW, tilt: tilt, nose: noseW / faceW, mouth: mouthW / noseW,
        lips: lips, corner: cornerLift, brow: browLen, browGap: browGap },
      points: raw
    };
  }

  function read(m) {
    var r = m.ratio, out = [], tags = [];
    function add(part, title, text, tag) { out.push({ part: part, title: title, text: text }); if (tag) tags.push(tag); }
    // 얼굴형
    var shape;
    if (r.hw >= 1.55) shape = ['긴 얼굴형', '이마에서 턱까지 길게 뻗은 얼굴형은 생각이 깊고 계획적인 인상을 줘요. 한 분야를 오래 파고드는 전문가 기질로 봐요.', '분석'];
    else if (r.jaw >= 0.88 && r.hw < 1.4) shape = ['각진 얼굴형', '턱선이 또렷한 얼굴형은 의지와 실행력이 강한 상으로 봐요. 어려운 일도 끝까지 밀고 나가는 뚝심이 있어요.', '추진'];
    else if (r.hw < 1.28) shape = ['둥근 얼굴형', '둥근 얼굴형은 원만하고 친화력이 좋은 상으로 봐요. 처음 보는 사람도 편하게 다가오는 인상이에요.', '공감'];
    else if (r.jaw < 0.78) shape = ['역삼각 얼굴형', '이마와 광대가 넓고 턱이 갸름한 얼굴형은 감각과 아이디어가 뛰어난 상으로 봐요.', '직관'];
    else shape = ['계란형 얼굴', '균형 잡힌 계란형은 조화와 센스를 상징해요. 어디서나 무난하게 어울리고 호감을 얻기 쉬운 인상이에요.', '표현'];
    add('얼굴형', shape[0], shape[1], shape[2]);
    // 삼정
    var z = [['상정(이마)', r.up, '이마 부분이 넓어 생각과 계획이 앞서는 상이에요. 관상에서는 초년운과 학습 능력을 보는 자리예요.', '직관'],
             ['중정(눈썹~코끝)', r.mid, '눈썹부터 코끝까지가 발달해 사회 활동과 추진력이 강한 상이에요. 관상에서는 중년의 활약을 보는 자리예요.', '추진'],
             ['하정(코끝~턱)', r.low, '코끝부터 턱까지가 발달해 끈기와 실속이 있는 상이에요. 관상에서는 말년의 안정을 보는 자리예요.', '안정']];
    var top = z.slice().sort(function (a, b) { return b[1] - a[1]; })[0];
    var pct = z.map(function (x) { return Math.round(x[1] * 100); });
    if (top[1] < 0.37) add('삼정', '삼정 균형형 (' + pct.join(' : ') + ')', '이마, 코, 턱의 길이가 고르게 나뉘어 있어요. 관상에서는 초년, 중년, 말년의 운이 고르게 흐르는 균형 잡힌 상으로 봐요.', '안정');
    else add('삼정', top[0] + ' 발달 (' + pct.join(' : ') + ')', top[2], top[3]);
    // 눈
    if (r.eye < 0.27) add('눈', '길고 깊은 눈매', '길고 깊은 눈매는 신중하고 관찰력이 좋은 상이에요. 속마음을 쉽게 드러내지 않고 상황을 먼저 살펴요.', '분석');
    else if (r.eye > 0.36) add('눈', '또렷하고 맑은 눈', '또렷하고 맑은 눈은 감수성과 표현력이 풍부한 상이에요. 감정이 눈빛으로 잘 전해져요.', '공감');
    else add('눈', '균형 잡힌 눈', '눈의 가로세로 비율이 균형 잡혀 있어 판단과 감정의 밸런스가 좋은 상이에요.', null);
    if (r.tilt > 0.07) add('눈꼬리', '살짝 올라간 눈꼬리', '눈꼬리가 올라간 눈은 결단력과 승부욕이 있는 상으로 봐요.', '추진');
    else if (r.tilt < -0.04) add('눈꼬리', '살짝 내려간 눈꼬리', '눈꼬리가 내려간 눈은 부드럽고 다정한 인상을 줘서 사람이 잘 따르는 상이에요.', '공감');
    if (r.inter > 1.15) add('미간', '여유로운 미간', '미간이 넓으면 마음이 너그럽고 여유가 있는 상으로 봐요.', '안정');
    else if (r.inter < 0.9) add('미간', '집중형 미간', '미간이 좁으면 집중력이 강하고 섬세한 상으로 봐요.', '분석');
    // 눈썹
    if (r.brow > 1.45) add('눈썹', '길게 뻗은 눈썹', '눈썹이 길게 뻗어 있으면 인복이 있고 형제·친구의 도움을 받는 상으로 봐요.', '리더십');
    else add('눈썹', '단정한 눈썹', '단정한 길이의 눈썹은 자기 관리가 좋고 독립심이 강한 상이에요.', null);
    if (r.browGap > 0.95) add('눈썹-눈 사이', '넓은 전택궁', '눈썹과 눈 사이(전택궁)가 넓어 마음이 넉넉하고 여유로운 상이에요.', '안정');
    else if (r.browGap < 0.6) add('눈썹-눈 사이', '좁은 전택궁', '눈썹과 눈 사이가 가까워 반응이 빠르고 열정적인 상이에요.', '추진');
    // 코
    if (r.nose > 0.29) add('코', '든든한 콧방울', '콧방울이 든든하면 재물을 모으고 지키는 힘이 있는 상으로 봐요.', '안정');
    else if (r.nose < 0.23) add('코', '날렵한 코', '날렵한 코는 자존심과 미적 감각이 뛰어난 상이에요.', '분석');
    else add('코', '균형 잡힌 코', '얼굴과 조화로운 코는 자기중심이 잘 잡힌 상으로 봐요.', null);
    // 입
    if (r.mouth > 1.75) add('입', '시원한 입매', '입매가 시원하면 포부가 크고 말에 힘이 있어 사람을 모으는 상이에요.', '리더십');
    else if (r.mouth < 1.35) add('입', '단정한 입매', '단정한 입매는 신중하고 말을 아끼는 상이에요. 한마디의 무게가 커요.', '분석');
    else add('입', '균형 잡힌 입', '얼굴과 조화로운 입은 말과 행동이 일치하는 상으로 봐요.', null);
    if (r.lips > 0.33) add('입술', '도톰한 입술', '입술이 도톰하면 정이 많고 사람을 아끼는 상이에요.', '공감');
    if (r.corner > 0.02) add('입꼬리', '올라간 입꼬리', '입꼬리가 올라가 있으면 밝은 기운이 사람과 기회를 부르는 상으로 봐요.', '표현');
    return { shape: shape[0], items: out, tags: tags, sam: pct };
  }

  async function analyze(img) {
    await init();
    var det = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.45 })).withFaceLandmarks();
    if (!det) return null;
    var m = measure(img, det.landmarks);
    var res = read(m);
    res.box = det.detection.box; res.points = m.points; res.ratio = m.ratio; res.hairFound = m.hairFound; res.score = det.detection.score;
    return res;
  }

  g.Face = { init: init, analyze: analyze };
})(window);
