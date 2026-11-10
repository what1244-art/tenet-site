/* 시안 공통 동작: 시안 전환 바, 인앱 브라우저 안내, 유튜브 라이트박스, 문의 폼 */
(function(){
  'use strict';
  var TEL='01030813730';
  var VARIANTS=[['a','A'],['b','B'],['c','C'],['d','D']];

  function el(tag,attrs,html){
    var n=document.createElement(tag);
    Object.keys(attrs||{}).forEach(function(k){n.setAttribute(k,attrs[k])});
    if(html!==undefined)n.innerHTML=html;
    return n;
  }

  function mountSwitcher(){
    var cur=(location.pathname.match(/\/([a-d])(?:\.html)?$/)||[])[1];
    var bar=el('nav',{'class':'vsw','aria-label':'시안 전환'});
    /* 화면을 가릴 때 접어 둘 수 있게 "시안" 글자가 접기 버튼을 겸한다 */
    var fold=el('button',{type:'button','aria-expanded':'true',title:'접기/펴기'},'시안');
    fold.addEventListener('click',function(){
      var folded=bar.classList.toggle('min');
      fold.setAttribute('aria-expanded',String(!folded));
    });
    bar.appendChild(fold);
    VARIANTS.forEach(function(v){
      var a=el('a',{href:v[0]+'.html'},v[1]);
      if(v[0]===cur)a.setAttribute('aria-current','page');
      bar.appendChild(a);
    });
    bar.appendChild(el('a',{href:'./',title:'시안 목록'},'≡'));
    document.body.appendChild(bar);
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
  function copyText(text){
    if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(text);
    return new Promise(function(res,rej){
      var t=el('textarea',{readonly:''});t.value=text;t.style.cssText='position:fixed;opacity:0';
      document.body.appendChild(t);t.select();
      var ok=false;try{ok=document.execCommand('copy')}catch(e){ok=false}
      t.remove();ok?res():rej(new Error('copy failed'));
    });
  }
  function mountInApp(){
    var ua=navigator.userAgent;
    var forced=new URLSearchParams(location.search).get('inapp');
    var name=inAppName(ua)||(forced?'카카오톡':'');
    if(!name)return;
    var android=forced?forced==='android':/Android/i.test(ua);
    var bar=el('div',{'class':'inapp',role:'region','aria-label':'브라우저 안내'});
    var msg=el('p',{},android
      ?name+' 안에서 열렸습니다. Chrome에서 열면 영상과 문의 버튼이 제대로 동작합니다.'
      :name+' 안에서 열렸습니다. 주소를 복사해 Safari에 붙여 넣으면 영상과 문의 버튼이 제대로 동작합니다.');
    var go=el('button',{'class':'go',type:'button'},android?'Chrome으로 열기':'주소 복사');
    var x=el('button',{'class':'x',type:'button'},'그냥 보기');
    go.addEventListener('click',function(){
      if(android){
        location.href='intent://'+location.host+location.pathname+location.search+'#Intent;scheme=https;package=com.android.chrome;end';
        return;
      }
      copyText(location.href).then(function(){msg.textContent='주소를 복사했습니다. Safari를 열고 주소창에 붙여 넣어 주세요.'})
        .catch(function(){msg.textContent='복사가 막혀 있습니다. 화면의 ··· 메뉴에서 "Safari로 열기"를 눌러 주세요.'});
    });
    x.addEventListener('click',function(){bar.remove()});
    bar.appendChild(msg);bar.appendChild(go);bar.appendChild(x);
    document.body.appendChild(bar);
  }

  function mountLightbox(){
    var triggers=document.querySelectorAll('[data-yt]');
    /* 시안 A는 기존 사이트의 라이트박스(#lb)를 그대로 쓴다 */
    if(!triggers.length||document.getElementById('lb'))return;
    var lb=el('div',{'class':'ytlb',hidden:'',role:'dialog','aria-modal':'true','aria-label':'영상'},'<button type="button" aria-label="닫기">✕</button><div class="fr"></div>');
    var fr=lb.querySelector('.fr');var last=null;
    function close(){lb.hidden=true;fr.innerHTML='';if(last)last.focus()}
    function open(id,from){
      last=from;
      fr.innerHTML='<iframe src="https://www.youtube-nocookie.com/embed/'+encodeURIComponent(id)+'?autoplay=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="유튜브 영상"></iframe>';
      lb.hidden=false;lb.querySelector('button').focus();
    }
    lb.addEventListener('click',function(e){if(e.target===lb||e.target.tagName==='BUTTON')close()});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!lb.hidden)close()});
    triggers.forEach(function(t){t.addEventListener('click',function(e){e.preventDefault();open(t.getAttribute('data-yt'),t)})});
    document.body.appendChild(lb);
  }

  /* 문의 폼: 서버가 없으므로 문자 앱으로 넘기거나 내용을 복사한다 */
  function buildMessage(form){
    var v=function(n){var f=form.elements[n];return f?String(f.value||'').trim():''};
    if(v('website'))return {error:''};
    if(!v('org')||!v('who'))return {error:'회사·소속과 연락처를 적어 주세요.'};
    var lines=['[테넷 제작 문의]','소속: '+v('org'),'담당: '+v('who')];
    if(v('need'))lines.push('필요: '+v('need'));
    if(v('msg'))lines.push('내용: '+v('msg'));
    return {text:lines.join('\n')};
  }
  function mountForms(){
    document.querySelectorAll('form[data-inq]').forEach(function(form){
      var out=form.querySelector('[data-ok]');
      var say=function(t){if(out)out.textContent=t};
      form.addEventListener('submit',function(e){e.preventDefault()});
      var sms=form.querySelector('[data-sms]'),cp=form.querySelector('[data-copy]');
      if(sms)sms.addEventListener('click',function(){
        var m=buildMessage(form);if(m.error!==undefined){say(m.error);return}
        location.href='sms:'+TEL+'?&body='+encodeURIComponent(m.text);
        say('문자 앱이 열리지 않으면 "내용 복사"를 눌러 카카오톡이나 메일로 보내 주세요.');
      });
      if(cp)cp.addEventListener('click',function(){
        var m=buildMessage(form);if(m.error!==undefined){say(m.error);return}
        copyText(m.text).then(function(){say('복사했습니다. 010-3081-3730 문자나 카카오톡에 붙여 넣어 주세요.')})
          .catch(function(){say('복사가 막혀 있습니다. 010-3081-3730으로 전화 주세요.')});
      });
    });
  }

  function init(){mountSwitcher();mountInApp();mountLightbox();mountForms()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
