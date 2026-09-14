(() => {
  UI.bindTheme();
  document.getElementById('print-resume').onclick=()=>window.print();
  const apply=async()=>{try{const data=await PortfolioStore.get(true),{siteInfo}=data;if(window.PortfolioThemes){const config=PortfolioThemes.resolve(data);PortfolioThemes.apply(config);document.querySelectorAll('a[href^="index.html"]').forEach(a=>a.href=PortfolioThemes.link('index.html',config.theme));const picker=document.getElementById('resume-design');if(picker){picker.value=config.theme;picker.onchange=()=>{const url=new URL(location.href);url.searchParams.set('theme',picker.value);location.assign(url.href);};}}document.querySelector('.resume-document .header h1').textContent=siteInfo.name;document.querySelector('.brand').firstChild.nodeValue=siteInfo.name;document.title=siteInfo.name+' · 个人简历';}catch(error){UI.toast(error.message,true);}};
  window.addEventListener('portfolio:external-update',apply);apply();
})();
