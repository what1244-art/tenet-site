/* 테넷 홈페이지 동작: 상단 바, 작업 조명, 인앱 브라우저 안내, 영상·사진 라이트박스, 제작 의뢰서 */
(function(){
  'use strict';
  var TEL='01030813730';
  var TEL_TEXT='010-3081-3730';
  var root=document.documentElement;

  /* [id, 항목, 담당, 공간] */
  var ITEMS=[
    ['compose','작곡 · 편곡','민요한 (Chief Composer) 외 소속 작곡가 10인','메인 콘솔룸'],
    ['vocal','보컬 섭외','소속 보컬 풀, 남녀·연령대별','보컬 부스'],
    ['session','세션 연주','기타·베이스·드럼·건반·현 세션 연주자','메인 콘솔룸, H홀'],
    ['rec','녹음','오찬우 (Chief Audio Engineer)','메인 콘솔룸, 보컬 부스'],
    ['mix','믹싱 · 마스터링','오찬우 (Chief Audio Engineer)','메인 콘솔룸, SSL Big Six'],
    ['score','악보 · 총보','채보팀 (밴드 스코어·피아노·스트링)','세컨룸'],
    ['video','영상 촬영','촬영감독, 영상팀','H홀, 공연장'],
    ['dist','유통 · 발매','테넷 유통 대행 (멜론·지니·스포티파이·애플뮤직)','해당 없음'],
    ['live','공연 · 쇼케이스','임혜림 (연출), 민요한 (밴드마스터), 홍보팀','자체 기획 공연 무대'],
    ['room','리허설 공간','H홀 합주실 (트리플 방음), MIMM 연습실 8룸','지하 H홀, 돌곶이로22길 MIMM'],
    ['data','AI 음성 데이터','성우·보컬 풀, 트리플 방음 부스','보컬 부스, 메인 콘솔룸'],
    ['edu','교육 · 클래스','MIMM 연습실 8룸, 밴드클럽, 실용음악과 출신 강사 네트워크','돌곶이로22길 MIMM (도보 5분)']
  ];
  var DEFAULT_PICKED=['compose','vocal','rec','mix'];

  function $(sel,ctx){return (ctx||document).querySelector(sel)}
  function $all(sel,ctx){return Array.prototype.slice.call((ctx||document).querySelectorAll(sel))}
  function el(tag,attrs,text){
    var n=document.createElement(tag);
    Object.keys(attrs||{}).forEach(function(k){n.setAttribute(k,attrs[k])});
    if(text!==undefined)n.textContent=text;
    return n;
  }
  /* 인앱 웹뷰는 clipboard API가 있어도 거절하는 일이 많아 예전 방식으로 한 번 더 시도한다 */
  function copyLegacy(text){
    return new Promise(function(res,rej){
      var t=el('textarea',{readonly:''});t.value=text;t.style.cssText='position:fixed;opacity:0;font-size:16px';
      document.body.appendChild(t);t.select();t.setSelectionRange(0,text.length);
      var ok=false;try{ok=document.execCommand('copy')}catch(e){ok=false}
      t.remove();
      if(ok)res();else rej(new Error('copy failed'));
    });
  }
  function copyText(text){
    if(!(navigator.clipboard&&navigator.clipboard.writeText))return copyLegacy(text);
    return navigator.clipboard.writeText(text).catch(function(){return copyLegacy(text)});
  }
  /* 화면에 들어와 있는지 지켜본다. IntersectionObserver가 없으면 false를 돌려준다 */
  function watch(nodes,margin,onChange){
    if(!('IntersectionObserver' in window)||!nodes.length)return false;
    var seen=[];
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        seen=seen.filter(function(n){return n!==en.target});
        if(en.isIntersecting)seen=seen.concat(en.target);
      });
      onChange(seen.length>0);
    },{rootMargin:margin});
    nodes.forEach(function(n){io.observe(n)});
    return true;
  }

  /* 상단 바: 첫 화면 사진 위에서는 투명, 지나가면 남색 */
  function mountTopBar(){
    var bar=$('#topbar'),hero=$('#hero'),btn=$('#mbtn'),nav=$('#mnav');
    if(!bar)return;
    /* 관찰 결과가 오기 전에 남색으로 깜빡이지 않게 첫 화면 위에 있다고 보고 시작한다 */
    var overHero=!!hero&&'IntersectionObserver' in window,open=false;
    function paint(){bar.classList.toggle('solid',!overHero||open)}
    function setOpen(next){
      open=next;
      if(nav)nav.hidden=!open;
      if(btn){btn.setAttribute('aria-expanded',String(open));btn.textContent=open?'닫기':'메뉴'}
      paint();
    }
    if(hero){
      /* 첫 화면 글자가 로고 밑으로 들어오기 전에 바를 남색으로 채운다 */
      var mark=el('i',{'aria-hidden':'true'});
      mark.style.cssText='position:absolute;left:0;top:0;width:1px;height:48px;pointer-events:none';
      hero.appendChild(mark);
      watch([mark],'0px',function(on){overHero=on;paint()});
    }
    paint();
    if(!btn||!nav)return;
    btn.addEventListener('click',function(){setOpen(!open)});
    nav.addEventListener('click',function(e){if(e.target.closest('a'))setOpen(false)});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&open){setOpen(false);btn.focus()}});
    if(window.matchMedia){
      var wide=window.matchMedia('(min-width:921px)');
      var onWide=function(m){if(m.matches&&open)setOpen(false)};
      if(wide.addEventListener)wide.addEventListener('change',onWide);else if(wide.addListener)wide.addListener(onWide);
    }
  }

  /* 모바일 하단 바: 첫 화면과 의뢰서가 보이는 동안은 숨긴다 */
  function mountMobileBar(){
    var bar=$('#mbar');
    if(!bar)return;
    var targets=[$('#hero'),$('#contact')].filter(Boolean);
    var ok=watch(targets,'0px',function(on){bar.classList.toggle('off',on)});
    if(!ok)bar.classList.remove('off');
  }

  /* 작업 조명: 차가운 조명 사진 위로 따뜻한 조명 사진을 겹친다 */
  function mountLamp(){
    var hero=$('#hero'),lamp=$('#lamp');
    if(!hero||!lamp)return;
    function set(on){hero.classList.toggle('lit',on);lamp.setAttribute('aria-pressed',String(on))}
    var calm=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var auto=calm?0:setTimeout(function(){set(true)},1100);
    lamp.addEventListener('click',function(){clearTimeout(auto);set(!hero.classList.contains('lit'))});
  }

  /* 인앱 브라우저(카카오톡·인스타·페이스북·네이버·라인) → 기본 브라우저 안내 */
  function inAppName(ua){
    if(/KAKAOTALK/i.test(ua))return '카카오톡';
    if(/Instagram/i.test(ua))return '인스타그램';
    if(/FBAN|FBAV/i.test(ua))return '페이스북';
    if(/NAVER\(inapp/i.test(ua))return '네이버 앱';
    if(/\bLine\//i.test(ua))return '라인';
    return '';
  }
  function mountInApp(){
    var ua=navigator.userAgent;
    /* ?inapp=android|ios 로 안내 화면을 미리 볼 수 있다 */
    var forced=(location.search.match(/[?&]inapp=(android|ios)\b/)||[])[1]||'';
    var name=inAppName(ua)||(forced?'카카오톡':'');
    if(!name)return;
    var android=forced?forced==='android':/Android/i.test(ua);
    var bar=el('div',{'class':'inapp',role:'region','aria-label':'브라우저 안내'});
    var msg=el('p',{},android
      ?name+' 안에서 열렸습니다. Chrome에서 열면 영상과 문의 버튼이 제대로 동작합니다.'
      :name+' 안에서 열렸습니다. 주소를 복사해 Safari에 붙여 넣으면 영상과 문의 버튼이 제대로 동작합니다.');
    var go=el('button',{'class':'go',type:'button'},android?'Chrome으로 열기':'주소 복사');
    var x=el('button',{'class':'x',type:'button'},'그냥 보기');
    /* 미리보기용 inapp 값은 넘기지 않고, 광고 유입 값(utm 등)은 그대로 넘긴다 */
    var query=location.search.replace(/([?&])inapp=[^&]*&?/,'$1').replace(/[?&]$/,'');
    var here=location.origin+location.pathname+query;
    function fit(){root.style.setProperty('--inapp-h',(bar.isConnected?bar.offsetHeight:0)+'px')}
    go.addEventListener('click',function(){
      if(android){
        location.href='intent://'+location.host+location.pathname+query+'#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url='+encodeURIComponent(here)+';end';
        setTimeout(function(){msg.textContent='Chrome이 열리지 않으면 화면의 ⋮ 메뉴에서 "다른 브라우저로 열기"를 눌러 주세요.';fit()},1500);
        return;
      }
      copyText(here)
        .then(function(){msg.textContent='주소를 복사했습니다. Safari를 열고 주소창에 붙여 넣어 주세요.'})
        .catch(function(){msg.textContent='복사가 막혀 있습니다. 화면의 ··· 메뉴에서 "Safari로 열기"를 눌러 주세요.'})
        .then(fit);
    });
    x.addEventListener('click',function(){bar.remove();fit();window.removeEventListener('resize',fit)});
    bar.appendChild(msg);bar.appendChild(go);bar.appendChild(x);
    document.body.insertBefore(bar,document.body.firstChild);
    fit();
    window.addEventListener('resize',fit);
    /* 웹폰트가 늦게 들어오면 안내 문구 줄 수가 바뀐다 */
    window.addEventListener('load',fit);
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);
  }

  /* 라이트박스: data-yt는 유튜브 영상, data-img는 큰 사진 */
  function mountLightbox(){
    var triggers=$all('[data-yt],[data-img]');
    if(!triggers.length)return;
    var lb=el('div',{'class':'lb',hidden:'',role:'dialog','aria-modal':'true','aria-label':'크게 보기'});
    var closeBtn=el('button',{type:'button','aria-label':'닫기'},'✕');
    var box=el('div',{});
    lb.appendChild(closeBtn);lb.appendChild(box);
    var last=null;
    function setInert(on){
      $all('body > *').forEach(function(n){if(n!==lb)n.inert=on});
      document.body.classList.toggle('lock',on);
    }
    function close(){
      if(lb.hidden)return;
      lb.hidden=true;box.textContent='';setInert(false);
      if(last)last.focus();
    }
    function open(from){
      var yt=from.getAttribute('data-yt'),title=from.getAttribute('data-t')||'';
      var fr=el('div',{'class':yt?'fr yt':'fr'});
      if(yt){
        fr.appendChild(el('iframe',{
          src:'https://www.youtube-nocookie.com/embed/'+encodeURIComponent(yt)+'?autoplay=1&rel=0',
          allow:'autoplay; encrypted-media; picture-in-picture',allowfullscreen:'',title:title||'유튜브 영상'
        }));
      }else{
        fr.appendChild(el('img',{src:from.getAttribute('data-img'),alt:title}));
      }
      box.textContent='';box.appendChild(fr);
      if(title)box.appendChild(el('p',{'class':'cap'},title));
      lb.setAttribute('aria-label',title||'크게 보기');
      last=from;lb.hidden=false;setInert(true);closeBtn.focus();
    }
    lb.addEventListener('click',function(e){if(e.target===lb||e.target===box||e.target===closeBtn)close()});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
    triggers.forEach(function(t){
      t.addEventListener('click',function(e){
        /* 새 탭으로 열려는 클릭은 그대로 둔다 */
        if(e.metaKey||e.ctrlKey||e.shiftKey)return;
        e.preventDefault();open(t);
      });
    });
    document.body.appendChild(lb);
  }

  /* 제작 의뢰서 1·2단계: 고른 항목마다 담당자와 공간을 보여 준다 */
  function mountOrder(){
    var chips=$('#chips'),assign=$('#assign'),need=$('#need');
    if(!chips||!assign||!need)return;
    var picked=DEFAULT_PICKED.slice();
    function isOn(id){return picked.indexOf(id)>-1}
    function render(){
      var rows=ITEMS.filter(function(it){return isOn(it[0])});
      need.value=rows.map(function(it){return it[1]}).join(', ');
      assign.textContent='';
      if(!rows.length){
        assign.appendChild(el('p',{'class':'empty'},'위에서 항목을 고르면 담당자와 공간이 여기에 뜹니다.'));
        return;
      }
      var table=el('table',{'class':'tbl'}),head=el('tr',{}),body=el('tbody',{});
      ['항목','담당','공간'].forEach(function(t){head.appendChild(el('th',{scope:'col'},t))});
      rows.forEach(function(it){
        var tr=el('tr',{});
        it.slice(1).forEach(function(t){tr.appendChild(el('td',{},t))});
        body.appendChild(tr);
      });
      table.appendChild(el('thead',{})).appendChild(head);
      table.appendChild(body);
      var sum=el('p',{'class':'sum'});
      sum.appendChild(el('b',{},String(rows.length)));
      sum.appendChild(document.createTextNode('개 항목, 외부 업체 '));
      sum.appendChild(el('b',{},'0'));
      sum.appendChild(document.createTextNode('곳, 견적서 한 장.'));
      assign.appendChild(table);assign.appendChild(sum);
    }
    ITEMS.forEach(function(it){
      var b=el('button',{type:'button','aria-pressed':String(isOn(it[0]))},it[1]);
      b.addEventListener('click',function(){
        picked=isOn(it[0])?picked.filter(function(x){return x!==it[0]}):picked.concat(it[0]);
        b.setAttribute('aria-pressed',String(isOn(it[0])));
        render();
      });
      chips.appendChild(b);
    });
    render();
  }

  /* 제작 의뢰서 3단계: 서버가 없으므로 문자 앱으로 넘기거나 내용을 복사한다 */
  function readForm(form){
    function v(n){var f=form.elements[n];return f?String(f.value||'').trim():''}
    var missing=['org','who'].filter(function(n){return !v(n)});
    if(missing.length)return {missing:missing};
    var lines=['[테넷 제작 문의]','소속: '+v('org'),'담당: '+v('who')];
    if(v('need'))lines.push('필요: '+v('need'));
    if(v('msg'))lines.push('내용: '+v('msg'));
    return {text:lines.join('\n')};
  }
  function mountForm(){
    var form=$('form[data-inq]');
    if(!form)return;
    var out=$('[data-ok]',form),sms=$('[data-sms]',form),cp=$('[data-copy]',form);
    function say(t){if(out)out.textContent=t}
    /* 보낼 수 있으면 문안을, 아니면 null을 돌려주고 빠진 칸을 표시한다 */
    function ready(){
      var r=readForm(form);
      ['org','who'].forEach(function(n){form.elements[n].removeAttribute('aria-invalid')});
      if(!r.missing)return r.text;
      r.missing.forEach(function(n){form.elements[n].setAttribute('aria-invalid','true')});
      form.elements[r.missing[0]].focus();
      say('회사·소속과 연락처를 적어 주세요.');
      return null;
    }
    form.addEventListener('submit',function(e){e.preventDefault()});
    form.addEventListener('input',function(e){
      if(e.target.getAttribute&&e.target.getAttribute('aria-invalid'))e.target.removeAttribute('aria-invalid');
    });
    if(sms)sms.addEventListener('click',function(){
      var text=ready();if(!text)return;
      location.href='sms:'+TEL+'?&body='+encodeURIComponent(text);
      say('문자 앱이 열리지 않으면 "내용 복사"를 눌러 카카오톡이나 메일로 보내 주세요.');
    });
    if(cp)cp.addEventListener('click',function(){
      var text=ready();if(!text)return;
      copyText(text)
        .then(function(){say('복사했습니다. '+TEL_TEXT+' 문자나 카카오톡에 붙여 넣어 주세요.')})
        .catch(function(){say('복사가 막혀 있습니다. '+TEL_TEXT+'으로 전화 주세요.')});
    });
  }

  /* D-day: 공연 첫날이 확정되면 #dday의 data-date에 YYYY-MM-DD를 넣는다 */
  function mountDday(){
    var node=$('#dday');
    if(!node||!node.dataset.date)return;
    var t=new Date(node.dataset.date+'T00:00:00+09:00');
    if(isNaN(t))return;
    var d=Math.ceil((t-new Date())/864e5);
    node.textContent=d>0?'D-'+d:(d===0?'D-Day':'');
  }

  function init(){
    mountInApp();mountTopBar();mountMobileBar();mountLamp();
    mountLightbox();mountOrder();mountForm();mountDday();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
