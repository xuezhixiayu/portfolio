// ========== Portfolio Data Manager (IndexedDB - persistent connection) ==========
var DB_NAME = "portfolio_db";
var STORE_NAME = "portfolio_store";
var DATA_KEY = "portfolio_data";
var ADMIN_KEY = "portfolio_admin_pass";
var DEFAULT_PASSWORD = "admin123";

var DEFAULT_DATA = {
  siteInfo: {
    name: "我的作品集", title: "AI 漫剧创作者",
    bio: "你好！我是一名 AI 漫剧创作者。擅长使用 Midjourney、Runway、Pika、ElevenLabs 等前沿 AI 工具，从脚本撰写、画面生成、动画制作到配音配乐，全流程独立完成。这里展示我的原创 AI 漫剧作品，每一部都是创意与技术的融合实验。",
    avatar: "",
    socialLinks: [
      { platform: "B站", url: "https://space.bilibili.com/", icon: "📺" },
      { platform: "YouTube", url: "https://youtube.com/@", icon: "▶️" },
      { platform: "邮箱", url: "mailto:hello@example.com", icon: "📧" }
    ]
  },
  items: []
};

// ========== Persistent DB Connection ==========
var _db = null;
var _dbReady = false;
var _dbReadyCallbacks = [];

function getDB() {
  return new Promise(function(resolve, reject) {
    if (_dbReady) { resolve(_db); return; }
    _dbReadyCallbacks.push({ resolve: resolve, reject: reject });
    if (_dbReadyCallbacks.length > 1) return; // Already opening
    
    var req = indexedDB.open(DB_NAME, 2);
    req.onupgradeneeded = function(e) {
      var db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = function(e) {
      _db = e.target.result;
      _db.onclose = function() { _dbReady = false; _db = null; };
      _dbReady = true;
      var cbs = _dbReadyCallbacks;
      _dbReadyCallbacks = [];
      cbs.forEach(function(cb) { cb.resolve(_db); });
    };
    req.onerror = function(e) {
      var cbs = _dbReadyCallbacks;
      _dbReadyCallbacks = [];
      cbs.forEach(function(cb) { cb.reject(e.target.error); });
    };
  });
}

function dbRead(key) {
  return getDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var tx = db.transaction(STORE_NAME, "readonly");
      var store = tx.objectStore(STORE_NAME);
      var req = store.get(key);
      req.onsuccess = function() { resolve(req.result); };
      req.onerror = function() { reject(req.error); };
    });
  });
}

function dbWrite(key, value) {
  return getDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var tx = db.transaction(STORE_NAME, "readwrite");
      var store = tx.objectStore(STORE_NAME);
      var req = store.put(value, key);
      req.onsuccess = function() { resolve(); };
      req.onerror = function() { reject(req.error); };
      // Ensure transaction completes
      tx.oncomplete = function() { resolve(); };
      tx.onerror = function() { reject(tx.error); };
    });
  });
}

// ========== Data Access ==========
var _dataCache = null;


function loadDataSync() {
  if (_dataCache) return _dataCache;
  // Try localStorage migration first (sync)
  try {
    var raw = localStorage.getItem("portfolio_data");
    if (raw) {
      _dataCache = JSON.parse(raw);
      localStorage.removeItem("portfolio_data");
      // Async save to IndexedDB
      dbWrite(DATA_KEY, _dataCache);
      _dataLoaded = true;
      return _dataCache;
    }
  } catch(e) {}
  _dataCache = JSON.parse(JSON.stringify(DEFAULT_DATA));
  return _dataCache;
}

function loadDataAsync() {
  return dbRead(DATA_KEY).then(function(data) {
    if (data) {
      if (data.siteInfo && data.siteInfo.socialLinks && !Array.isArray(data.siteInfo.socialLinks)) {
        var old = data.siteInfo.socialLinks;
        var arr = [];
        if (old.bilibili) arr.push({ platform: "B站", url: old.bilibili, icon: "📺" });
        if (old.youtube) arr.push({ platform: "YouTube", url: old.youtube, icon: "▶️" });
        if (old.email) arr.push({ platform: "邮箱", url: old.email, icon: "📧" });
        data.siteInfo.socialLinks = arr;
      }
      _dataCache = data;
      return data;
    }
    // No DB data, try localStorage migration
    try {
      var raw = localStorage.getItem("portfolio_data");
      if (raw) {
        data = JSON.parse(raw);
        localStorage.removeItem("portfolio_data");
        _dataCache = data;
        dbWrite(DATA_KEY, data);
        return data;
      }
    } catch(e) {}
    _dataCache = JSON.parse(JSON.stringify(DEFAULT_DATA));
    dbWrite(DATA_KEY, _dataCache);
    return _dataCache;
  });
}

function saveData(data) {
  _dataCache = data;
  _dataLoaded = true;
  return dbWrite(DATA_KEY, data).then(function() {
    try { localStorage.setItem("portfolio_data_version", Date.now().toString()); } catch(e) {}
  }).catch(function(e) {
    console.error("IndexedDB write failed:", e);
    // Fallback: try to save to localStorage
    try { localStorage.setItem("portfolio_data", JSON.stringify(data)); } catch(e2) {}
  });
}

function getItems() { return loadDataSync().items; }
function getSiteInfo() { return loadDataSync().siteInfo; }

function getItemById(id) {
  return loadDataSync().items.find(function(item) { return item.id === id; });
}

function addItem(item) {
  var data = loadDataSync();
  item.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  item.featured = item.featured || false;
  item.images = item.images || [];
  item.tags = item.tags || [];
  data.items.push(item);
  saveData(data);
  return item;
}

function updateItem(id, updates) {
  var data = loadDataSync();
  var idx = data.items.findIndex(function(item) { return item.id === id; });
  if (idx === -1) return null;
  data.items[idx] = Object.assign({}, data.items[idx], updates);
  saveData(data);
  return data.items[idx];
}

function deleteItem(id) {
  var data = loadDataSync();
  data.items = data.items.filter(function(item) { return item.id !== id; });
  saveData(data);
}

function updateSiteInfo(info) {
  var data = loadDataSync();
  data.siteInfo = Object.assign({}, data.siteInfo, info);
  saveData(data);
}

function adminLogin(password) {
  var stored = localStorage.getItem(ADMIN_KEY) || DEFAULT_PASSWORD;
  if (password === stored) { sessionStorage.setItem("portfolio_admin", "true"); return true; }
  return false;
}
function isAdminLoggedIn() { return sessionStorage.getItem("portfolio_admin") === "true"; }
function adminLogout() { sessionStorage.removeItem("portfolio_admin"); }
function changeAdminPassword(oldPass, newPass) {
  var stored = localStorage.getItem(ADMIN_KEY) || DEFAULT_PASSWORD;
  if (oldPass === stored) { localStorage.setItem(ADMIN_KEY, newPass); return true; }
  return false;
}
function resetToDefaults() {
  _dataCache = JSON.parse(JSON.stringify(DEFAULT_DATA));
  _dataLoaded = true;
  saveData(_dataCache);
  return _dataCache;
}
function getCategories() {
  var items = getItems();
  var cats = items.map(function(i) { return i.category; });
  var unique = [];
  cats.forEach(function(c) { if (unique.indexOf(c) === -1) unique.push(c); });
  return unique;
}
