(() => {
  'use strict';
  const defaults={
    frames:{name:'帧之间',en:'BETWEEN FRAMES',accent:'#fb684c',appearance:'dark',heading:'让想象，有迹可循。',heroId:'mqev99l8l4298',image:'',video:'',focus:30},
    portal:{name:'异世界入口',en:'OTHER WORLDS',accent:'#8edbff',appearance:'dark',heading:'进入，我的想象。',heroId:'mqev99l8l4298',image:'',video:'',focus:28},
    comic:{name:'会动的漫画',en:'STORIES IN MOTION',accent:'#e8402e',appearance:'light',heading:'故事，不止一格。',heroId:'2',image:'',video:'',focus:28}
  };
  const clone=value=>JSON.parse(JSON.stringify(value));
  function normalize(value={}) {
    const input=value&&typeof value==='object'?value:{};
    const result={theme:defaults[input.theme]?input.theme:'frames',motion:Math.max(0,Math.min(1.5,Number.isFinite(Number(input.motion))?Number(input.motion):1)),grain:input.grain!==false,parallax:input.parallax!==false,themes:{}};
    for(const key of Object.keys(defaults)){
      const incoming=input.themes?.[key]||{};
      const item={heroTitle:'',font:'modern',typeScale:1,titlePosition:'left',scenes:{},projectOrder:[],...clone(defaults[key]),...incoming};
      item.accent=/^#[0-9a-f]{6}$/i.test(item.accent)?item.accent:defaults[key].accent;
      item.appearance=['dark','light'].includes(item.appearance)?item.appearance:defaults[key].appearance;
      item.focus=Math.max(0,Math.min(100,Number(item.focus)||0));
      item.heading=String(item.heading||defaults[key].heading).slice(0,42);
      item.heroTitle=String(item.heroTitle||'').slice(0,24);
      item.font=['modern','editorial','serif'].includes(item.font)?item.font:'modern';
      item.typeScale=Math.max(.65,Math.min(1.3,Number(item.typeScale)||1));
      item.projectOrder=Array.isArray(item.projectOrder)?[...new Set(item.projectOrder.filter(x=>typeof x==='string'))]:[];
      item.titlePosition=['left','center','right'].includes(item.titlePosition)?item.titlePosition:'left';
      item.scenes=Object.fromEntries(Object.entries(item.scenes&&typeof item.scenes==='object'?item.scenes:{}).filter(([id])=>!['__proto__','constructor','prototype'].includes(id)).map(([id,value])=>{const scene=value&&typeof value==='object'?value:{};const limit=(number,def,max=100)=>Number.isFinite(Number(number))?Math.max(0,Math.min(max,Number(number))):def;return [id,{focusX:limit(scene.focusX,50),focus:limit(scene.focus,42),color:/^#[a-f0-9]{6}$/i.test(scene.color)?scene.color:'#b6d6ec',transition:['film','ink','warp'].includes(scene.transition)?scene.transition:'film',intensity:limit(scene.intensity,1,1.5)}];}));
      item.image=PortfolioStore.assetURL(item.image);
      item.video=PortfolioStore.assetURL(item.video,'video');
      result.themes[key]=item;
    }
    return result;
  }
  function resolve(data,forced){
    const config=normalize(data?.siteInfo?.presentation);
    const requested=forced||window.PORTFOLIO_FORCE_THEME||new URLSearchParams(location.search).get('theme');
    const theme=defaults[requested]?requested:config.theme;
    return {...config,...config.themes[theme],theme,displayTitle:config.themes[theme].heroTitle||data?.siteInfo?.name||''};
  }
  function apply(config){
    document.body.dataset.design=config.theme;
    document.body.dataset.font=config.font||'modern';
    document.body.dataset.motion=config.motion===0?'off':'on';
    document.body.dataset.grain=String(config.grain);
    document.documentElement.style.scrollBehavior=config.motion===0?'auto':'';
    document.documentElement.dataset.theme=config.appearance;
    document.body.style.setProperty('--accent',config.accent);
    document.body.style.setProperty('--motion',config.motion);
    document.body.style.setProperty('--display-font',{modern:'"Segoe UI","Microsoft YaHei",sans-serif',editorial:'Impact,"Arial Black","Microsoft YaHei",sans-serif',serif:'Georgia,"Noto Serif SC","Songti SC",SimSun,serif'}[config.font]||'sans-serif');
    document.body.style.setProperty('--type-scale',config.typeScale||1);
    document.body.style.setProperty('--title-fit',Math.min(1,6/Math.max(1,Array.from(config.displayTitle||'').length)));
    const hex=config.accent.slice(1),rgb=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16));
    document.body.style.setProperty('--accent-ink',rgb[0]*.299+rgb[1]*.587+rgb[2]*.114>160?'#0c1114':'#ffffff');
    document.body.style.setProperty('--hero-focus',config.focus+'%');
  }
  const link=(page,theme)=>page+(defaults[theme]?'?theme='+theme:'');
  function getScene(item,theme,opening=false){const transition=/2d/i.test(item.category)?'ink':/3d/i.test(item.category)?'warp':'film';return {focusX:50,focus:opening?theme.focus:42,color:{film:'#dfb89b',ink:'#b5dff7',warp:'#dda873'}[transition],transition,intensity:1,...theme.scenes?.[item.id]};}
  window.PortfolioThemes={defaults,normalize,resolve,apply,clone,link,getScene};
})();
