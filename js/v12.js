/* v12: 네트워크 없는 타입 궁합. 사진·생일은 링크/지도에 넣지 않음. */
(function () {
  'use strict';
  var A = window.EolpalPreview, $ = function (id) { return document.getElementById(id); };
  var KEY = 'eolpal_map_v1', preview = location.protocol === 'file:' || new URLSearchParams(location.search).get('demo') === '1';
  var target = null, targetNick = '', mine = null, pair = null, lastFocus = null;
  var labels = ['항해 메이트', '낮과 밤 짝꿍', '수다 연료통', '고요한 공명', '취향 탐험대', '리듬 조율사', '반짝 아이디어팀', '차곡차곡 동행'];
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  function num(v) { return /^\d{1,2}$/.test(String(v)) && +v >= 1 && +v <= 32 ? +v : null; }
  function nick(v) { return String(v || '').replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, 10); }
  function type(n) {
    n = num(n); if (!n) return null;
    var t = Reading.allTypes()[n - 1], i = (n - 1) % 8;
    return Object.assign({}, t, { season: ['바람','불','땅','물'][(n - 1) >> 3], imp: i >= 4 ? '포근' : '또렷', outer: !(i & 2), heart: !!(i & 1), color: ['#8FD3BE','#F2876A','#D8AE6E','#79AEE6'][(n - 1) >> 3], emblem: EIcons.emblem(n) });
  }
  // 대칭인 타입 조합 해시를 분산. 점수는 진단이 아닌 오락용 수치예요.
  function entertainmentScore(lo,hi,sameS,sameI){
    var h=Reading.hash('eolpal-v12b:'+lo+':'+hi);
    h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;h=Math.imul(h,0x846ca68b);h^=h>>>16;h=h>>>0;
    var u=(h&65535)/65535,v=(h>>>16)/65535;
    return Math.max(58,Math.min(98,Math.round(58+20*(u+v)+(sameS?1.5:-.5)+(sameI?.75:-.75))));
  }
  function compat(a, b) {
    var x = type(a), y = type(b); if (!x || !y) return null;
    var sameS = x.season === y.season, sameI = x.imp === y.imp, sameE = x.outer === y.outer, sameH = x.heart === y.heart;
    var index = (sameI ? 0 : 4) + (sameE ? 0 : 2) + (sameH ? 0 : 1), lo = Math.min(+a,+b), hi = Math.max(+a,+b);
    var same = x.no === y.no;
    return { a: x, b: y, same: same, label: labels[index], index: index, score: entertainmentScore(lo,hi,sameS,sameI),
      good: (same ? '나와 같은 ' + x.name + '! 좋아하는 속도와 반응이 닮아 말하지 않아도 알아채는 순간이 많아요.' : sameS ? '둘 다 ' + x.season + ' 무리라 같은 기운 안에서 서로 다른 개성을 보여 줘요.' : x.season + ' 무리와 ' + y.season + ' 무리가 만나 서로에게 없는 기운을 나눠요.') + ' ' + (sameI ? '인상도 ' + x.imp + '한 쪽이라 첫 대화가 편해질 수 있어요.' : '또렷함과 포근함을 한 팀에 담은 조합이에요.'),
      gap: (sameE ? (x.outer ? '둘 다 하고 싶은 말이 많을 수 있어요. 한 명씩 이야기하는 순서를 정해 봐요.' : '둘 다 먼저 연락을 기다릴 수 있어요. 번갈아 안부 담당을 해 봐요.') : '바깥 활동과 혼자 쉬는 시간의 양이 달라요. 약속 뒤에 각자의 충전 시간을 남겨 봐요.') + ' ' + (sameH ? '비슷한 판단도 정답은 아니니 상대의 생각을 한 번 더 물어봐요.' : '해결책이 필요한지 공감이 필요한지 먼저 물으면 대화가 가벼워져요.'),
      activity: (sameH ? (x.heart ? '서로에게 최근 고마웠던 일 하나씩 적어 주기.' : '반나절 여행을 함께 계획하고 역할 하나씩 맡기.') : '한 명은 코스를, 한 명은 분위기를 고르는 취향 산책.') + ' ' + (sameS ? '늘 가던 곳에서 서로 다른 메뉴를 골라 봐요.' : '서로의 동물이 좋아할 만한 장소를 하나씩 골라 번갈아 가 봐요.') };
  }
  function load() {
    try { var d = JSON.parse(localStorage.getItem(KEY));
      if (!d || d.v !== 1 || !num(d.owner) || !Array.isArray(d.friends)) return null;
      return { v: 1, owner: +d.owner, friends: d.friends.filter(function (f) { return f && num(f.type); }).slice(0,80).map(function (f) { return { type: +f.type, nick: nick(f.nick) }; }) };
    } catch (_) { return null; }
  }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); return true; } catch (_) { A.toast('이 브라우저는 저장을 막고 있어요. 저장 설정을 확인해 주세요.'); return false; } }
  function clear() { try { localStorage.removeItem(KEY); } catch (_) {} mine = null; target = null; pair = null; $('vNav').classList.add('hidden'); ['vLink','vReply'].forEach(close); }
  function myNo() { return mine || (A.state.type && A.state.type.no) || (load() && load().owner); }
  function link(o) { var u = new URL(location.href); u.search = ''; u.hash = ''; Object.keys(o).forEach(function (k) { if (o[k] !== '' && o[k] != null) u.searchParams.set(k,o[k]); }); return u.href; }
  function node(tag, props, html, into) { var e = document.createElement(tag); Object.keys(props || {}).forEach(function (k) { e.setAttribute(k, props[k]); }); if (html) e.innerHTML = html; (into || $('app')).appendChild(e); return e; }
  function screen(id) { var e = node('section', {id: id, class:'screen v-screen', 'data-back':'s-result'}); $('app').insertBefore(e,document.querySelector('footer.legal.global')); return e; }
  function btn(id, text, primary) { return '<button type="button" class="btn ' + (primary ? 'primary' : 'secondary') + '" id="' + id + '">' + text + '</button>'; }
  function disc() { return '<p class="v-disc">재미로 보는 콘텐츠예요. 과학적 판단이나 미래 예측이 아니에요.<br>점수는 두 타입의 조합으로 정한 오락용 숫자이며 관계의 우열이 아니에요.</p>'; }
  function storageNote() { return '<p class="v-privacy">이 기기 지도 키 <b>eolpal_map_v1</b>에는 내 타입 번호와 친구 타입 번호·선택 별명만 남아요. 사진·생년월일은 저장하지 않아요. 같은 브라우저 사용자도 볼 수 있고, 브라우저 설정에 따라 사라질 수 있어요. 개별 삭제·전체 삭제가 가능해요.</p>'; }
  ['v-landing','v-compat','v-map','v-type'].forEach(screen);
  document.querySelector('#infoForm .label').childNodes[0].textContent='별명 (선택) ';
  var modalHTML = '<div class="sheet v-sheet" tabindex="-1"></div>';
  node('div',{id:'vLink',class:'modal hidden',role:'dialog','aria-modal':'true','aria-label':'궁합 링크 만들기'},modalHTML,document.body);
  node('div',{id:'vReply',class:'modal hidden',role:'dialog','aria-modal':'true','aria-label':'답장 링크 확인'},modalHTML,document.body);
  node('nav',{id:'vNav',class:'v-nav hidden','aria-label':'주 메뉴'},[['type','face','내 타입'],['map','map','궁합'],['fortune','fortune','운세'],['attend','attend','출석']].map(function (x) { return '<button type="button" data-vtab="'+x[0]+'"><b aria-hidden="true">'+EIcons.svg(x[1])+'</b>'+x[2]+'</button>'; }).join(''),document.body);
  function open(id) { lastFocus = document.activeElement; $(id).classList.remove('hidden'); document.body.classList.add('v-modal-open'); $(id).querySelector('.sheet').focus(); }
  function close(id) { $(id).classList.add('hidden'); if (!document.querySelector('.modal:not(.hidden)')) document.body.classList.remove('v-modal-open'); if (lastFocus && lastFocus.isConnected) lastFocus.focus(); }
  document.addEventListener('keydown',function (e) {
    var m = document.querySelector('#vLink:not(.hidden),#vReply:not(.hidden)'); if (!m) return;
    if(e.key==='Escape') close(m.id);
    if(e.key==='Tab') { var f=Array.from(m.querySelectorAll('button,input,textarea')).filter(function(x){return !x.disabled;}); var i=f.indexOf(document.activeElement); if(e.shiftKey && i<=0){e.preventDefault();f[f.length-1].focus();}else if(!e.shiftKey && i===f.length-1){e.preventDefault();f[0].focus();} }
  });
  async function copy(text) {
    try { if(navigator.clipboard && isSecureContext) { await navigator.clipboard.writeText(text); A.toast('링크를 복사했어요'); return; } } catch (_) {}
    var ta=node('textarea',{'aria-label':'복사할 링크'},'',document.body); ta.value=text; ta.select(); var ok=false; try { ok=document.execCommand('copy'); } catch(_){} ta.remove(); A.toast(ok?'링크를 복사했어요':'복사가 막혀 있어요. 링크 칸에서 직접 복사해 주세요.');
  }
  async function share(url) { if(location.protocol==='file:'){ A.toast('이 주소는 이 기기 전용이에요. 미리보기용 친구 테스트를 이용해 주세요.'); return; } if(navigator.share) { try{ await navigator.share({title:'얼팔타입 · 우리 둘의 궁합',text:'우리 타입은 어떤 조합일까요? 재미로 같이 봐요.',url:url}); }catch(e){if(e.name!=='AbortError') A.toast('공유가 어려워요. 링크 복사를 이용해 주세요.');} }else copy(url); }
  function makeLink(reply) {
    var n=myNo(); if(!n) return A.toast('먼저 내 타입을 만들어 주세요.');
    var host=$('vLink').querySelector('.sheet'); host.innerHTML='<div class="v-sheet-head"><p class="eyebrow">'+(reply?'우리 둘의 궁합 답장':'친구에게 보내는 초대장')+'</p><button class="iconbtn" id="vLinkClose" aria-label="닫기">×</button></div><h2 class="h2">'+(reply?'답장 링크 보내기':'내 궁합 링크 만들기')+'</h2><p class="body">'+(reply?'친구가 이 링크를 열고 직접 추가하면 지도에 남아요.':'친구가 자기 타입을 만들면 우리 둘의 궁합이 나와요.')+'</p><div class="v-notice">링크에는 타입 번호'+(reply?' 두 개':'')+'와 처음 적은 이름만 담겨요. 이름을 비워 두면 타입 이름만 보여요. 사진·생년월일은 담지 않아요. <b>링크를 가진 누구나 타입과 이름을 볼 수 있어요.</b> 다른 곳에 전달되거나 주소 기록에 남을 수 있어요.</div><label class="label" for="vLinkValue">'+(location.protocol==='file:'?'이 기기에서만 열리는 주소':'공유 주소')+'</label><textarea id="vLinkValue" rows="2" class="field v-url" readonly></textarea><div class="v-row">'+btn('vCopy','링크 복사',true)+btn('vShare','공유하기',false)+'</div>'+(preview?'<div class="v-demo-box"><b>미리보기 전용 · 다른 사람에게 열리지 않아요</b><p>공개 배포 전이므로 아래 버튼으로 한 기기에서 흐름을 시험해요.</p>'+btn('vDemoNext',reply?'미리보기용 답장 열기':'미리보기용 친구 테스트',false)+'</div>':'')+'<p class="v-disc">만 14세 이상만 이용할 수 있어요 · '+(reply?'자동으로 지도에 저장되지 않아요':'링크를 만들어도 지도에 자동 저장되지 않아요')+'</p>';
    var name=nick(A.state && A.state.name);
    function update(){ var o=reply?{r:target,f:n,fn:name}:{t:n,n:name}; $('vLinkValue').value=link(o); }
    update(); $('vLinkClose').onclick=function(){close('vLink');}; $('vCopy').onclick=function(){copy($('vLinkValue').value);}; $('vShare').onclick=function(){share($('vLinkValue').value);};
    if(preview) $('vDemoNext').onclick=function(){close('vLink');if(reply) receive(target,n,name);else landing(n,name);};
    open('vLink');
  }
  function landing(n,name) {
    target=num(n); targetNick=nick(name); mine=null;
    var t=type(n); if(!t) return;
    $('v-landing').innerHTML='<p class="eyebrow">친구가 보낸 타입 초대장</p><div class="v-orbit-art"><span><svg class="e-icon e-icon-sparkle" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><path d="M32 8L37 25L54 32L37 39L32 56L27 39L10 32L27 25Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M47 10V18M43 14H51" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span><b>'+t.emblem+'</b><span><svg class="e-icon e-icon-connect" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><path d="M36 32A14 14 0 1 1 8 32A14 14 0 1 1 36 32Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M56 32A14 14 0 1 1 28 32A14 14 0 1 1 56 32Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 27L38 37M26 37L38 27" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div><h1 class="h1">'+esc(targetNick||t.name)+' 타입과<br>나는 어떤 궁합일까?</h1><div class="card"><p class="eyebrow">친구의 타입 · '+n+'번</p><h2 class="h2">'+esc(t.name)+'</h2><p class="p">'+esc(t.desc)+'</p></div><p class="body">내 생일과 성격유형으로 두 사람의 조합을 만들어요. 사진은 선택이에요.</p>'+btn('vFriendStart','내 타입으로 궁합 보기',true)+(preview?'<div class="v-demo-box">미리보기 전용 · 가상 타입으로 바로 시험할 수 있어요.'+btn('vExampleFriend','가상 친구 타입으로 시험',false)+'</div>':'')+'<p class="v-privacy">생년월일·사진은 기기 안에서만 계산하고 저장하지 않아요. 링크에는 타입 번호와 처음 적은 이름만 들어가요. 만 14세 이상만 이용할 수 있어요.</p>'+disc();
    A.go('v-landing'); $('vNav').classList.add('hidden'); $('vFriendStart').onclick=function(){document.body.classList.add('v-friend-input');A.go('s-info');};
    if(preview) $('vExampleFriend').onclick=function(){mine=(n+10)%32+1;showCompat(n,mine,targetNick,'');};
  }
  function renderType() {
    if(A.state.type && A.state.type.no===myNo()){ A.go('s-result'); return; }
    var t=type(myNo()); if(!t){ target=null; A.go('s-home'); return; }
    $('v-type').innerHTML='<p class="eyebrow">이 기기에 남긴 타입 번호</p><div class="card v-type-card"><span class="v-type-glyph">'+t.emblem+'</span><p class="eyebrow">얼팔타입 · '+t.no+'번</p><h1 class="h1">'+t.name+'</h1><p class="p">'+t.desc+'</p></div>'+btn('vSavedLink','내 궁합 링크 만들기',true)+'<div class="card"><p class="p">생년월일·사진·자세한 결과는 보관하지 않아요. 운세와 상세 풀이를 다시 보려면 내 정보를 새로 입력해 주세요.</p>'+btn('vReenter','내 정보 다시 입력하기',false)+'</div>'+disc();
    A.go('v-type'); $('vSavedLink').onclick=function(){makeLink(false);};$('vReenter').onclick=reenter;
  }
  function reenter(){target=null;document.body.classList.remove('v-friend-input');A.go('s-info');}
  function showCompat(a,b,an,bn) {
    var c=compat(a,b); if(!c) return; pair={a:+a,b:+b,an:nick(an),bn:nick(bn),c:c};
    $('v-compat').innerHTML='<p class="eyebrow">우리 둘의 조합 · 오락용 타입 궁합</p><div class="card v-pair-card"><div class="v-pair-icons"><span>'+c.a.emblem+'</span><b><svg class="e-icon e-icon-connect" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><path d="M36 32A14 14 0 1 1 8 32A14 14 0 1 1 36 32Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M56 32A14 14 0 1 1 28 32A14 14 0 1 1 56 32Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 27L38 37M26 37L38 27" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></b><span>'+c.b.emblem+'</span></div>'+(c.same?'<p class="v-same">'+EIcons.svg('sparkle')+'나와 같은 동물을 찾았어요</p>':'')+'<h1 class="h1">'+c.label+'</h1><p class="v-pair-names">'+esc(an||c.a.name)+' × '+esc(bn||c.b.name)+'</p><div class="v-score">'+c.score+'<small>점</small></div><p class="cap">'+(c.score<65?'새로운 박자를 찾는 조합 · 다름은 대화의 재료예요':'높고 낮음보다 서로 다른 재미를 찾아요')+'</p></div><div class="v-mini-grid"><div>'+c.a.no+'번 · '+c.a.season+' '+c.a.name+'<br>'+c.a.imp+' · '+(c.a.outer?'바깥':'안쪽')+'·'+(c.a.heart?'마음':'이성')+'</div><div>'+c.b.no+'번 · '+c.b.season+' '+c.b.name+'<br>'+c.b.imp+' · '+(c.b.outer?'바깥':'안쪽')+'·'+(c.b.heart?'마음':'이성')+'</div></div>'+[['잘 맞는 점',c.good],['살짝 엇갈리는 점',c.gap],['함께하면 좋은 것',c.activity]].map(function(x,i){return '<div class="card v-reading"><p class="eyebrow">0'+(i+1)+' · '+x[0]+'</p><p class="p">'+esc(x[1])+'</p></div>';}).join('')+'<div class="v-row">'+btn('vCompatSave','궁합 카드 저장',false)+btn('vReplyLink','답장 링크 보내기',true)+'</div>'+btn('vOwnLink','나도 내 링크 만들기',false)+btn('vBackMap','내 궁합 지도 보기',false)+disc()+'<canvas id="vCard" width="1080" height="1920" hidden></canvas><img class="v-card-preview hidden" id="vCardPreview" alt="저장할 궁합 카드">';
    A.go('v-compat'); $('vCompatSave').onclick=saveCard;
    $('vOwnLink').onclick=function(){makeLink(false);};
    $('vReplyLink').classList.toggle('hidden',myNo()!==pair.b);
    $('vReplyLink').onclick=function(){var owner=pair.a,friend=pair.b; target=owner;mine=friend;makeLink(true);};
    $('vBackMap').onclick=renderMap;
  }
  function receive(owner,friend,name) {
    owner=num(owner);friend=num(friend);if(!owner||!friend)return A.toast('답장 링크의 타입 번호를 확인해 주세요.');
    var t=type(friend), existing=load(), conflict=existing && existing.owner!==owner;
    $('vReply').querySelector('.sheet').innerHTML='<p class="eyebrow">궁합 답장이 도착했어요</p><h2 class="h2">'+esc(name||t.name)+'</h2><p class="body">내 '+owner+'번 타입과 친구 '+friend+'번 타입의 조합이에요.</p><p class="v-notice">링크는 본인 인증이 아니며 수정될 수 있어요. 내 타입 번호가 '+owner+'번인지 확인해 주세요. 아래 버튼을 눌러야 지도에 저장돼요.</p>'+storageNote()+'<label class="check"><input id="vMapConsent" type="checkbox"><i></i>만 14세 이상이며, 이 기기 저장 내용을 확인했어요.</label>'+(conflict?'<label class="check"><input id="vMapReplace" type="checkbox"><i></i>기존 '+existing.owner+'번 지도를 지우고 '+owner+'번 지도로 바꿀게요.</label>':'')+'<div class="v-row">'+btn('vReplyCancel','저장 안 할래요',false)+btn('vMapAdd','지도에 추가',true)+'</div><p class="cap" id="vAddError" role="status"></p>';
    $('vMapAdd').onclick=function(){if(!$('vMapConsent').checked)return $('vAddError').textContent='만 14세 이상 및 저장 내용 확인이 필요해요.';if(conflict&&!$('vMapReplace').checked)return $('vAddError').textContent='기존 지도 교체 여부를 확인해 주세요.';
      var d=load(); if(!d||d.owner!==owner)d={v:1,owner:owner,friends:[]}; var clean=nick(name);
      if(d.friends.some(function(f){return f.type===friend&&f.nick===clean;}))return $('vAddError').textContent='같은 타입·별명의 답장이 이미 있어요.';
      if(d.friends.length>=80)return $('vAddError').textContent='이 지도에는 80명까지 담을 수 있어요. 먼저 한 명을 지워 주세요.';
      d.friends.push({type:friend,nick:clean});if(!save(d))return;mine=owner;target=null;close('vReply');cleanAddress();renderMap();A.toast('지도에 친구를 추가했어요');
    };$('vReplyCancel').onclick=function(){close('vReply');cleanAddress();};open('vReply');
  }
  function cleanAddress(){try{history.replaceState(null,'',location.pathname);}catch(_){} }
  function daily(d) {
    if(!d || !d.friends.length) return '<p class="p">첫 답장을 지도에 담으면 오늘의 궁합 한 마디가 열려요.</p>';
    var now=new Date(), key=now.getFullYear()+'-'+(now.getMonth()+1)+'-'+now.getDate(),h=Reading.hash(key),f=d.friends[h%d.friends.length],c=compat(d.owner,f.type);
    var lines=['오늘은 “요즘 뭐가 제일 재미있어?” 하고 물어봐요.','이모지 하나 대신 짧은 안부 한 줄을 보내 봐요.','다음에 같이 해 볼 일 하나를 골라 봐요.','최근 웃었던 순간 하나씩 나눠 봐요.','말없이 듣는 시간도 멋진 대화예요.'];
    return '<p class="p"><b>'+esc(f.nick||type(f.type).name)+'</b> · '+c.label+'</p><p class="p">'+lines[(h>>>4)%lines.length]+'</p><p class="cap">매일 한 번 바뀌는 가벼운 대화 제안이에요</p>';
  }
  function renderMap(){
    var d=load(),owner=myNo()||(d&&d.owner);if(!owner){A.toast('내 타입을 먼저 만들면 지도를 볼 수 있어요.');A.go('s-home');return;}
    if(d&&d.owner!==owner)d=null;
    var friends=d?d.friends:[],count=friends.length,tier=count>=15?'동물 대행진':count>=7?'동물 원정대':count>=3?'작은 동물 무리':'첫 만남의 가지',next=count<3?3:count<7?7:count<15?15:null;
    var ranked=friends.map(function(f,i){return {f:f,i:i,c:compat(owner,f.type)};}).sort(function(a,b){return b.c.score-a.c.score||a.i-b.i;});
    ranked.forEach(function(x,i){x.rank=i+1;});
    var groups=[];labels.forEach(function(label,k){var list=ranked.filter(function(x){return x.c.index===k;});if(list.length)groups.push({label:label,index:k,list:list,best:list[0].c.score,avg:list.reduce(function(s,x){return s+x.c.score;},0)/list.length});});
    groups.sort(function(a,b){return b.best-a.best||b.avg-a.avg||a.index-b.index;});
    var kinds=new Set(friends.map(function(f){return f.type;})).size,sameCount=friends.filter(function(f){return f.type===owner;}).length;
    var groupIcons=['connect','fortune','talk','inner','leaf','sharp','sparkle','reason'];
    function person(x,localRank){return '<div class="e-chart-person"><button data-friend="'+x.i+'" class="e-person-open" aria-label="'+esc(x.f.nick||type(x.f.type).name)+' 궁합 보기"><span class="e-rank" aria-label="전체 '+x.rank+'위">'+EIcons.svg('rank')+'<b>'+x.rank+'</b></span><span class="e-person-emblem">'+EIcons.emblem(x.f.type)+'</span><span class="e-person-text"><b>'+esc(x.f.nick||('친구 '+(x.i+1)))+'</b><small>'+esc(type(x.f.type).season+' · '+type(x.f.type).name)+' · '+x.f.type+'번</small>'+(x.f.type===owner?'<small class="e-same">나와 같은 동물</small>':'')+'<small class="e-group-rank">그룹 '+localRank+'위 · 전체 '+x.rank+'위</small></span><strong class="e-person-score">'+x.c.score+'<small>점</small></strong></button><button data-delete="'+x.i+'" class="e-delete" aria-label="'+esc(x.f.nick||'친구')+' 삭제">삭제</button></div>';}
    $('v-map').innerHTML='<div class="v-map-head"><div><p class="eyebrow">친구와 쌓는 우리 이야기</p><h1 class="h1">내 궁합 지도</h1></div><span class="v-count">'+count+'명</span></div><div class="v-tier"><b>'+tier+'</b><span>'+(next?next+'명까지 '+(next-count)+'명':'새로운 조합을 계속 발견해요')+'</span><div><i style="width:'+Math.min(100,count/(next||15)*100)+'%"></i></div></div>'+(count?'<div class="v-collect"><b>지도에 모인 동물 '+kinds+'가지</b><span>'+(sameCount?'나와 같은 동물 친구 '+sameCount+'명':'나와 같은 동물을 만나면 여기에 표시돼요')+'</span></div>':'')+'<div class="e-chart tier-'+(count>=15?3:count>=7?2:count>=3?1:0)+'" id="vChart"><div class="e-chart-me"><span>'+EIcons.emblem(owner)+'</span><div><p class="eyebrow">나 · '+owner+'번</p><b>'+type(owner).name+'</b><small>우리 조합의 시작점</small></div></div>'+(count?'<p class="e-chart-sort">그룹은 최고 점수 → 평균 순서<br>친구는 점수 순서 · 동점이면 추가 순서예요</p><div class="e-chart-groups">'+groups.map(function(group){return '<section class="e-chart-group" data-group="'+group.index+'"><header><span class="e-group-icon">'+EIcons.svg(groupIcons[group.index])+'</span><div><h2>'+group.label+' <span>'+group.list.length+'명</span></h2><p>최고 '+group.best+'점 · 평균 '+group.avg.toFixed(1)+'점</p></div></header><div class="e-group-people">'+group.list.map(function(x,i){return person(x,i+1);}).join('')+'</div></section>';}).join('')+'</div>':'<div class="e-chart-empty">'+EIcons.svg('connect')+'<p>첫 가지가 비어 있어요.<br>친구의 답장을 받아 우리 조합을 담아 봐요.</p></div>')+'</div><p class="cap e-rank-note">순위는 타입 점수의 정렬이에요.</p>'+btn('vMapInvite','내 궁합 링크 만들기',true)+'<div class="card v-daily"><p class="eyebrow">오늘의 궁합 한 마디</p>'+daily(d)+'</div><p class="cap">3명 · 7명 · 15명마다 지도 이름과 테두리가 달라져요. 모든 친구를 관계 그룹별로 볼 수 있어요.</p>'+storageNote()+(count?btn('vMapDeleteAll','지도 전체 삭제',false):'')+'<p class="cap">답장 링크를 받아 직접 추가하는 방식이에요. 친구의 입력이 자동으로 모이지 않고, 기기 간 동기화도 없어요. 같은 타입·별명은 중복 추가하지 않아요.</p>'+disc();
    A.go('v-map');$('vMapInvite').onclick=function(){makeLink(false);};
    $('v-map').querySelectorAll('[data-friend]').forEach(function(b){b.onclick=function(){var f=friends[+b.dataset.friend];showCompat(owner,f.type,'나',f.nick);};});
    $('v-map').querySelectorAll('[data-delete]').forEach(function(b){b.onclick=function(){var data=load();if(!data)return;data.friends.splice(+b.dataset.delete,1);if(save(data))renderMap();};});
    if(count)$('vMapDeleteAll').onclick=function(){if(!confirm('이 기기의 궁합 지도와 친구 기록을 모두 지울까요?'))return;try{localStorage.removeItem(KEY);}catch(_){}renderMap();A.toast('궁합 지도를 지웠어요');};
  }
  function result(){
    var st=A.state,t=st.type;mine=t.no;document.body.classList.remove('v-friend-input');
    var sum=$('p-sum'), first=sum.firstElementChild; first.classList.add('v-type-card');first.querySelector('.cap').classList.add('e-legacy-axes');
    first.insertAdjacentHTML('afterbegin','<div class="v-type-glyph">'+type(t.no).emblem+'</div>');first.insertAdjacentHTML('beforeend','<div class="e-axes">'+EIcons.badges(t)+'</div><p class="e-phase-note">'+t.season+' 무리는 사주 월지 네 구간에 붙인 원소 상징이에요. 동물은 그 구간에 붙인 캐릭터예요.</p>');
    node('p',{class:'cap v-source'},esc(Explain.source(st)),first);
    var rest=document.createElement('details');rest.className='v-accordion';rest.innerHTML='<summary>자세히 보기 · 나의 키워드와 오늘</summary>';
    Array.from(sum.children).slice(1).forEach(function(e){if(e.id!=='xSynth')rest.appendChild(e);});
    var yr=Fortune.year(st.saju,t,2027);
    sum.appendChild(node('div',{class:'card v-year'},'<p class="eyebrow">2027 한 줄</p><p class="h2">“'+esc(yr.typeLine.split('. ')[1] || yr.typeLine)+'”</p>',document.createDocumentFragment()));
    node('div',{class:'v-primary'},btn('vCreateLink','<svg class="e-icon e-icon-connect" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><path d="M36 32A14 14 0 1 1 8 32A14 14 0 1 1 36 32Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M56 32A14 14 0 1 1 28 32A14 14 0 1 1 56 32Z" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 27L38 37M26 37L38 27" stroke="#D6B579" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg> 내 궁합 링크 만들기',true)+'<p class="cap">친구가 링크를 열면 우리 둘의 궁합 카드가 나와요</p>',sum);
    ['face','saju','mbti'].forEach(function(k){var pane=$('p-'+k),two=Explain[k+'Summary'](k==='face'?st.face:st),detail=node('details',{class:'v-accordion x-detail','data-x':k},'<summary><span class="x-sum"><b>자세히 보기 · '+({face:'관상',saju:'사주',mbti:'성격유형'}[k])+' 풀이</b><small>'+esc(two[0])+'</small><small>'+esc(two[1])+'</small></span></summary>',sum);while(pane.firstChild)detail.appendChild(pane.firstChild);});
    sum.appendChild(rest);
    // 종합 문안은 링크 다음, 세 상세 풀이 앞에 두어요.
    var synth=$('xSynth'), primary=sum.querySelector('.v-primary');
    if(synth && primary) primary.insertAdjacentElement('afterend',synth);
    sum.querySelectorAll('[data-x-open]').forEach(function(b){b.onclick=function(){var d=sum.querySelector('details[data-x="'+b.dataset.xOpen+'"]');d.open=true;d.scrollIntoView({behavior:'smooth',block:'start'});};});
    node('p',{class:'x-fun'},'관상·사주·성격유형을 한 이야기로 엮은 해설이에요.',sum);
    node('div',{class:'v-row'},btn('vSaveType','결과 카드 저장',false)+btn('vGoMap','내 궁합 지도',false),sum);
    if(preview)node('div',{class:'v-demo-box'},'<b>미리보기 전용</b><p>공유 주소는 다른 기기에서 열리지 않아요. 링크를 만들고 친구 테스트로 한 바퀴 돌아보세요.</p>',sum);
    $('vCreateLink').onclick=function(){makeLink(false);};$('vSaveType').onclick=function(){$('saveCard').click();};$('vGoMap').onclick=renderMap;
    if(target){showCompat(target,t.no,targetNick,'');}
  }
  async function saveCard(){
    await EIcons.ready();
    var c=$('vCard'),ctx=c.getContext('2d'),p=pair,co=p.c; c.width=1080;c.height=1920;
    ctx.fillStyle='#0D1120';ctx.fillRect(0,0,1080,1920);var g=ctx.createRadialGradient(540,350,0,540,350,900);g.addColorStop(0,'#293247');g.addColorStop(1,'#0D1120');ctx.fillStyle=g;ctx.fillRect(0,0,1080,1920);
    function text(s,y,size,color){ctx.font='600 '+size+'px EolpalSans,sans-serif';ctx.fillStyle=color||'#F3EBDD';ctx.textAlign='center';ctx.fillText(s,540,y,940);}
    function wrap(s,y,size){ctx.font='400 '+size+'px EolpalSans,sans-serif';ctx.fillStyle='#BEB7AA';ctx.textAlign='left';var line='',row=0;Array.from(s).forEach(function(ch){if(ctx.measureText(line+ch).width>880){ctx.fillText(line,100,y+row*40);row++;line=ch;}else line+=ch;});if(line)ctx.fillText(line,100,y+row*40);return y+(row+1)*40;}
    text('얼팔타입 · 우리 둘의 궁합',150,32,'#D6B579');EIcons.draw(ctx,EIcons.season(co.a.no),270,215,160);EIcons.draw(ctx,'connect',480,245,110);EIcons.draw(ctx,EIcons.season(co.b.no),650,215,160);text(co.label,490,68);text(co.a.name+' × '+co.b.name,570,36);text(co.score+'점',770,140,'#D6B579');text(co.same?'나와 같은 동물을 찾았어요':co.a.season+' 무리 × '+co.b.season+' 무리',850,32,co.same?'#D6B579':'#BEB7AA');
    var y=950;[['잘 맞는 점',co.good],['살짝 엇갈리는 점',co.gap],['함께하면 좋은 것',co.activity]].forEach(function(x){text(x[0],y,34,'#86C9B5');y=wrap(x[1],y+55,26)+24;});
    text('재미로 보는 오락용 타입 궁합이에요',1810,27,'#BEB7AA');text('과학적 판단이나 미래 예측이 아니에요',1860,25,'#BEB7AA');
    var url=c.toDataURL('image/png'),a=node('a',{href:url,download:'얼팔타입_궁합카드.png'},'',document.body);a.click();a.remove();$('vCardPreview').src=url;$('vCardPreview').classList.remove('hidden');A.toast('궁합 카드를 만들었어요. 사진·생일·별명은 넣지 않았어요.');
  }
  $('vNav').onclick=function(e){var b=e.target.closest('[data-vtab]');if(!b)return;var k=b.dataset.vtab;if(k==='map')return renderMap();if(k==='type')return renderType();if(!A.state.saju||!A.state.type){A.toast('운세는 생년월일을 새로 입력한 뒤 볼 수 있어요.');return reenter();}if(k==='fortune') A.fortune();else A.attend();};
  window.addEventListener('eolpal:screen',function(e){var id=e.detail,show=['s-result','s-fortune','s-fday','s-year','s-attend','s-reward','v-map','v-compat','v-type'].includes(id);$('vNav').classList.toggle('hidden',!show);document.body.classList.toggle('v-tabbed',show);var selected=id==='v-map'||id==='v-compat'?'map':id==='s-attend'||id==='s-reward'?'attend':/^s-(fortune|fday|year)$/.test(id)?'fortune':'type';$('vNav').querySelectorAll('button').forEach(function(b){b.classList.toggle('on',b.dataset.vtab===selected);b.setAttribute('aria-current',b.dataset.vtab===selected?'page':'false');});
    if(id==='s-fortune'&&!$('vDailyHome')){node('div',{id:'vDailyHome',class:'card v-daily'},'<p class="eyebrow">오늘의 운세는 무료예요 · '+(Attend.enabled()?Attend.view(Attend.load(),new Date()).n+'일째 출석':'출석은 선택이에요')+'</p><p class="eyebrow">오늘의 궁합 한 마디</p>'+daily(load()),$('fHome')); $('fAtt').insertAdjacentElement('afterend',$('vDailyHome'));}
  });
  // Existing alternate match entries route to the map instead of collecting another person's birth date.
  document.addEventListener('click',function(e){if(e.target.closest('#toMatch,#navMatch,[data-go="match"],#tabs [data-t="match"]')){e.preventDefault();e.stopImmediatePropagation();renderMap();}},true);
  if(preview){node('div',{class:'v-preview-label'},'로컬 미리보기 · 공개되지 않았어요',document.querySelector('.appbar'));var box=node('div',{class:'v-demo-box'},'<b>미리보기 전용 · 가상 예시</b><p>실제 정보를 넣지 않고 결과와 공유 흐름을 눌러 볼 수 있어요.</p>'+btn('vExampleOwner','가상 내 타입으로 둘러보기',false),document.querySelector('#s-home .home'));$('vExampleOwner').onclick=function(){target=null;var st=A.state;st.saju=Saju.compute({calendar:'solar',y:1995,m:8,d:12,hh:12,mm:0});st.mbti='ENFJ';st.name='';st.face=null;st.photo=null;st.mbtiFromFace=false;A.showResult();};}
  // Accurate storage notices also on standalone screens and consent sheets.
  node('div',{class:'v-storage-summary'},'<details class="legal"><summary>기기 저장·링크 공개 안내</summary><p>바람·불·땅·물 네 무리는 사주 월지 네 구간에 붙인 원소 상징이고, 32가지 동물은 재미로 보는 상징 해석이에요. 생물학이나 검증된 심리 검사가 아니에요.</p>'+storageNote()+'<p>출석을 켜면 별도 키 eolpal_attend_v1에 방문 날짜·회차·완주 기록·쉬어 가기 여부를 남겨요. 출석 화면에서 지울 수 있어요. 링크에는 타입 번호와 처음 적은 이름이 담겨요. 링크를 가진 누구나 볼 수 있고, 주소 기록에 남거나 전달될 수 있어요. 사진·생년월일은 링크나 저장 공간에 넣지 않아요.</p></details>',document.querySelector('#app'));
  var summary=$('attSheet').querySelector('.att-ul');node('li',{},'위 내용은 출석 키에 관한 안내예요. 궁합 지도에 직접 추가한 타입 번호·선택 별명은 별도 키 eolpal_map_v1에 남고, 궁합 탭에서 지울 수 있어요.',summary);
  window.V12={result:result,clear:clear,compat:compat,load:load,landing:landing,receive:receive,renderMap:renderMap,type:type,link:link,saveCard:saveCard};
  var q=new URLSearchParams(location.search),t=num(q.get('t')),r=num(q.get('r')),f=num(q.get('f'));
  if(t)landing(t,nick(q.get('n')));else if(r&&f){mine=r;renderType();receive(r,f,nick(q.get('fn')));}else if(q.has('t')||q.has('r')||q.has('f'))A.toast('링크의 타입 번호가 올바르지 않아요. 1~32번을 확인해 주세요.');else if(q.get('demo')==='1' && preview){ document.querySelector('.v-preview-label').textContent='가상 예시 · 공개되지 않은 로컬 미리보기'; $('vExampleOwner').click(); }else if(load()){mine=load().owner;renderMap();}
})();
