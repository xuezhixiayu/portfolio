(() => {
  'use strict';
  const S=PortfolioStore,T=PortfolioThemes,{escape:e,icon}=UI;
  const clamp=(n,min=0,max=1)=>Math.max(min,Math.min(max,n));
  const smooth=n=>{const t=clamp(n);return t*t*(3-2*t);};
  const number=n=>String(n).padStart(2,'0');
  const dragThreshold=.48;
  let data,config,items=[],scenes=[],session;
  function sceneConfig(item,index){
    return T.getScene(item,config,index===0);
  }
  function configure(next,settings){
    data=next;config=settings;const first=next.items.find(x=>x.id===config.heroId)||next.items.find(x=>x.featured)||next.items[0];
    items=first?[first,...next.items.filter(x=>x!==first)]:[];
    scenes=items.map((item,i)=>{const scene=sceneConfig(item,i);return {...scene,item,cover:S.assetURL(i===0&&config.image?config.image:item.thumbnail||(item.images||[])[0]),video:S.assetURL(i===0&&config.video?config.video:item.videoData,'video')};});
  }
  function navbar(info,picker){return `<a class="skip-link" href="#main">跳到正文</a><header class="rift-nav"><a class="rift-brand" href="#home">${e(info.name)}<small>AI / VISUAL ARTIST</small></a><nav class="navlinks" id="navlinks" aria-label="主导航"><a href="#works" data-section="works">作品</a><a href="#experience" data-section="experience">经历</a><a href="#about" data-section="about">关于</a><a class="nav-resume" href="resume.html?theme=portal">个人简历 ${icon('arrow')}</a></nav><div class="top-actions">${picker}<button class="icon-button menu-button" id="menu-toggle" aria-label="展开导航" aria-expanded="false" aria-controls="navlinks">${icon('menu')}</button></div></header>`;}
  function indexHTML(subset=items){return subset.map(item=>`<a class="rift-index-item" href="#rift-scene-${items.indexOf(item)}" data-index-category="${e(item.category)}"><span>${number(items.indexOf(item)+1)}</span><img src="${e(S.assetURL(item.thumbnail))}" alt="" loading="lazy"><span><strong>${e(item.title)}</strong><small>${e(item.category)}</small></span>${icon('arrow')}</a>`).join('')||'<p class="empty-state">这个分类还没有作品。</p>';}
  function hero(){
    if(!items.length)return `<section id="home" class="rift-empty"><h1>${e(config.heroTitle||data.siteInfo.name)}</h1><div id="works"><p>这个分类还没有作品。</p></div></section>`;
    return `<section class="rift-sequence" id="home"><span class="rift-start" id="works"></span><div class="rift-stage" data-title-position="${e(config.titlePosition||'left')}"><div class="rift-layers" aria-hidden="true">${scenes.map((scene,i)=>`<div class="rift-visual ${i===0?'is-current':''}" data-visual="${i}" style="--focus-x:${scene.focusX}%;--focus-y:${scene.focus}%"><img src="${e(scene.cover)}" alt="" ${i===0?'fetchpriority="high"':'loading="lazy"'} decoding="async" draggable="false">${scene.video?`<video data-rift-video="${i}" data-src="${e(scene.video)}" poster="${e(scene.cover)}" muted loop playsinline preload="none"></video>`:''}</div>`).join('')}</div><canvas class="rift-optics" aria-hidden="true"></canvas><div class="rift-color-wash" aria-hidden="true"></div><div class="rift-vignette" aria-hidden="true"></div><div class="rift-light-edge" aria-hidden="true"></div><div class="rift-type"><p>${e(data.siteInfo.mainTitle||'个人作品集')} / SELECTED WORKS</p><h1>${e(config.heroTitle||data.siteInfo.name)}</h1><span>${e(config.heading)}</span></div><div class="rift-orbit-note" aria-hidden="true">IMAGINATION<br>IN MOTION <span>↙</span></div><div class="rift-caption" aria-live="polite" aria-atomic="true"><span class="rift-category" id="rift-category">${e(items[0].category)}</span><h2 id="rift-title">${e(items[0].title)}</h2><button class="rift-open" id="rift-open" data-detail="${e(items[0].id)}">进入作品 <span>${icon('arrow')}</span></button></div><div class="rift-interaction-note"><span class="rift-cross" aria-hidden="true">＋</span><span class="rift-drag-hint">按住拖动，松开切换作品</span><span class="rift-touch-hint">向下滑动，继续探索</span></div><div class="rift-transport"><span class="rift-current"><b id="rift-current">01</b><i>/ ${number(items.length)}</i></span><nav class="rift-chapter-dots" aria-label="跳到作品">${items.map((item,i)=>`<a href="#rift-scene-${i}" aria-label="第 ${i+1} 部：${e(item.title)}" ${i===0?'aria-current="true"':''}><span>${number(i+1)}</span><i></i></a>`).join('')}</nav><button class="rift-index-toggle" id="rift-index-toggle">作品目录 ${icon('grid')}</button></div><a class="rift-next" id="rift-next" href="${items.length>1?'#rift-scene-1':'#experience'}"><span>继续探索</span>${icon('down')}</a><div class="rift-cursor" aria-hidden="true"><span></span></div><div class="rift-opening" aria-hidden="true"></div></div><div class="rift-track">${items.map((item,i)=>`<section class="rift-scroll-marker" id="rift-scene-${i}" aria-label="第 ${i+1} 部作品：${e(item.title)}"><span class="sr-only">${e(item.title)}</span></section>`).join('')}</div><dialog class="rift-index" id="rift-index" aria-labelledby="rift-index-title"><header><div><p>SELECTED WORKS</p><h2 id="rift-index-title">作品目录</h2></div><button class="icon-button" data-index-close aria-label="关闭作品目录">${icon('close')}</button></header><label class="rift-index-filter">分类<select id="rift-index-filter"><option value="全部">全部作品</option>${[...new Set(items.map(x=>x.category))].map(c=>`<option value="${e(c)}">${e(c)}</option>`).join('')}</select></label><div id="rift-index-list">${indexHTML()}</div><p id="rift-index-status" class="sr-only" role="status"></p></dialog></section>`;
  }
  function bottom(){const info=data.siteInfo;return `<section class="rift-journey" id="experience"><div class="rift-journey-heading"><p>BEYOND THE SCREEN</p><h2>创作，一直向前。</h2><a class="text-link" href="resume.html?theme=portal">完整简历 ${icon('arrow')}</a></div><div class="rift-chronology"><article><span>2024 — 至今</span><h3>AI 漫剧创作</h3><p>独立创作 · 持续探索</p></article><article><span>2025</span><h3>星辰征途·红色航天梦</h3><p>测试负责人 · 推动修复 20+ 功能缺陷</p><small>挑战杯红色专项铜奖</small></article><article><span>2024</span><h3>“数遇·漫步” VR 文旅项目</h3><p>核心开发 · 场景建模 / VR 交互</p><small>浙江省挑战杯铜奖</small></article></div></section><section class="rift-about" id="about"><p class="rift-end-label">BEHIND EVERY STORY</p><div class="rift-about-name">${S.assetURL(info.avatar||info.avatarFile)?`<img src="${e(S.assetURL(info.avatar||info.avatarFile))}" alt="${e(info.name)}" loading="lazy">`:''}<h2>${e(info.name)}</h2></div><div class="rift-about-details"><div><p class="rift-bio">${e(info.bio)}</p>${info.slogan?`<p class="rift-bio">${e(info.slogan)}</p>`:''}<div class="about-tools">${(info.skillTags||[]).map(tag=>`<span class="tool-tag">${e(tag)}</span>`).join('')}</div><p class="rift-personal-title">${e(info.title)} / 浙江嘉兴</p></div><div class="contact-list">${UI.socialHTML(info.socialLinks)}</div></div><footer class="rift-footer"><span>© 2026 ${e(info.name)}</span><a href="#home">再看一次 ↑</a><div class="footer-links"><a href="resume.html?theme=portal">个人简历</a><a href="admin.html?section=appearance">自定义外观</a><a href="admin.html">后台管理</a></div></footer></section>`;}
  function getScrollState(offset,step,count){
    const distance=Math.max(1,step),position=clamp(offset/distance,0,Math.max(0,count-1)),boundary=Math.round(position);
    // CSS section heights can be fractional while anchor scrolling rounds pixels.
    // Treat the one-pixel landing area as the destination, not the previous cut.
    const raw=Math.abs(position-boundary)*distance<=1?boundary:position,index=Math.floor(raw);
    return {index,next:Math.min(index+1,count-1),blend:smooth((raw-index-.48)/.52),raw};
  }
  function getSlit(x,width){const center=clamp(x,.05,.95)*100,amount=clamp(width),half=amount*(Math.max(center,100-center)+3),jag=amount*2;return `polygon(${center-half}% 0,${center+half}% 0,${center+half+jag}% 23%,${center+half-jag/2}% 45%,${center+half+jag/2}% 74%,${center+half}% 100%,${center-half}% 100%,${center-half-jag}% 75%,${center-half+jag/2}% 46%,${center-half-jag/2}% 24%)`;}
  function getRevealClip(transition,blend,drag,cut=.5){if(drag>.001)return getSlit(cut,Math.max(drag,blend));if(transition==='warp')return `circle(${clamp(blend)*110}% at 50% 50%)`;return transition==='ink'?getSlit(.5,blend):'none';}
  function bind(root,signal){
    session?.dispose();const stage=root.querySelector('.rift-stage'),sequence=root.querySelector('.rift-sequence');if(!stage)return;
    const options={signal},motion=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
    const visuals=[...stage.querySelectorAll('[data-visual]')],markers=[...root.querySelectorAll('.rift-scroll-marker')],dots=[...stage.querySelectorAll('.rift-chapter-dots a')],canvas=stage.querySelector('canvas');
    const state={current:0,next:Math.min(1,items.length-1),blend:0,drag:0,dragTarget:0,gestureIndex:null,commitIndex:null,scrollTarget:null,pointerId:null,cut:.52,px:.5,py:.5,pointer:false,holding:false,visible:true,dirty:true,raf:0,last:0,step:1,start:0,disposed:false};
    let optics=null,indexDialog=root.querySelector('#rift-index'),lastShown=-1;
    const dragHint=stage.querySelector('.rift-drag-hint');
    const activeMotion=()=>config.motion>0&&!motion.matches&&scenes[state.current].intensity>0;
    function measure(){state.start=sequence.getBoundingClientRect().top+scrollY;state.step=markers[0]?.getBoundingClientRect().height||innerHeight;}
    function queue(){state.dirty=true;if(!state.raf&&!state.disposed&&!document.hidden)state.raf=requestAnimationFrame(draw);}
    function moveToScene(index,updateHash=false){
      // Keep the scroll position, chapter links and dragged scene in agreement.
      state.scrollTarget=state.start+state.step*index;
      markers[index].scrollIntoView({behavior:'instant',block:'start'});
      state.scrollTarget=scrollY;
      if(updateHash){try{history.replaceState(history.state,'','#rift-scene-'+index);}catch(_){}}
    }
    function updateDragHint(){
      const ready=state.holding&&state.dragTarget>=dragThreshold;
      stage.classList.toggle('is-drag-ready',ready);
      stage.classList.toggle('is-switching',state.commitIndex!==null);
      if(dragHint)dragHint.textContent=state.commitIndex!==null?'正在进入下一部…':ready?'松开，进入下一部':state.holding?'继续拖动，切换作品':'按住拖动，松开切换作品';
    }
    function manageVideos(){stage.querySelectorAll('video').forEach(v=>{const active=Number(v.dataset.riftVideo)===state.current&&state.visible&&activeMotion()&&!document.hidden&&!document.querySelector('dialog[open]');if(active){if(!v.src)v.src=v.dataset.src;v.muted=true;v.play().catch(()=>{});}else v.pause();});}
    function draw(time){
      state.raf=0;if(state.disposed||document.hidden)return;
      const delta=Math.min(48,time-state.last||16);state.last=time;
      if(state.commitIndex!==null&&state.drag>.995){
        const target=state.commitIndex;state.gestureIndex=state.commitIndex=null;state.drag=state.dragTarget=0;
        moveToScene(target,true);updateDragHint();
      }
      const scroll=getScrollState(scrollY-state.start,state.step,items.length);
      state.current=state.gestureIndex??scroll.index;state.next=Math.min(state.current+1,items.length-1);
      state.blend=state.gestureIndex!==null?0:activeMotion()?scroll.blend:(scroll.blend>.5?1:0);
      if(!activeMotion()){state.drag=state.dragTarget=0;}else {state.drag+=(state.dragTarget-state.drag)*Math.min(1,delta*.014);if(state.dragTarget===0&&state.drag<.001)state.drag=0;}
      const next=state.drag>.001?(state.current+1)%items.length:state.next;
      const visibleIndex=state.blend>.5?state.next:state.current;
      if(visibleIndex!==lastShown){lastShown=visibleIndex;const item=items[visibleIndex],scene=scenes[visibleIndex];stage.style.setProperty('--scene-color',scene.color);stage.dataset.transition=scene.transition;root.querySelector('#rift-title').textContent=item.title;root.querySelector('#rift-category').textContent=item.category;root.querySelector('#rift-current').textContent=number(visibleIndex+1);root.querySelector('#rift-open').dataset.detail=item.id;root.querySelector('#rift-next').href=visibleIndex<items.length-1?'#rift-scene-'+(visibleIndex+1):'#experience';dots.forEach((d,i)=>{if(i===visibleIndex)d.setAttribute('aria-current','true');else d.removeAttribute('aria-current');});manageVideos();}
      const transition=scenes[state.current].transition;
      const revealing=state.drag>.001||state.blend>0;
      visuals.forEach((el,i)=>{el.classList.toggle('is-current',i===state.current);el.classList.toggle('is-next',i===next&&i!==state.current);el.style.opacity=i===state.current?'1':i===next&&revealing?(state.drag>.001||transition!=='film'?'1':String(state.blend)):'0';el.style.clipPath=i===next&&i!==state.current?getRevealClip(transition,state.blend,state.drag,state.cut):'none';});
      const strength=activeMotion()?config.motion*scenes[state.current].intensity:0;
      stage.style.setProperty('--mouse-x',config.parallax?(state.px-.5)*strength:0);stage.style.setProperty('--mouse-y',config.parallax?(state.py-.5)*strength:0);stage.style.setProperty('--cut-x',(state.cut*100)+'%');stage.style.setProperty('--tear',state.drag);stage.style.setProperty('--shot-progress',scroll.raw-state.current);stage.style.setProperty('--name-opacity',clamp(1-scroll.raw*1.8));stage.style.setProperty('--cut-glow',Math.min(1,state.drag*5)*(1-smooth((state.drag-.65)/.35)));
      const hasVideo=!!scenes[state.current].video||!!scenes[next].video,canOptics=optics&&fine.matches&&canvas.clientWidth>0&&!hasVideo;
      let opticalReady=false;
      if(canOptics&&activeMotion()){opticalReady=optics.draw({a:scenes[state.current],b:scenes[next],time:time/1000,strength,pointer:config.parallax?[state.px,1-state.py]:[.5,.5],cut:state.cut,drag:state.drag,blend:state.blend,transition});canvas.classList.toggle('is-ready',opticalReady);}else canvas.classList.remove('is-ready');
      const cursor=stage.querySelector('.rift-cursor');cursor.style.left=state.px*100+'%';cursor.style.top=state.py*100+'%';cursor.classList.toggle('is-visible',state.pointer&&fine.matches&&activeMotion());
      root.querySelector('.rift-nav')?.classList.toggle('is-over-content',!state.visible);
      const needsFrames=state.visible&&activeMotion()&&(state.holding||state.commitIndex!==null||Math.abs(state.drag-state.dragTarget)>.001||opticalReady);
      if(needsFrames&&!state.raf)state.raf=requestAnimationFrame(draw);
    }
    function releasePointer(){const id=state.pointerId;state.pointerId=null;if(id!==null&&stage.hasPointerCapture?.(id))stage.releasePointerCapture(id);}
    function resetDrag(){state.holding=false;state.gestureIndex=state.commitIndex=null;state.dragTarget=0;stage.classList.remove('is-dragging');releasePointer();updateDragHint();queue();}
    stage.addEventListener('pointerdown',event=>{
      if(items.length<2||state.commitIndex!==null||state.holding||event.pointerType==='touch'||!fine.matches||!activeMotion()||event.button!==0||event.target.closest('a,button,select,dialog,input'))return;
      const scroll=getScrollState(scrollY-state.start,state.step,items.length),index=scroll.blend>.5?scroll.next:scroll.index;
      if(scenes[index].intensity===0)return;
      if(Math.abs(scroll.raw-index)>.001)moveToScene(index);
      state.gestureIndex=state.current=index;state.next=Math.min(index+1,items.length-1);state.blend=0;state.drag=0;
      state.holding=true;state.pointerId=event.pointerId;state.startX=event.clientX;state.cut=clamp((event.clientX-stage.getBoundingClientRect().left)/stage.clientWidth,.12,.88);state.dragTarget=.035;
      stage.setPointerCapture?.(event.pointerId);stage.classList.add('is-dragging');updateDragHint();queue();
    },options);
    stage.addEventListener('pointermove',event=>{if(event.pointerType==='touch')return;const rect=stage.getBoundingClientRect();state.px=clamp((event.clientX-rect.left)/rect.width);state.py=clamp((event.clientY-rect.top)/rect.height);state.pointer=!event.target.closest('a,button,select,dialog');if(state.holding&&event.pointerId===state.pointerId){state.dragTarget=clamp(.03+Math.abs(event.clientX-state.startX)/Math.max(1,rect.width)*1.6,0,.9);updateDragHint();}queue();},options);
    stage.addEventListener('pointerleave',()=>{state.pointer=false;if(!state.holding){state.px=state.py=.5;}queue();},options);
    stage.addEventListener('pointerup',event=>{
      if(!state.holding||event.pointerId!==state.pointerId)return;
      if(state.dragTarget>=dragThreshold&&activeMotion()){
        state.commitIndex=(state.gestureIndex+1)%items.length;state.holding=false;state.dragTarget=1;
        stage.classList.remove('is-dragging');releasePointer();updateDragHint();queue();
      }else resetDrag();
    },options);
    stage.addEventListener('pointercancel',resetDrag,options);
    stage.addEventListener('lostpointercapture',()=>{if(state.holding)resetDrag();},options);window.addEventListener('blur',resetDrag,options);
    window.addEventListener('scroll',()=>{if(state.scrollTarget!==null&&Math.abs(scrollY-state.scrollTarget)<2){state.scrollTarget=null;queue();return;}state.scrollTarget=null;resetDrag();},{...options,passive:true});window.addEventListener('resize',()=>{resetDrag();measure();queue();},options);
    document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(state.raf);state.raf=0;resetDrag();}manageVideos();queue();},options);
    motion.addEventListener('change',()=>{resetDrag();manageVideos();queue();},options);
    const visibility='IntersectionObserver' in window?new IntersectionObserver(entries=>{state.visible=entries[0].isIntersecting;manageVideos();queue();},{threshold:.03}):null;visibility?.observe(sequence);
    stage.querySelector('#rift-index-toggle').addEventListener('click',()=>{indexDialog.showModal();manageVideos();},options);
    indexDialog.querySelector('[data-index-close]').addEventListener('click',()=>indexDialog.close(),options);
    indexDialog.addEventListener('click',event=>{if(event.target.closest('a[href^="#rift-scene-"]'))indexDialog.close();if(event.target===indexDialog){const r=indexDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)indexDialog.close();}},options);
    indexDialog.querySelector('#rift-index-filter').addEventListener('change',event=>{let count=0;indexDialog.querySelectorAll('[data-index-category]').forEach(el=>{el.hidden=event.target.value!=='全部'&&el.dataset.indexCategory!==event.target.value;if(!el.hidden)count++;});indexDialog.querySelector('#rift-index-status').textContent=count+' 部作品';},options);
    indexDialog.addEventListener('close',()=>{manageVideos();queue();},options);
    const detail=document.getElementById('detail-dialog');detail?.addEventListener('close',()=>{manageVideos();queue();},options);
    root.addEventListener('click',event=>{if(event.target.closest('[data-detail]'))manageVideos();},options);
    if(window.RiftOptics)optics=RiftOptics.create(canvas,queue);
    measure();updateDragHint();queue();stage.classList.add('is-mounted');
    // Hash navigation also works on initial load after asynchronous data rendering.
    if(location.hash.startsWith('#rift-scene-')){const target=markers.find(x=>'#'+x.id===location.hash);if(target)requestAnimationFrame(()=>{if(!state.disposed)target.scrollIntoView({behavior:'instant'});});}
    const currentSession={dispose(){if(state.disposed)return;state.disposed=true;cancelAnimationFrame(state.raf);visibility?.disconnect();optics?.dispose();stage.querySelectorAll('video').forEach(v=>{v.pause();v.removeAttribute('src');v.load();});}};session=currentSession;
    signal.addEventListener('abort',()=>currentSession.dispose(),{once:true});
  }
  function enter(dialog){const strength=config.motion;if(!strength||matchMedia('(prefers-reduced-motion:reduce)').matches)return;dialog.animate([{clipPath:'polygon(49% 0,51% 0,52% 40%,50% 100%,49% 100%,48% 40%)',filter:'brightness(2.4)',transform:'scale(1.05)'},{clipPath:'polygon(0 0,100% 0,100% 40%,100% 100%,0 100%,0 40%)',filter:'brightness(1)',transform:'scale(1)'}],{duration:760,easing:'cubic-bezier(.16,1,.3,1)'});}
  window.Rift={configure,navbar,hero,bottom,bind,enter,indexHTML,sceneConfig,getScrollState,getSlit,getRevealClip};
})();
