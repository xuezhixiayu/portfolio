(() => {
  'use strict';
  const toDataURL=blob=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('媒体读取失败'));reader.readAsDataURL(blob);});
  async function embedded(value,type='image'){
    if(!value||typeof value!=='string'||value.startsWith('data:'))return value;
    const path=PortfolioStore.assetURL(value,type);if(!path)return value;
    if(/^https?:/.test(path))return value;
    const response=await fetch(path);if(!response.ok)throw new Error('读取媒体失败：'+value);
    return toDataURL(await response.blob());
  }
  async function prepare(data){
    const result=JSON.parse(JSON.stringify(data));
    result.siteInfo.avatar=await embedded(result.siteInfo.avatar);
    if(result.siteInfo.avatarFile)result.siteInfo.avatarFile=await embedded(result.siteInfo.avatarFile);
    result.siteInfo.bgmData=await embedded(result.siteInfo.bgmData,'audio');
    if(result.siteInfo.bgmFile)result.siteInfo.bgmFile=await embedded(result.siteInfo.bgmFile,'audio');
    for(const theme of Object.values(result.siteInfo.presentation?.themes||{})){theme.image=await embedded(theme.image);theme.video=await embedded(theme.video,'video');}
    for(const item of result.items){item.thumbnail=await embedded(item.thumbnail);item.videoData=await embedded(item.videoData,'video');item.images=await Promise.all((item.images||[]).map(value=>embedded(value)));}
    return result;
  }
  function download(value,name,type){const url=URL.createObjectURL(new Blob([value],{type}));const link=document.createElement('a');link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
  async function textFile(path){const response=await fetch(path);if(!response.ok)throw new Error('导出文件读取失败，请通过本地预览地址打开。');return response.text();}
  window.PortfolioExport={
    prepare,
    async json(data){download(JSON.stringify(await prepare(data),null,2),'portfolio-data-backup.json','application/json');},
    async html(data,design){
      if(window.PortfolioThemes){
        const config=PortfolioThemes.resolve(data),names=['site.css','immersive.css','rift.css','store.js','themes.js','ui.js','rift-optics.js','rift.js','immersive.js','app.js'];
        const files=await Promise.all(names.map(name=>textFile('../shared/'+name))),portable=await prepare(data);
        const world=await embedded('../shared/assets/world-gate.png'),ring=await embedded('../shared/assets/portal.png');
        const inline=files.slice(3).map(s=>s.replaceAll('../shared/assets/world-gate.png',world).replaceAll('../shared/assets/portal.png',ring).replace(/<\/script/gi,'<\\/script'));
        const html='<!doctype html><html lang="zh-CN" data-theme="'+config.appearance+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+UI.escape(data.siteInfo.name)+' · 个人作品集</title><style>'+files[0]+files[1]+files[2]+'.offline .nav-resume,.offline .footer-links,.offline .theme-picker,.offline .journey-heading .text-link,.offline .rift-journey-heading .text-link{display:none}</style></head><body class="offline theme-site" data-design="'+config.theme+'"><div id="app"></div><dialog id="detail-dialog" class="detail-dialog"></dialog><dialog id="lightbox" class="lightbox"></dialog><div id="music-player" class="music-player" hidden></div><div id="toast" class="toast" role="status"></div><script>window.PORTFOLIO_OFFLINE=true;window.PORTFOLIO_FORCE_THEME='+JSON.stringify(config.theme)+';window.PORTFOLIO_SEED='+JSON.stringify(portable).replace(/</g,'\\u003c')+';</script>'+inline.map(s=>'<script>'+s+'</script>').join('')+'</body></html>';
        download(html,'portfolio-'+config.theme+'.html','text/html');return;
      }
      const files=await Promise.all(['../shared/site.css','../shared/store.js','../shared/ui.js','../shared/app.js'].map(textFile));
      const portable=await prepare(data);
      const portal=await embedded('../shared/assets/portal.png');
      let script=files[3];if(portal)script=script.replaceAll('../shared/assets/portal.png',portal);
      const escScript=s=>s.replace(/<\/script/gi,'<\\/script');
      const html='<!doctype html><html lang="zh-CN" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+UI.escape(data.siteInfo.name)+' · 作品集</title><style>'+files[0]+'.offline .nav-resume,.offline .footer-links{display:none}</style></head><body class="offline" data-design="'+design+'"><div id="app"></div><dialog id="detail-dialog" class="detail-dialog"></dialog><dialog id="lightbox" class="lightbox"></dialog><div id="music-player" class="music-player" hidden></div><div id="toast" class="toast" role="status"></div><script>window.PORTFOLIO_OFFLINE=true;window.PORTFOLIO_SEED='+JSON.stringify(portable).replace(/</g,'\\u003c')+';</script><script>'+escScript(files[1])+'</script><script>'+escScript(files[2])+'</script><script>'+escScript(script)+'</script></body></html>';
      download(html,'portfolio-'+design+'.html','text/html');
    }
  };
})();
