var bgmAutoPlayDone = false;

function initBgm() {
  var info = getSiteInfo();
  if (!info.bgmData) { document.getElementById("bgm-player").style.display = "none"; return; }
  document.getElementById("bgm-player").style.display = "flex";
  
  var savedTime = bgmAudio ? bgmAudio.currentTime : 0;
  var wasPlaying = bgmPlaying;
  
  if (bgmAudio) { try { bgmAudio.pause(); } catch(e) {} }
  
  bgmAudio = new Audio(info.bgmData);
  bgmAudio.loop = true;
  var vol = (info.bgmVolume != null ? info.bgmVolume : 30) / 100;
  bgmAudio.volume = vol;
  bgmAudio.currentTime = savedTime;
  bgmPlaying = false;
  
  var volSlider = document.getElementById("bgm-volume");
  volSlider.value = info.bgmVolume || 30;
  document.getElementById("bgm-vol-label").textContent = (info.bgmVolume || 30) + "%";
  var playBtn = document.getElementById("bgm-play-btn");
  
  document.getElementById("bgm-player").addEventListener("click", function(e) {
    e.stopPropagation();
  });
  
  function tryAutoPlay() {
    if (bgmAutoPlayDone && wasPlaying) {
      bgmAudio.play().then(function() {
        bgmPlaying = true;
        playBtn.textContent = "\u23F8";
        playBtn.classList.remove("muted");
      }).catch(function(){});
      return;
    }
    bgmAutoPlayDone = true;
    bgmAudio.play().then(function() {
      bgmPlaying = true;
      playBtn.textContent = "\u23F8";
      playBtn.classList.remove("muted");
    }).catch(function() {
      playBtn.textContent = "\u25B6";
      playBtn.classList.add("muted");
      document.addEventListener("click", function autoPlayOnce(e) {
        if (e.target.closest && e.target.closest("#bgm-player")) return;
        if (!bgmPlaying) {
          bgmAudio.play().catch(function(){});
          bgmPlaying = true;
          playBtn.textContent = "\u23F8";
          playBtn.classList.remove("muted");
        }
        document.removeEventListener("click", autoPlayOnce);
      });
    });
  }
  tryAutoPlay();
  
  volSlider.oninput = null;
  volSlider.addEventListener("input", function() {
    var v = parseInt(this.value) / 100;
    bgmAudio.volume = v;
    document.getElementById("bgm-vol-label").textContent = this.value + "%";
    var si = getSiteInfo(); si.bgmVolume = parseInt(this.value);
    updateSiteInfo({ bgmVolume: parseInt(this.value) });
  });
  
  playBtn.onclick = null;
  playBtn.addEventListener("click", function(e) {
    e.stopPropagation();
    if (bgmPlaying) {
      bgmAudio.pause();
      this.textContent = "\u25B6";
      this.classList.add("muted");
      bgmPlaying = false;
    } else {
      bgmAudio.play().catch(function(){});
      this.textContent = "\u23F8";
      this.classList.remove("muted");
      bgmPlaying = true;
    }
  });
  
  var collapseBtn = document.getElementById("bgm-collapse-btn");
  collapseBtn.onclick = null;
  collapseBtn.addEventListener("click", function(e) {
    e.stopPropagation();
    var p = document.getElementById("bgm-player");
    p.classList.toggle("collapsed");
    this.textContent = p.classList.contains("collapsed") ? "\u25B6" : "\u25C0";
  });
}
