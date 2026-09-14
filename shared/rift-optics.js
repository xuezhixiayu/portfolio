(() => {
  'use strict';
  const vertex=`attribute vec2 position;varying mediump vec2 uv;void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
  const fragment=`precision mediump float;
    varying mediump vec2 uv;
    uniform sampler2D imageA;uniform sampler2D imageB;
    uniform vec2 sizeA;uniform vec2 sizeB;uniform vec2 resolution;uniform vec2 focusA;uniform vec2 focusB;uniform vec2 pointer;
    uniform float clock;uniform float power;uniform float cut;uniform float tear;uniform float progress;uniform float transition;
    vec2 cover(vec2 p,vec2 size,vec2 focus){float screen=resolution.x/resolution.y;float aspect=size.x/size.y;vec2 visible=vec2(min(1.,screen/aspect),min(1.,aspect/screen));return clamp(p*visible+(1.-visible)*vec2(focus.x,1.-focus.y),.001,.999);}
    float seam(float y){return cut+sin(y*12.+clock*.35)*.012+sin(y*31.-clock*.6)*.003;}
    void main(){
      vec2 p=uv;vec2 delta=p-pointer;delta.x*=resolution.x/resolution.y;
      float lens=exp(-dot(delta,delta)*13.);float ripple=sin(length(delta)*28.-clock*1.8)*lens*.003*power;
      p+=(uv-pointer)*ripple;p+=(pointer-.5)*.013*power;
      float distanceToCut=abs(uv.x-seam(uv.y));float fracture=exp(-distanceToCut*80.)*tear;
      p.x+=sin(uv.y*45.+clock)*fracture*.028*power;
      float width=tear*(max(cut,1.-cut)+.035);float blend=progress;
      if(transition>.5&&transition<1.5){float jagged=sin(uv.y*23.)*.018+sin(uv.y*61.)*.005;blend=1.-smoothstep(progress*.78-.015,progress*.78+.015,abs(uv.x-.5+jagged));}
      if(transition>1.5){vec2 center=uv-.5;center.x*=resolution.x/resolution.y;float radius=length(center);blend=1.-smoothstep(progress*1.3-.03,progress*1.3+.03,radius);p+=normalize(center+vec2(.0001))*sin(radius*28.-progress*11.)*.012*sin(progress*3.14159)*power;}
      float reveal=(1.-smoothstep(width-.007,width+.007,distanceToCut))*step(.001,tear);
      blend=max(blend,reveal);
      if(progress<.001&&tear<.001)blend=0.;if(progress>.999||tear>.999)blend=1.;
      vec2 aUV=cover(p,sizeA,focusA);vec2 bUV=cover(p,sizeB,focusB);
      float split=(lens*.0008+fracture*.01)*power;
      vec3 a=vec3(texture2D(imageA,aUV+vec2(split,0.)).r,texture2D(imageA,aUV).g,texture2D(imageA,aUV-vec2(split,0.)).b);
      vec3 b=vec3(texture2D(imageB,bUV-vec2(split,0.)).r,texture2D(imageB,bUV).g,texture2D(imageB,bUV+vec2(split,0.)).b);
      vec3 color=mix(a,b,blend);float luma=dot(color,vec3(.299,.587,.114));color=mix(vec3(luma),color,.9)*.88;
      float edge=exp(-abs(distanceToCut-width)*320.)*min(1.,tear*15.);color+=vec3(.8,.9,1.)*edge*.65;
      gl_FragColor=vec4(color,1.);
    }`;
  function create(canvas,onReady){
    if(!canvas||matchMedia('(max-width:760px)').matches)return null;
    let gl,program,buffer,disposed=false,lost=false;const textures=new Map(),shaders=[];
    try{
      gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:'low-power'});if(!gl)return null;
      const compile=(type,source)=>{const shader=gl.createShader(type);shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error('Shader unavailable');return shader;};
      program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Optics unavailable');
      gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
      const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    }catch(_){if(gl){shaders.forEach(s=>gl.deleteShader(s));if(program)gl.deleteProgram(program);if(buffer)gl.deleteBuffer(buffer);}return null;}
    const uniforms=Object.fromEntries(['imageA','imageB','sizeA','sizeB','resolution','focusA','focusB','pointer','clock','power','cut','tear','progress','transition'].map(key=>[key,gl.getUniformLocation(program,key)]));
    const lostListener=event=>{event.preventDefault();lost=true;canvas.classList.remove('is-ready');};canvas.addEventListener('webglcontextlost',lostListener);
    const restoredListener=()=>{lost=true;canvas.classList.remove('is-ready');};canvas.addEventListener('webglcontextrestored',restoredListener);
    function getTexture(src){
      if(!src)return null;
      if(textures.has(src)){const value=textures.get(src);value.touched=performance.now();return value;}
      const value={ready:false,failed:false,touched:performance.now(),texture:null,image:null,width:1,height:1};textures.set(src,value);
      const image=new Image();value.image=image;if(/^https?:/i.test(src))image.crossOrigin='anonymous';
      image.onload=()=>{if(disposed||lost||textures.get(src)!==value)return;try{const texture=gl.createTexture();value.texture=texture;gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);value.width=image.naturalWidth;value.height=image.naturalHeight;value.ready=gl.getError()===gl.NO_ERROR;if(!value.ready)value.failed=true;}catch(_){value.failed=true;}onReady();};image.onerror=()=>{value.failed=true;onReady();};image.src=src;return value;
    }
    let lastDraw=0;
    return {
      draw({a,b,time,strength,pointer,cut,drag,blend,transition}){
        if(disposed||lost)return false;const first=getTexture(a.cover),second=getTexture(b.cover);if(!first?.ready||!second?.ready)return false;
        if(time-lastDraw<1/35)return true;lastDraw=time;
        const ratio=Math.min(devicePixelRatio||1,1.25),width=Math.max(1,Math.round(canvas.clientWidth*ratio)),height=Math.max(1,Math.round(canvas.clientHeight*ratio));if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height);}
        gl.useProgram(program);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,first.texture);gl.uniform1i(uniforms.imageA,0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,second.texture);gl.uniform1i(uniforms.imageB,1);
        gl.uniform2f(uniforms.sizeA,first.width,first.height);gl.uniform2f(uniforms.sizeB,second.width,second.height);gl.uniform2f(uniforms.resolution,width,height);gl.uniform2f(uniforms.focusA,a.focusX/100,a.focus/100);gl.uniform2f(uniforms.focusB,b.focusX/100,b.focus/100);gl.uniform2f(uniforms.pointer,pointer[0],pointer[1]);
        for(const [key,value]of Object.entries({clock:time,power:strength,cut,tear:drag,progress:blend,transition:{film:0,ink:1,warp:2}[transition]||0}))gl.uniform1f(uniforms[key],value);
        gl.drawArrays(gl.TRIANGLES,0,6);
        if(textures.size>4){for(const [src,value]of [...textures].sort((a,b)=>a[1].touched-b[1].touched)){if(textures.size<=4)break;if(src===a.cover||src===b.cover)continue;if(value.texture)gl.deleteTexture(value.texture);if(value.image){value.image.onload=value.image.onerror=null;}textures.delete(src);}}
        return true;
      },
      dispose(){disposed=true;canvas.removeEventListener('webglcontextlost',lostListener);canvas.removeEventListener('webglcontextrestored',restoredListener);for(const value of textures.values()){if(value.texture)gl.deleteTexture(value.texture);if(value.image){value.image.onload=value.image.onerror=null;}}textures.clear();gl.deleteBuffer(buffer);gl.deleteProgram(program);shaders.forEach(s=>gl.deleteShader(s));canvas.classList.remove('is-ready');}
    };
  }
  window.RiftOptics={create};
})();
