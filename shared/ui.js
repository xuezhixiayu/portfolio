(() => {
  'use strict';
  const shapes = {
    arrow:'M7 17 17 7M7 7h10v10',down:'m6 9 6 6 6-6',play:'m9 5 11 7-11 7V5Z',pause:'M9 5v14M15 5v14',close:'m6 6 12 12M18 6 6 18',
    sun:'M12 3v1M12 20v1M3 12h1M20 12h1M5.6 5.6l.7.7M17.7 17.7l.7.7M5.6 18.4l.7-.7M17.7 6.3l.7-.7M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    menu:'M4 6h16M4 12h16M4 18h16',mail:'M3 5h18v14H3V5Zm0 1 9 7 9-7',copy:'M9 9h12v12H9V9ZM5 15H3V3h12v2',
    plus:'M12 5v14M5 12h14',edit:'m15 5 4 4M4 20l4-1L20 7l-4-4L4 15v5Z',trash:'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7',
    grid:'M3 3h7v7H3V3ZM14 3h7v7h-7V3ZM3 14h7v7H3v-7ZM14 14h7v7h-7v-7Z',settings:'M4 7h16M4 17h16M8 4v6M16 14v6',
    lock:'M5 10h14v11H5V10ZM8 10V6a4 4 0 0 1 8 0v4M12 14v3',download:'M12 3v12m-5-5 5 5 5-5M4 15v6h16v-6',back:'m12 5-7 7 7 7M5 12h15',
    volume:'M4 9h4l5-4v14l-5-4H4V9ZM17 8a6 6 0 0 1 0 8',check:'m5 12 4 4L19 6',upload:'M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    file:'M6 2h8l4 4v16H6V2Zm8 0v6h4M9 12h6M9 16h6',logout:'M9 3H3v18h6M9 12h12m-5-5 5 5-5 5'
  };
  const icon=(name)=>`<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${shapes[name]||shapes.arrow}"/></svg>`;
  const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function toast(message,error=false) {
    let box=document.getElementById('toast');
    if(!box) {box=document.createElement('div');box.id='toast';box.setAttribute('role','status');document.body.appendChild(box);}
    box.textContent=message;box.className='toast visible'+(error?' error':'');
    clearTimeout(toast.timer);toast.timer=setTimeout(()=>box.classList.remove('visible'),4200);
  }
  async function copy(value) {
    try {await navigator.clipboard.writeText(value);toast('已复制');}
    catch (_) { const field=document.createElement('textarea');field.value=value;field.style.position='fixed';field.style.opacity='0';document.body.appendChild(field);field.select();const ok=document.execCommand('copy');field.remove();toast(ok?'已复制':'复制不可用，请直接选中文本复制',!ok); }
  }
  const design=document.body.dataset.design || 'cinema';
  function theme() {
    let value='dark';try{value=localStorage.getItem('jiahui_'+design+'_theme')||'dark';}catch(_){}
    document.documentElement.dataset.theme=value;
  }
  function bindTheme(){ document.querySelectorAll('[data-theme-toggle]').forEach(button=>button.addEventListener('click',()=>{const value=document.documentElement.dataset.theme==='light'?'dark':'light';document.documentElement.dataset.theme=value;try{localStorage.setItem('jiahui_'+design+'_theme',value);}catch(_){};button.setAttribute('aria-label',value==='dark'?'切换亮色':'切换暗色');})); }
  function socialHTML(links) {
    return (links||[]).map(link=>{
      const url=PortfolioStore.cleanURL(link.url);
      return url ? `<a class="contact-item" href="${escape(url)}" target="_blank" rel="noopener noreferrer"><span>${escape(link.platform)}</span>${icon('arrow')}</a>` : `<button class="contact-item" type="button" data-copy="${escape(link.url)}"><span>${escape(link.platform)}<small>${escape(link.url)}</small></span>${icon('copy')}</button>`;
    }).join('');
  }
  function bindCopy(root=document){root.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',()=>copy(button.dataset.copy)));}
  theme();
  window.UI={icon,escape,toast,copy,design,bindTheme,socialHTML,bindCopy};
})();
