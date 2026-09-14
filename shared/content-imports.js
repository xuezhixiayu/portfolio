/* Approved, one-time content additions. Existing records and appearance settings win. */
(() => {
  'use strict';
  const clone=value=>JSON.parse(JSON.stringify(value));
  const titleKey=value=>String(value||'').normalize('NFKC').toLowerCase()
    .replace(/\((?:即将上线|待上线|已上线)\)/g,'').replace(/[\p{P}\p{Z}\p{S}\s]/gu,'');
  function linkKey(value){
    const match=String(value||'').match(/https?:\/\/[^\s<>"'，。]+/i);if(!match)return '';
    try{const url=new URL(match[0]);url.hash='';url.pathname=url.pathname.replace(/\/+$/,'')||'/';
      for(const key of [...url.searchParams.keys()])if(/^(utm_|fbclid$|tt_from$|share_app_id$|share_link_id$)/i.test(key))url.searchParams.delete(key);
      url.searchParams.sort();return url.href;
    }catch(_){return '';}
  }
  function duplicate(items,candidate){
    const item=candidate.item,titles=new Set([item.title,...(candidate.aliases||[])].map(titleKey).filter(Boolean));
    const links=new Set([item.videoUrl,item.embedUrl].map(linkKey).filter(Boolean));
    return items.find(existing=>existing.id===item.id||titles.has(titleKey(existing.title))||
      [existing.videoUrl,existing.embedUrl].map(linkKey).some(link=>link&&links.has(link)));
  }
  function apply(input){
    const data=clone(input),backups=[];let changed=false;
    for(const batch of window.PORTFOLIO_CONTENT_BATCHES||[]){
      if(data.contentImports?.[batch.id])continue;
      backups.push({key:'backup:'+batch.id,value:clone(data)});
      const added=[],skipped=[];
      for(const candidate of batch.candidates){
        const match=duplicate(data.items,candidate);
        if(match)skipped.push({title:candidate.item.title,existingId:match.id});
        else {data.items.push(clone(candidate.item));added.push(candidate.item.id);}
      }
      data.contentImports={...data.contentImports,[batch.id]:{sourceUrl:batch.sourceUrl,completedAt:new Date().toISOString(),added,skipped}};
      changed=true;
    }
    return {data,backups,changed};
  }
  window.PortfolioContentImports={apply};
})();
