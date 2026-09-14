/* Shared data for the two local design previews. The original site's database is untouched. */
(() => {
  'use strict';
  const namespace = 'jiahui_portfolio_preview_v1';
  const fallbackKey = namespace + '_data';
  const authKey = namespace + '_session';
  let databasePromise, cache, queue = Promise.resolve();
  const clone = value => JSON.parse(JSON.stringify(value));
  let channel;
  try { channel = new BroadcastChannel(namespace); } catch (_) {}
  function openDatabase() {
    if (!databasePromise) databasePromise = new Promise((resolve, reject) => {
      if (!globalThis.indexedDB) return resolve(null);
      const request = indexedDB.open(namespace, 1);
      request.onupgradeneeded = () => request.result.createObjectStore('content');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('无法打开本地数据，请检查浏览器存储设置。'));
      request.onblocked = () => reject(new Error('数据正在被另一窗口占用，请关闭旧预览后重试。'));
    });
    return databasePromise;
  }
  async function read(key) {
    const db = await openDatabase();
    if (!db) {
      const raw = localStorage.getItem(key === 'data' ? fallbackKey : namespace + '_' + key);
      return raw ? JSON.parse(raw) : undefined;
    }
    return new Promise((resolve, reject) => {
      const request = db.transaction('content','readonly').objectStore('content').get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('读取数据失败，请刷新后重试。'));
    });
  }
  async function write(key, value) {
    const db = await openDatabase();
    if (!db) {
      try { localStorage.setItem(key === 'data' ? fallbackKey : namespace + '_' + key, JSON.stringify(value)); }
      catch (_) { throw new Error('保存失败：浏览器存储空间不足，请先导出备份或减少上传文件。'); }
      return;
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction('content','readwrite');
      tx.objectStore('content').put(value,key);
      tx.oncomplete = () => resolve();
      tx.onerror = tx.onabort = () => reject(new Error('保存失败：存储不可用或空间不足。当前更改尚未保存。'));
    });
  }
  async function get(fresh = false) {
    if (window.PORTFOLIO_OFFLINE) return clone(window.PORTFOLIO_SEED);
    if (cache && !fresh) return clone(cache);
    if(window.PortfolioContentImports){
      const db=await openDatabase();
      const prepare=stored=>window.PortfolioContentImports.apply(stored||window.PORTFOLIO_SEED);
      if(db){
        cache=await new Promise((resolve,reject)=>{
          const tx=db.transaction('content','readwrite'),store=tx.objectStore('content');let next,failure;
          const request=store.get('data');
          request.onsuccess=()=>{try{
            const result=prepare(request.result);next=result.data;
            for(const backup of result.backups){const saved=store.get(backup.key);saved.onsuccess=()=>{if(saved.result===undefined)store.put(backup.value,backup.key);};}
            if(!request.result||result.changed)store.put(next,'data');
          }catch(error){failure=error;tx.abort();}};
          tx.oncomplete=()=>resolve(next);
          tx.onerror=tx.onabort=()=>reject(failure||new Error('作品合并保存失败，原有数据未变。请检查浏览器存储空间后刷新。'));
        });
      }else{
        const raw=localStorage.getItem(fallbackKey),result=prepare(raw?JSON.parse(raw):undefined);
        try{
          for(const backup of result.backups){const key=namespace+'_'+backup.key;if(localStorage.getItem(key)===null)localStorage.setItem(key,JSON.stringify(backup.value));}
          if(!raw||result.changed)localStorage.setItem(fallbackKey,JSON.stringify(result.data));
        }catch(_){throw new Error('作品合并保存失败，原有数据未变。请检查浏览器存储空间后刷新。');}
        cache=result.data;
      }
    }else{
      cache = await read('data');
      if (!cache) { cache = clone(window.PORTFOLIO_SEED); await write('data',cache); }
    }
    return clone(cache);
  }
  function notify() {
    channel?.postMessage('changed');
    try { localStorage.setItem(namespace + '_updated',String(Date.now())); } catch (_) {}
    window.dispatchEvent(new CustomEvent('portfolio:updated'));
  }
  function mutate(change) {
    const operation = queue.then(async () => {
      const db=await openDatabase();
      let next;
      if(db){
        next=await new Promise((resolve,reject)=>{
          const tx=db.transaction('content','readwrite'), store=tx.objectStore('content');
          let result, failure;
          const request=store.get('data');
          request.onsuccess=()=>{
            try{result=clone(request.result||window.PORTFOLIO_SEED);change(result);store.put(result,'data');}
            catch(error){failure=error;tx.abort();}
          };
          tx.oncomplete=()=>resolve(result);
          tx.onerror=tx.onabort=()=>reject(failure||new Error('保存失败：存储不可用或空间不足。当前更改尚未保存。'));
        });
      }else{
        next=await get(true);change(next);await write('data',next);
      }
      cache = next;
      notify();
      return clone(next);
    });
    queue = operation.catch(() => {});
    return operation;
  }
  const cleanURL = (value = '') => {
    const match = String(value).trim().match(/https?:\/\/[^\s<>"'，。]+/i);
    if(!match) return '';
    try { const url = new URL(match[0]); return ['http:','https:'].includes(url.protocol) ? url.href : ''; } catch (_) { return ''; }
  };
  const assetURL = (value = '', type = 'image') => {
    if(typeof value !== 'string') return '';
    if(value.startsWith('data:')) return new RegExp('^data:' + type + '/[a-zA-Z0-9.+-]+;base64,').test(value) ? value : '';
    if(value.startsWith('assets/')) return '../shared/' + value;
    if(/^\.\.\/shared\/assets\/[\w.%-]+$/.test(value)) return value;
    return cleanURL(value);
  };
  function validateImport(input) {
    if(!input || typeof input !== 'object' || !input.siteInfo || !Array.isArray(input.items)) throw new Error('请选择包含 siteInfo 和 items 的作品集 JSON 文件。');
    if(input.items.length > 500) throw new Error('单次最多导入 500 部作品。');
    const result=clone(input), ids=new Set();
    result.siteInfo = {...clone(window.PORTFOLIO_SEED.siteInfo), ...result.siteInfo};
    if(!Array.isArray(result.siteInfo.socialLinks)) {
      const old=result.siteInfo.socialLinks || {};
      result.siteInfo.socialLinks=Object.entries(old).map(([platform,url])=>({platform,url,icon:''}));
    }
    if(!Array.isArray(result.siteInfo.skillTags)) result.siteInfo.skillTags=[];
    for(const item of result.items) {
      if(!item || typeof item.title !== 'string' || typeof item.category !== 'string' || !['video','image'].includes(item.type)) throw new Error('作品标题、分类或类型格式不正确。');
      item.id=String(item.id || crypto.randomUUID());
      if(ids.has(item.id)) throw new Error('作品编号重复，请检查导入文件。');
      ids.add(item.id);
      item.tags=Array.isArray(item.tags)?item.tags:[];
      item.images=Array.isArray(item.images)?item.images:[];
    }
    return result;
  }
  async function passwordRecord() {
    return await read('password');
  }
  async function digest(password,salt) {
    if(!crypto.subtle) throw new Error('此浏览器不支持密码加密，请通过本地预览地址打开。');
    const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(salt+password));
    return Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');
  }
  async function verifyPassword(password) {
    const record=await passwordRecord();
    return record ? await digest(password,record.salt) === record.hash : password === 'admin123';
  }
  function isAuthenticated() { try{return sessionStorage.getItem(authKey)==='yes';}catch(_){return false;} }
  function requireAuth() { if(!isAuthenticated()) throw new Error('请先登录后台管理。'); }
  const Store = {
    get, cleanURL, assetURL, validateImport,
    async login(password) { const valid=await verifyPassword(password); if(valid) sessionStorage.setItem(authKey,'yes'); return valid; },
    logout() { sessionStorage.removeItem(authKey); }, isAuthenticated,
    async changePassword(oldPassword,newPassword) {
      requireAuth();
      if(!await verifyPassword(oldPassword)) throw new Error('当前密码不正确。');
      if(newPassword.length<6) throw new Error('新密码至少需要 6 个字符。');
      const salt=crypto.randomUUID();
      await write('password',{salt,hash:await digest(newPassword,salt)});
    },
    async saveItem(item,id) {
      requireAuth();
      return mutate(data=>{
        const index=data.items.findIndex(x=>x.id===id);
        if(id && index<0) throw new Error('该作品已被删除，请刷新列表。');
        if(index>=0) data.items[index]={...data.items[index],...clone(item),id};
        else data.items.push({...clone(item),id:crypto.randomUUID()});
      });
    },
    async removeItem(id) { requireAuth(); return mutate(data=>{data.items=data.items.filter(x=>x.id!==id);}); },
    async saveSite(info) { requireAuth(); return mutate(data=>{data.siteInfo={...data.siteInfo,...clone(info)};}); },
    async replace(input) { requireAuth(); const valid=validateImport(input); return mutate(data=>{Object.keys(data).forEach(k=>delete data[k]);Object.assign(data,valid);}); },
    async reset() { return this.replace(window.PORTFOLIO_SEED); }
  };
  if(channel) channel.onmessage=()=>{cache=null;window.dispatchEvent(new CustomEvent('portfolio:external-update'));};
  window.addEventListener('storage',event=>{if(event.key===namespace+'_updated'){cache=null;window.dispatchEvent(new CustomEvent('portfolio:external-update'));}});
  window.PortfolioStore=Store;
})();
