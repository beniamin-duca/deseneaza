(function(){
  'use strict';

  // ---------- palette & sizes ----------
  var COLORS = ['#2D3047','#E63946','#F06BA8','#9B7EDE','#6BB6E8','#7CB342','#FFD93D','#B08968','#FFFFFF'];
  var SIZES = [6, 14, 26];
  var STICKERS = ['🌸','⭐','🦋','🐞','🌈','❤️','🐱','🌳','☀️','🍄','🐝','🎈'];

  // ---------- coloring templates (simple line outlines) ----------
  var TEMPLATES = {
    floare: {label:'🌼', svg:'<svg viewBox="0 0 400 300" fill="none" stroke="#9aa0b4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="200" cy="150" r="34"/><g><ellipse cx="200" cy="92" rx="24" ry="38"/><ellipse cx="200" cy="208" rx="24" ry="38"/><ellipse cx="142" cy="150" rx="38" ry="24"/><ellipse cx="258" cy="150" rx="38" ry="24"/><ellipse cx="160" cy="110" rx="22" ry="34" transform="rotate(-45 160 110)"/><ellipse cx="240" cy="110" rx="22" ry="34" transform="rotate(45 240 110)"/><ellipse cx="160" cy="190" rx="22" ry="34" transform="rotate(45 160 190)"/><ellipse cx="240" cy="190" rx="22" ry="34" transform="rotate(-45 240 190)"/></g></svg>'},
    casuta: {label:'🏠', svg:'<svg viewBox="0 0 400 300" fill="none" stroke="#9aa0b4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M90 150 L200 70 L310 150"/><path d="M110 150 V240 H290 V150"/><rect x="175" y="185" width="50" height="55"/><rect x="135" y="170" width="34" height="34"/><rect x="231" y="170" width="34" height="34"/><path d="M70 240 H330"/><circle cx="300" cy="95" r="22"/></svg>'},
    peste: {label:'🐟', svg:'<svg viewBox="0 0 400 300" fill="none" stroke="#9aa0b4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M120 150 C150 100 250 100 290 150 C250 200 150 200 120 150 Z"/><path d="M120 150 L80 115 L92 150 L80 185 Z"/><circle cx="255" cy="138" r="7"/><path d="M180 120 C190 150 190 150 180 180" /><path d="M215 116 C225 150 225 150 215 184"/><path d="M150 150 q-4 -10 0 -20 M150 150 q-4 10 0 20"/></svg>'},
    masina: {label:'🚗', svg:'<svg viewBox="0 0 400 300" fill="none" stroke="#9aa0b4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M70 200 L70 165 L110 165 L140 125 L250 125 L285 165 L330 170 L330 200"/><path d="M70 200 H330"/><circle cx="125" cy="200" r="26"/><circle cx="285" cy="200" r="26"/><path d="M150 125 V165 M210 125 V165"/></svg>'},
    fluture: {label:'🦋', svg:'<svg viewBox="0 0 400 300" fill="none" stroke="#9aa0b4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M200 90 V215"/><circle cx="200" cy="82" r="8"/><path d="M193 78 q-12 -22 -22 -20 M207 78 q12 -22 22 -20"/><path d="M198 110 C140 60 90 90 110 140 C90 175 150 195 198 160 Z"/><path d="M202 110 C260 60 310 90 290 140 C310 175 250 195 202 160 Z"/></svg>'}
  };

  // ---------- state ----------
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  var paper = document.getElementById('paper');
  var templateLayer = document.getElementById('templateLayer');
  var state = {
    mode:'liber', color:COLORS[1], size:SIZES[1], tool:'brush',
    sticker:STICKERS[0], template:'floare', drawing:false, dpr:1
  };
  var undoStack = [];
  var lastX=0, lastY=0;

  // ---------- canvas sizing ----------
  function fitPaper(){
    var stage = document.querySelector('.stage');
    var availW = stage.clientWidth;
    var availH = stage.clientHeight - 6;
    // Layout not resolved yet (flex height still 0) — retry next frame.
    if(availW < 2 || availH < 2){ requestAnimationFrame(fitPaper); return; }
    // 4:3 paper, fit within available space
    var ratio = 4/3;
    var w = availW, h = w/ratio;
    if(h > availH){ h = availH; w = h*ratio; }
    w = Math.floor(w); h = Math.floor(h);
    paper.style.width = w+'px';
    paper.style.height = h+'px';
    // snapshot before resize
    var prev = canvas.width ? canvas.toDataURL() : null;
    var dpr = Math.min(window.devicePixelRatio||1, 2.5);
    state.dpr = dpr;
    canvas.width = Math.floor(w*dpr);
    canvas.height = Math.floor(h*dpr);
    canvas.style.width = w+'px';
    canvas.style.height = h+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.lineCap='round'; ctx.lineJoin='round';
    if(prev){
      var img = new Image();
      img.onload = function(){ ctx.drawImage(img, 0,0, w, h); };
      img.src = prev;
    }
  }

  // ---------- undo ----------
  function pushUndo(){
    try{ undoStack.push(canvas.toDataURL()); if(undoStack.length>25) undoStack.shift(); }catch(e){}
  }
  function undo(){
    if(!undoStack.length) return;
    var data = undoStack.pop();
    var img = new Image();
    img.onload = function(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img,0,0, paper.clientWidth, paper.clientHeight);
      persist();
    };
    img.src = data;
  }

  // ---------- drawing ----------
  function pos(e){
    var r = canvas.getBoundingClientRect();
    var p = (e.touches && e.touches[0]) ? e.touches[0] : e;
    return { x:(p.clientX - r.left), y:(p.clientY - r.top) };
  }
  function down(e){
    e.preventDefault();
    if(state.tool==='sticker'){ stamp(pos(e)); persist(); return; }
    pushUndo();
    state.drawing = true;
    var p = pos(e); lastX=p.x; lastY=p.y;
    drawDot(p.x,p.y);
  }
  function move(e){
    if(!state.drawing) return;
    e.preventDefault();
    var p = pos(e);
    drawLine(lastX,lastY,p.x,p.y);
    lastX=p.x; lastY=p.y;
  }
  function up(){ if(state.drawing){ state.drawing=false; persist(); } }

  function applyStroke(){
    if(state.tool==='eraser'){
      ctx.globalCompositeOperation='destination-out';
      ctx.strokeStyle='rgba(0,0,0,1)'; ctx.fillStyle='rgba(0,0,0,1)';
      ctx.lineWidth = state.size*2.2;
    } else {
      ctx.globalCompositeOperation='source-over';
      ctx.strokeStyle=state.color; ctx.fillStyle=state.color;
      ctx.lineWidth = state.size;
    }
  }
  function drawDot(x,y){ applyStroke(); ctx.beginPath(); ctx.arc(x,y,(state.tool==='eraser'?state.size*1.1:state.size/2),0,Math.PI*2); ctx.fill(); }
  function drawLine(x1,y1,x2,y2){ applyStroke(); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); }

  function stamp(p){
    var px = Math.min(paper.clientWidth, paper.clientHeight);
    var fs = Math.max(34, px*0.13);
    ctx.globalCompositeOperation='source-over';
    ctx.font = fs+'px "Baloo 2", sans-serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(state.sticker, p.x, p.y);
  }

  // ---------- persistence ----------
  var SAVE_KEY='plaiu-draw-v1';
  function persist(){
    try{ localStorage.setItem(SAVE_KEY, JSON.stringify({mode:state.mode, template:state.template, img:canvas.toDataURL()})); }catch(e){}
  }
  function restore(){
    try{
      var raw = localStorage.getItem(SAVE_KEY); if(!raw) return false;
      var d = JSON.parse(raw); if(!d.img) return false;
      setMode(d.mode||'liber', d.template, true);
      var img = new Image();
      img.onload = function(){ ctx.drawImage(img,0,0, paper.clientWidth, paper.clientHeight); };
      img.src = d.img;
      return true;
    }catch(e){ return false; }
  }

  // ---------- modes ----------
  var MODE_NAMES = {liber:'Pagină goală', colorat:'Pagini de colorat', stickere:'Stickere & ștampile'};
  function setMode(mode, template, silent){
    if(mode==='surpriza'){
      var opts=['liber','colorat','stickere'];
      mode = opts[Math.floor(Math.random()*opts.length)];
      if(mode==='colorat'){ var ks=Object.keys(TEMPLATES); template=ks[Math.floor(Math.random()*ks.length)]; }
      if(mode==='stickere'){ state.sticker = STICKERS[Math.floor(Math.random()*STICKERS.length)]; }
    }
    state.mode = mode;
    document.getElementById('modeName').textContent = MODE_NAMES[mode]||'Pagină goală';
    var context = document.getElementById('context');
    context.classList.remove('on'); context.innerHTML='';
    templateLayer.innerHTML='';

    if(mode==='colorat'){
      state.template = template || state.template;
      renderTemplate();
      buildContext('template');
    } else if(mode==='stickere'){
      buildContext('sticker');
      // default tool stays brush; selecting a sticker switches to sticker tool
    }
    syncTools();
  }

  function renderTemplate(){
    templateLayer.innerHTML = TEMPLATES[state.template] ? TEMPLATES[state.template].svg : '';
  }

  function buildContext(kind){
    var context = document.getElementById('context');
    context.innerHTML='';
    var label = document.createElement('span');
    label.className='ctx-label';
    if(kind==='template'){
      label.textContent='Alege un desen:';
      context.appendChild(label);
      Object.keys(TEMPLATES).forEach(function(key){
        var b=document.createElement('button');
        b.className='ctx-item'+(key===state.template?' sel':'');
        b.textContent=TEMPLATES[key].label;
        b.onclick=function(){
          state.template=key; renderTemplate();
          [].forEach.call(context.querySelectorAll('.ctx-item'),function(el){el.classList.remove('sel');});
          b.classList.add('sel'); persist();
        };
        context.appendChild(b);
      });
    } else {
      label.textContent='Apasă un sticker, apoi pe foaie:';
      context.appendChild(label);
      STICKERS.forEach(function(s){
        var b=document.createElement('button');
        b.className='ctx-item'+(s===state.sticker && state.tool==='sticker'?' sel':'');
        b.textContent=s;
        b.onclick=function(){
          state.sticker=s; state.tool='sticker';
          [].forEach.call(context.querySelectorAll('.ctx-item'),function(el){el.classList.remove('sel');});
          b.classList.add('sel'); syncTools();
        };
        context.appendChild(b);
      });
    }
    context.classList.add('on');
  }

  // ---------- toolbar build ----------
  function buildDock(){
    var cWrap=document.getElementById('colors');
    COLORS.forEach(function(c){
      var b=document.createElement('button');
      b.className='swatch'+(c===state.color?' sel':'');
      b.style.background=c;
      if(c==='#FFFFFF') b.style.boxShadow='0 0 0 1px rgba(45,48,71,.25),0 2px 4px rgba(45,48,71,.18)';
      b.setAttribute('aria-label','Culoare');
      b.onclick=function(){
        state.color=c; if(state.tool!=='sticker') state.tool='brush';
        [].forEach.call(cWrap.children,function(el){el.classList.remove('sel');});
        b.classList.add('sel'); syncTools();
      };
      cWrap.appendChild(b);
    });
    var sWrap=document.getElementById('sizes');
    SIZES.forEach(function(sz,i){
      var b=document.createElement('button');
      b.className='size-btn'+(sz===state.size?' sel':'');
      var d=document.createElement('span');
      d.className='dotx';
      var px = 8 + i*7; d.style.width=px+'px'; d.style.height=px+'px';
      b.appendChild(d);
      b.setAttribute('aria-label','Grosime');
      b.onclick=function(){
        state.size=sz;
        [].forEach.call(sWrap.children,function(el){el.classList.remove('sel');});
        b.classList.add('sel');
      };
      sWrap.appendChild(b);
    });
  }

  function syncTools(){
    document.getElementById('eraserTool').classList.toggle('sel', state.tool==='eraser');
    // when not erasing or stickering, color swatches reflect active brush color
  }

  // ---------- save / share ----------
  function buildExport(){
    return new Promise(function(resolve){
      var w = paper.clientWidth, h = paper.clientHeight;
      var pad = Math.round(w*0.045);
      var bar = Math.round(w*0.09);
      var ex = document.createElement('canvas');
      ex.width = w + pad*2; ex.height = h + pad*2 + bar;
      var c = ex.getContext('2d');
      c.fillStyle = '#FFF8E7'; c.fillRect(0,0,ex.width,ex.height);
      c.fillStyle = '#fff';
      roundRect(c, pad*0.5, pad*0.5, ex.width-pad, h+pad, 18); c.fill();

      function compositeStrokesAndCaption(){
        c.drawImage(canvas, pad, pad, w, h);
        c.fillStyle = '#7CB342';
        c.font = '600 '+Math.round(bar*0.4)+'px "Baloo 2", sans-serif';
        c.textAlign='center'; c.textBaseline='middle';
        c.fillText('desenat pe plaiu.ro 🌿', ex.width/2, h+pad*2 + bar*0.2);
        resolve(ex.toDataURL('image/png'));
      }

      var tplImg = templateLayer.querySelector('svg');
      if(tplImg){
        var svgData = new XMLSerializer().serializeToString(tplImg);
        var img = new Image();
        img.onload = function(){ c.drawImage(img, pad, pad, w, h); compositeStrokesAndCaption(); };
        img.onerror = compositeStrokesAndCaption;
        img.src = 'data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svgData)));
      } else {
        compositeStrokesAndCaption();
      }
    });
  }
  function roundRect(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }

  function openShare(){
    buildExport().then(function(dataUrl){
      window.__lastExport = dataUrl;
      document.getElementById('sharePreview').src = dataUrl;
      document.getElementById('shareOv').classList.add('on');
    });
  }

  // ---------- toast ----------
  var toastT;
  function toast(msg){
    var t=document.getElementById('toast'); t.textContent=msg; t.classList.add('on');
    clearTimeout(toastT); toastT=setTimeout(function(){ t.classList.remove('on'); },2200);
  }

  // ---------- wire events ----------
  function wire(){
    canvas.addEventListener('mousedown',down); canvas.addEventListener('mousemove',move);
    window.addEventListener('mouseup',up);
    canvas.addEventListener('touchstart',down,{passive:false});
    canvas.addEventListener('touchmove',move,{passive:false});
    window.addEventListener('touchend',up);

    document.getElementById('eraserTool').onclick=function(){
      state.tool = state.tool==='eraser' ? 'brush' : 'eraser';
      // clear sticker selection visuals
      var ctxRow=document.getElementById('context');
      [].forEach.call(ctxRow.querySelectorAll('.ctx-item.sel'),function(el){ if(state.mode==='stickere') el.classList.remove('sel'); });
      syncTools();
    };
    document.getElementById('undoTool').onclick=undo;
    document.getElementById('clearTool').onclick=function(){ pushUndo(); ctx.clearRect(0,0,canvas.width,canvas.height); persist(); };
    document.getElementById('saveBtn').onclick=openShare;
    document.getElementById('modePill').onclick=function(){ document.getElementById('overlay').classList.remove('hide'); };

    [].forEach.call(document.querySelectorAll('.pick'),function(b){
      b.onclick=function(){
        setMode(b.getAttribute('data-mode'));
        document.getElementById('overlay').classList.add('hide');
        persist();
      };
    });

    document.getElementById('againBtn').onclick=function(){ document.getElementById('shareOv').classList.remove('on'); };
    document.getElementById('dlBtn').onclick=function(){
      var a=document.createElement('a'); a.href=window.__lastExport; a.download='desenul-meu-plaiu.png'; a.click();
      toast('Salvat! 🎉');
    };
    document.getElementById('shareBtn').onclick=function(){
      if(navigator.share && window.__lastExport){
        fetch(window.__lastExport).then(function(r){return r.blob();}).then(function(blob){
          var file=new File([blob],'plaiu.png',{type:'image/png'});
          navigator.share({files:[file], title:'Plaiu', text:'Uite ce am desenat pe plaiu.ro!'}).catch(function(){});
        });
      } else { toast('Pe telefon apare meniul de share 📱'); }
    };
    document.getElementById('galleryBtn').onclick=function(){
      document.getElementById('shareOv').classList.remove('on');
      toast('Trimis spre verificare — mulțumim! 🌿');
    };

    var rt;
    window.addEventListener('resize',function(){ clearTimeout(rt); rt=setTimeout(fitPaper,150); });
    window.addEventListener('load',function(){ fitPaper(); });
    if(window.ResizeObserver){
      var ro=new ResizeObserver(function(){ fitPaper(); });
      ro.observe(document.querySelector('.stage'));
    }
  }

  // ---------- init ----------
  function init(){
    buildDock();
    wire();
    fitPaper();
    requestAnimationFrame(fitPaper);
    syncTools();
    var params = new URLSearchParams(location.search);
    var qMode = params.get('mode');
    var restored = false;
    // doodle seed from the homepage hero — consume once, takes precedence
    var seed = null;
    try{ seed = localStorage.getItem('plaiu-doodle-seed'); if(seed) localStorage.removeItem('plaiu-doodle-seed'); }catch(e){}
    if(seed){
      setMode('liber');
      var simg = new Image();
      simg.onload = function(){ ctx.drawImage(simg,0,0, paper.clientWidth, paper.clientHeight); persist(); };
      simg.src = seed;
      document.getElementById('overlay').classList.add('hide');
      return;
    }
    if(!qMode){ restored = restore(); }
    if(qMode){
      var map={liber:'liber',blank:'liber',colorat:'colorat',colour:'colorat',stickere:'stickere',stickers:'stickere',surpriza:'surpriza',surprise:'surpriza'};
      setMode(map[qMode]||'liber');
      document.getElementById('overlay').classList.add('hide');
    } else if(restored){
      document.getElementById('overlay').classList.add('hide');
    }
    // else: overlay stays visible for picking
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
