(() => {
  'use strict';
  const {escape:e}=UI,T=PortfolioThemes,S=PortfolioStore;
  function render(container,{items,theme,onChange}){
    if(!items.length){container.innerHTML='<p class="form-help">添加作品后即可设置场景。</p>';return;}
    const opening=items.find(x=>x.id===theme.heroId)||items.find(x=>x.featured)||items[0];let selected=opening.id;
    container.innerHTML=`<div class="rift-scene-editor"><h4>每部作品的场景</h4><p>取景与效果独立保存。上传到作品中的本地视频可作为动态场景。</p><div class="field"><label for="scene-project">编辑作品</label><select id="scene-project">${items.map(item=>`<option value="${e(item.id)}" ${item.id===selected?'selected':''}>${e(item.title)}</option>`).join('')}</select></div><div id="scene-controls"></div></div>`;
    const controls=container.querySelector('#scene-controls');
    function show(){
      const item=items.find(x=>x.id===selected),scene=T.getScene(item,theme,item===opening),image=S.assetURL(item===opening&&theme.image?theme.image:item.thumbnail);
      controls.innerHTML=`<div class="scene-crop-preview" style="--crop-color:${scene.color}">${image?`<img src="${e(image)}" alt="${e(item.title)}取景预览" style="object-position:${scene.focusX}% ${scene.focus}%">`:''}<span>${e(item.category)}</span><i aria-hidden="true"></i></div><div class="scene-axis-fields"><div class="field"><label for="scene-focusX">左右取景 <output>${scene.focusX}%</output></label><input id="scene-focusX" data-scene-field="focusX" type="range" min="0" max="100" step="1" value="${scene.focusX}"></div><div class="field"><label for="scene-focus">上下取景 <output>${scene.focus}%</output></label><input id="scene-focus" data-scene-field="focus" type="range" min="0" max="100" step="1" value="${scene.focus}"></div></div><div class="form-grid scene-look-fields"><div class="field"><label for="scene-color">场景色</label><input id="scene-color" data-scene-field="color" type="color" value="${scene.color}"></div><div class="field"><label for="scene-transition">切入下一幕</label><select id="scene-transition" data-scene-field="transition">${[['film','电影叠化'],['ink','墨迹裂缝'],['warp','空间扭曲']].map(([key,label])=>`<option value="${key}" ${key===scene.transition?'selected':''}>${label}</option>`).join('')}</select></div></div><div class="field scene-intensity"><label for="scene-intensity">场景动效 <output>${Math.round(scene.intensity*100)}%</output></label><input id="scene-intensity" data-scene-field="intensity" type="range" min="0" max="1.5" step="0.1" value="${scene.intensity}"><small>与全站动效强度共同生效；0 为静态画面与直接切换。</small></div><button type="button" class="button scene-reset" id="reset-scene">恢复此作品的默认效果</button>`;
      controls.querySelectorAll('[data-scene-field]').forEach(input=>input.addEventListener('input',()=>{const name=input.dataset.sceneField;scene[name]=['color','transition'].includes(name)?input.value:Number(input.value);theme.scenes[selected]={...scene};const output=input.closest('.field').querySelector('output');if(output)output.textContent=name==='intensity'?Math.round(scene.intensity*100)+'%':scene[name]+'%';const cover=controls.querySelector('.scene-crop-preview img');if(cover)cover.style.objectPosition=scene.focusX+'% '+scene.focus+'%';controls.querySelector('.scene-crop-preview').style.setProperty('--crop-color',scene.color);onChange();}));
      controls.querySelector('#reset-scene').addEventListener('click',()=>{delete theme.scenes[selected];onChange();show();});
    }
    container.querySelector('#scene-project').addEventListener('change',event=>{selected=event.target.value;show();});show();
  }
  window.RiftSceneEditor={render};
})();
