(() => {
  'use strict';
  const {icon,escape:e,toast,design,socialHTML}=UI;
  const Store=PortfolioStore, root=document.getElementById('app');
  let data, filter='全部', currentHero=0, observer, revealObserver, binding, audio, source='', bgmWasPlaying=false, lastJSON='';
  const asset=(src,type)=>Store.assetURL(src,type);
  const image=(src,alt,props='')=>asset(src)?`<img src="${e(asset(src))}" alt="${e(alt)}" ${props}>`:`<div class="image-empty">暂无封面</div>`;
  const other=design==='cinema'?'gallery':'cinema';
  function navbar(info) {
    if(window.Immersive)return Immersive.navbar(info);
    return `<a href="#main" class="skip-link">跳到正文</a><header class="topbar"><a class="brand" href="#home">${e(info.name)}<small>${design==='cinema'?'FILM PORTFOLIO':'CREATIVE STUDIO'}</small></a><nav class="navlinks" aria-label="主导航" id="navlinks"><a href="#works" data-section="works">作品</a><a href="#experience" data-section="experience">经历</a><a href="#about" data-section="about">关于</a><a class="nav-resume" href="resume.html">个人简历 ${icon('arrow')}</a></nav><div class="top-actions"><span class="edition">${design==='cinema'?'沉浸影院':'数字创作展厅'}</span><button class="icon-button" data-theme-toggle aria-label="切换亮暗主题">${icon('sun')}</button><button class="icon-button menu-button" aria-label="展开导航" aria-expanded="false" aria-controls="navlinks" id="menu-toggle">${icon('menu')}</button></div></header>`;
  }
  function heroHTML() {
    if(window.Immersive)return Immersive.hero(data);
    const info=data.siteInfo;
    const items=data.items.filter(x=>x.featured), selection=items.length?items:data.items;
    if(currentHero>=selection.length)currentHero=0;
    const item=selection[currentHero];
    if(design==='gallery') return `<section class="gallery-hero wrap" id="home"><div class="gallery-copy"><p class="eyebrow"><span class="status-dot"></span>${e(info.mainTitle||'个人作品集')} / ${e(info.name)}</p><h1>把想象，<br>变成<em>下一帧。</em></h1><p class="identity-line">AI 漫剧创作 · 3D 视觉 · VR 交互</p><div class="button-row"><a class="button primary" href="#works">探索作品 ${icon('down')}</a><a class="button ghost" href="#experience">我的经历 ${icon('arrow')}</a></div><div class="creator-sign">${image(info.avatar||info.avatarFile,info.name)}<span>${e(info.name)}<small>${e(info.title||'AI 漫剧创作者')}</small></span></div></div><div class="gallery-stage"><img class="portal-art" src="../shared/assets/portal.png" alt="银色与酸橙绿的环形空间装置" fetchpriority="high">${[data.items[4]||data.items[0],data.items[1]].filter(Boolean).map((work,i)=>`<button class="gallery-floater ${i?'two':'one'}" data-detail="${e(work.id)}" aria-label="查看${e(work.title)}">${image(work.thumbnail,work.title)}</button>`).join('')}<p class="stage-coordinates mono">AI × HUMAN IMAGINATION<br>FORM / FRAME / MOTION</p></div><div class="gallery-hero-bottom mono"><span>SELECTED WORKS / ${String(data.items.length).padStart(2,'0')}</span><span>STORY → FRAME → MOTION → WORLD</span></div></section>`;
    return `<section class="cinema-hero" id="home">${item?image(item.thumbnail,'','class="hero-atmosphere" aria-hidden="true"'):''}${item?image(item.thumbnail,item.title,'class="hero-still" fetchpriority="high"'):''}<div class="film-identity mono">${e(info.name)} / AI 漫剧 · 3D · VR</div><div class="wrap"><div class="film-copy"><p class="eyebrow">${e(item?.category||info.mainTitle||'个人作品集')} <span aria-hidden="true"> / </span> SELECTED FILM</p>${item?`<button class="hero-film-open" data-detail="${e(item.id)}" aria-label="查看${e(item.title)}"><h1>${e(item.title)}</h1></button>`:`<h1>${e(info.name)}</h1>`}<p class="hero-description">${e(item?.description||info.bio||'')}</p><div class="button-row"><a class="button primary" href="#works">查看作品 ${icon('down')}</a><a class="button" href="#experience">创作经历 ${icon('arrow')}</a></div></div></div><div class="hero-bottom"><div class="hero-indicator">${selection.map((work,i)=>`<button data-hero="${i}" aria-label="展示${e(work.title)}" aria-pressed="${i===currentHero}"></button>`).join('')}</div><span class="hero-index">${String(item?currentHero+1:0).padStart(2,'0')} / ${String(selection.length).padStart(2,'0')}</span><div class="hero-caption"><span>${e(info.mainTitle||'个人作品集')}</span><span>AI · VISUAL STORYTELLING</span></div></div></section>`;
  }
  function worksHTML() {
    if(window.Immersive)return Immersive.works(data,filter);
    const categories=['全部',...new Set(data.items.map(x=>x.category))];
    if(!categories.includes(filter))filter='全部';
    return `<section class="works-section wrap" id="works"><div class="section-heading"><h2>作品<span>SELECTED WORKS / ${String(data.items.length).padStart(2,'0')}</span></h2><div class="filters" role="group" aria-label="按作品分类筛选">${categories.map(c=>`<button class="filter" data-filter="${e(c)}" aria-pressed="${filter===c}">${e(c)}</button>`).join('')}</div></div><div class="work-grid" id="work-grid">${cardsHTML()}</div><p class="sr-only" id="filter-status" role="status"></p></section>`;
  }
  function cardsHTML() {
    if(window.Immersive)return Immersive.cards(data,filter);
    const items=data.items.filter(x=>filter==='全部'||x.category===filter);
    return items.map((item,i)=>`<button class="work-card" data-detail="${e(item.id)}" aria-label="查看${e(item.title)}"><div class="work-art">${image(item.thumbnail||(item.images||[])[0],item.title,'loading="lazy" decoding="async"')}<span class="work-number">${String(data.items.indexOf(item)+1).padStart(2,'0')}</span><span class="work-play">${icon(item.type==='video'?'play':'arrow')}</span></div><h3>${e(item.title)}</h3><div class="work-meta"><span>${e(item.category)}</span>${item.featured?'<span class="feature-dot" aria-label="精选作品"></span>':''}</div></button>`).join('')||'<div class="empty-state">这个分类还没有作品。</div>';
  }
  function bottomHTML() {
    if(window.Immersive)return Immersive.bottom(data);
    const info=data.siteInfo;
    return `<section class="experience-section wrap" id="experience"><div class="experience-layout"><div class="section-kicker"><h2>经历</h2><p class="eyebrow">EXPERIENCE</p></div><div class="experience-list"><article class="experience"><span class="experience-year">2024</span><div><h3>“数遇·漫步” VR 文旅项目</h3><p>核心开发 · 场景建模 / VR 交互</p><span class="award">浙江省挑战杯铜奖</span></div></article><article class="experience"><span class="experience-year">2025</span><div><h3>星辰征途·红色航天梦</h3><p>测试负责人 · 推动修复 20+ 功能缺陷</p><span class="award">挑战杯红色专项铜奖</span></div></article></div></div></section><section class="about-section wrap" id="about"><div class="about-layout"><div class="section-kicker"><h2>关于</h2><p class="eyebrow">THE CREATOR</p></div><div><div class="about-profile">${image(info.avatar||info.avatarFile,info.name,'loading="lazy"')}<div><h3>${e(info.name)}</h3><p>${e(info.title)} · 浙江嘉兴</p></div></div><p class="about-bio">${e(info.bio)}</p><div class="about-tools">${(info.skillTags||[]).map(t=>`<span class="tool-tag">${e(t)}</span>`).join('')}</div>${info.slogan?`<p class="about-bio" style="margin-top:20px">${e(info.slogan)}</p>`:''}</div><div class="contact-list">${socialHTML(info.socialLinks)}</div></div></section><footer class="site-footer wrap"><span>© 2026 ${e(info.name)} · ${e(info.mainTitle||'个人作品集')}</span><div class="footer-links"><a href="resume.html">个人简历</a><a href="admin.html">后台管理</a><a href="../${other}/index.html">${design==='cinema'?'数字创作展厅':'沉浸影院'} ↗</a></div></footer>`;
  }
  function render() {
    binding?.abort();binding=new AbortController();observer?.disconnect();revealObserver?.disconnect();
    if(window.Immersive)Immersive.configure(data);
    document.title=data.siteInfo.name+' · '+(design==='cinema'?'沉浸影院':'数字创作展厅');
    root.innerHTML=navbar(data.siteInfo)+`<main id="main">${heroHTML()}${worksHTML()}${bottomHTML()}</main>`;
    UI.bindTheme();UI.bindCopy(root);bindHome();initAudio();
    if(window.Immersive)Immersive.bind(root);
  }
  function bindHome() {
    const options={signal:binding.signal};
    root.addEventListener('click',event=>{
      const button=event.target.closest('[data-detail]');
      if(button)openDetail(button.dataset.detail,button);
      const hero=event.target.closest('[data-hero]');
      if(hero){currentHero=Number(hero.dataset.hero);root.querySelector('#home').outerHTML=heroHTML();}
      const category=event.target.closest('[data-filter]');
      if(category){filter=category.dataset.filter;root.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===filter)));root.querySelector('#work-grid').innerHTML=cardsHTML();root.querySelector('#filter-status').textContent=`${filter}，${data.items.filter(x=>filter==='全部'||x.category===filter).length} 部作品`;if(window.Immersive)Immersive.refreshCards();}
      if(event.target.closest('a[href^="#"]')) {document.getElementById('navlinks')?.classList.remove('open');document.getElementById('menu-toggle')?.setAttribute('aria-expanded','false');}
    },options);
    document.getElementById('menu-toggle')?.addEventListener('click',event=>{const expanded=document.getElementById('navlinks').classList.toggle('open');event.currentTarget.setAttribute('aria-expanded',String(expanded));},options);
    if('IntersectionObserver' in window){observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting)root.querySelectorAll('[data-section]').forEach(link=>link.classList.toggle('active',link.dataset.section===entry.target.id));});},{rootMargin:'-18% 0px -55% 0px'});root.querySelectorAll('#works,#experience,#about').forEach(section=>observer.observe(section));}
    if('IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches){revealObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('reveal-ready');revealObserver.unobserve(entry.target);}});},{threshold:.15});root.querySelectorAll('.work-card,.experience').forEach(card=>revealObserver.observe(card));}
    const stage=root.querySelector('.gallery-stage');
    if(stage&&matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches){stage.addEventListener('pointermove',event=>{const rect=stage.getBoundingClientRect();stage.style.setProperty('--drift-x',((event.clientX-rect.left)/rect.width-.5)*15+'px');stage.style.setProperty('--drift-y',((event.clientY-rect.top)/rect.height-.5)*12+'px');},options);stage.addEventListener('pointerleave',()=>{stage.style.setProperty('--drift-x','0px');stage.style.setProperty('--drift-y','0px');},options);}
  }
  function openDetail(id,origin) {
    const item=data.items.find(x=>x.id===id);if(!item)return;
    const dialog=document.getElementById('detail-dialog');
    const video=asset(item.videoData,'video'), link=Store.cleanURL(item.videoUrl), embed=Store.cleanURL(item.embedUrl);
    const direct=video || (/\.(mp4|webm)(\?|$)/i.test(embed||link)?(embed||link):'');
    let validEmbed=false;
    if(embed){const url=new URL(embed);validEmbed=(['www.youtube.com','www.youtube-nocookie.com','player.bilibili.com','player.vimeo.com'].includes(url.hostname) && (/\/embed\/|\/player.html|\/video\//.test(url.pathname)));}
    let media=image(item.thumbnail||(item.images||[])[0],item.title);
    if(item.type==='video' && direct)media=`<video src="${e(direct)}" poster="${e(asset(item.thumbnail))}" controls playsinline preload="metadata"></video>`;
    else if(item.type==='video' && validEmbed)media=`<iframe src="${e(embed)}" title="${e(item.title)}" allow="fullscreen; picture-in-picture" allowfullscreen sandbox="allow-scripts allow-same-origin allow-presentation"></iframe>`;
    dialog.innerHTML=`<button class="icon-button dialog-close" data-close aria-label="关闭作品详情">${icon('close')}</button><div class="detail-layout"><div class="detail-media" id="detail-media">${media}</div><div class="detail-info"><p class="eyebrow">${e(item.category)} / ${item.type==='image'?'IMAGE GALLERY':'FILM'}</p><h2 id="detail-title">${e(item.title)}</h2><p class="description">${e(item.description)}</p><div class="detail-tags">${(item.tags||[]).map(t=>`<span class="tool-tag">${e(t)}</span>`).join('')}</div>${link||embed?`<a class="button primary" href="${e(link||embed)}" target="_blank" rel="noopener noreferrer">在原平台观看 ${icon('arrow')}</a>`:''}${!direct&&!validEmbed&&item.type==='video'?`<p class="detail-caption">${item.releaseStatus==='upcoming'?'该作品即将上线，暂无观看链接。':'此作品通过原平台链接观看。'}</p>`:''}${item.images?.length?`<div class="detail-gallery">${item.images.map((src,i)=>`<button data-image="${e(asset(src))}" aria-label="放大第 ${i+1} 张图片">${image(src,item.title+' '+(i+1),'loading="lazy"')}</button>`).join('')}</div>`:''}</div></div>`;
    dialog.setAttribute('aria-labelledby','detail-title');dialog.showModal();document.body.style.overflow='hidden';
    if(window.Immersive)Immersive.enter(dialog,origin);
    bgmWasPlaying=audio&&!audio.paused;if(bgmWasPlaying)audio.pause();
    dialog.querySelector('[data-close]').onclick=()=>dialog.close();
    dialog.querySelectorAll('[data-image]').forEach(button=>button.onclick=()=>{const light=document.getElementById('lightbox');light.innerHTML=`<button class="icon-button dialog-close" aria-label="关闭大图">${icon('close')}</button><img src="${e(button.dataset.image)}" alt="${e(item.title)}">`;light.querySelector('button').onclick=()=>light.close();light.showModal();});
  }
  function cleanupDetail() {
    const dialog=document.getElementById('detail-dialog');dialog.querySelectorAll('video').forEach(v=>v.pause());dialog.innerHTML='';document.body.style.overflow='';
    if(bgmWasPlaying&&audio)audio.play().catch(()=>{});bgmWasPlaying=false;
  }
  function initAudio(){
    const info=data.siteInfo,newSource=asset(info.bgmData||info.bgmFile,'audio'), player=document.getElementById('music-player');
    if(!newSource){audio?.pause();source='';audio=null;player.hidden=true;return;}
    player.hidden=false;
    if(source!==newSource){audio?.pause();audio=new Audio(newSource);audio.preload='none';source=newSource;audio.loop=true;audio.volume=Math.max(0,Math.min(1,(info.bgmVolume??30)/100));['play','pause','ended'].forEach(name=>audio.addEventListener(name,updateAudioUI));audio.addEventListener('error',()=>{toast('音乐暂时无法播放，请在后台检查音频文件。',true);updateAudioUI();});}
    player.innerHTML=`<button class="music-toggle" id="music-toggle" aria-label="播放背景音乐">${icon('play')}</button><span class="music-lines" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="music-label">音乐已关闭</span><input type="range" id="music-volume" aria-label="音乐音量" min="0" max="100" value="${Math.round(audio.volume*100)}">`;
    player.querySelector('#music-toggle').onclick=async()=>{if(!audio.paused)audio.pause();else try{await audio.play();}catch(_){toast('音乐无法播放，请检查音频文件。',true);}updateAudioUI();};
    player.querySelector('#music-volume').oninput=event=>{audio.volume=Number(event.target.value)/100;};updateAudioUI();
  }
  function updateAudioUI(){const player=document.getElementById('music-player');if(!audio||!player.querySelector('#music-toggle'))return;const playing=!audio.paused;player.classList.toggle('playing',playing);player.querySelector('#music-toggle').innerHTML=icon(playing?'pause':'play');player.querySelector('#music-toggle').setAttribute('aria-label',playing?'暂停背景音乐':'播放背景音乐');player.querySelector('.music-label').textContent=playing?'正在播放':'音乐已关闭';}
  async function refresh(){try{const next=await Store.get(true),json=JSON.stringify(next);if(json!==lastJSON){lastJSON=json;data=next;render();}}catch(error){toast(error.message,true);}}
  document.getElementById('detail-dialog').addEventListener('close',cleanupDetail);
  for(const id of ['detail-dialog','lightbox'])document.getElementById(id).addEventListener('click',event=>{if(event.target===event.currentTarget){const rect=event.currentTarget.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)event.currentTarget.close();}});
  window.addEventListener('portfolio:external-update',refresh);window.addEventListener('focus',refresh);
  Store.get().then(next=>{data=next;lastJSON=JSON.stringify(data);const featured=data.items.filter(x=>x.featured);const desired=featured.findIndex(x=>x.title==='大胤狂婿');if(desired>=0)currentHero=desired;render();const project=new URLSearchParams(location.search).get('project');if(project)openDetail(project);}).catch(error=>{root.innerHTML=`<main class="page-error"><h1>页面暂时无法读取数据</h1><p>${e(error.message)}</p><button class="button" onclick="location.reload()">重新加载</button></main>`;});
})();
