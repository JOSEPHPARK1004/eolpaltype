/* 디자인팀 라인아트(가상의 얼굴 일러스트)와 아이콘. 실제 사진 대신 결과·공유 카드에 씁니다. */
(function (g) {
  function face(color, accent, labels) {
    color = color || '#D6B579'; accent = accent || '#86C9B5';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" width="100%" height="100%">' +
      '<g stroke="' + accent + '" stroke-opacity=".45" stroke-width=".8" stroke-dasharray="2 4"><path d="M14 96 H186 M14 152 H186 M100 8 V232"/></g>' +
      (labels ? '<g fill="' + accent + '" fill-opacity=".8" font-family="Noto Serif KR Hanja, serif" font-size="8"><text x="8" y="70">上停</text><text x="8" y="128">中停</text><text x="8" y="186">下停</text></g>' : '') +
      '<path d="M40 104 C40 58 66 32 100 32 C138 32 160 58 160 104 C150 74 128 60 104 64 C86 66 70 58 62 48 C56 64 46 80 40 104 Z" fill="' + color + '" fill-opacity=".10" stroke="' + color + '" stroke-width="1.28" stroke-linejoin="round"/>' +
      '<path d="M100 26 C146 26 164 68 163 116 C162 168 133 210 100 214 C67 210 38 168 37 116 C36 68 54 26 100 26 Z" fill="none" stroke="' + color + '" stroke-width="1.6"/>' +
      '<g fill="none" stroke="' + color + '" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M62 101 Q76 93 90 99 M110 99 Q124 93 138 101"/><path d="M64 116 Q77 108 90 116 Q77 121 64 116 Z M110 116 Q123 108 136 116 Q123 121 110 116 Z"/><path d="M100 116 L96 150 Q100 156 107 152"/><path d="M83 174 Q100 168 117 174 Q100 184 83 174 Z M83 174 L117 174"/></g>' +
      '<g fill="' + accent + '"><circle cx="77" cy="115" r="2"/><circle cx="123" cy="115" r="2"/><circle cx="100" cy="150" r="2"/><circle cx="100" cy="176" r="2"/><circle cx="64" cy="116" r="2"/><circle cx="136" cy="116" r="2"/><circle cx="83" cy="174" r="2"/><circle cx="117" cy="174" r="2"/><circle cx="100" cy="214" r="2"/><circle cx="52" cy="160" r="2"/><circle cx="148" cy="160" r="2"/><circle cx="100" cy="100" r="2"/></g></svg>';
  }
  var logo = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none"><circle cx="12" cy="12" r="10.5" stroke="#D6B579" stroke-width="1.2"/><path d="M12 1.5a10.5 10.5 0 0 1 0 21 5.25 5.25 0 0 1 0-10.5 5.25 5.25 0 0 0 0-10.5Z" fill="#D6B579" fill-opacity=".9"/><circle cx="12" cy="6.75" r="1.4" fill="#0D1120"/><circle cx="12" cy="17.25" r="1.4" fill="#D6B579"/></svg>';
  var lock = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#86C9B5" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  g.Art = { face: face, logo: logo, lock: lock };
})(window);
