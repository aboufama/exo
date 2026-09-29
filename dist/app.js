import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const stage = document.getElementById('stage');
const journey = document.getElementById('journey');
const manifesto = document.getElementById('manifesto');
const last = document.getElementById('last');
const host = document.getElementById('model');
const poster = document.getElementById('poster');
const identity = document.getElementById('identity');
const loading = document.getElementById('loading-line');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = (n, a=0, b=1) => Math.min(b, Math.max(a, n));
const ease = n => {n=clamp(n);return n*n*(3-2*n);};
let target=0, progress=0, model, mixer, action, clip, renderer, camera, scene, bounds, startBounds;
let frame=0, lastTime=0, loaded=false, lastPose=-1, lastView=-1, lastReduced=null, trackStart=0, trackSpan=1;
const center=new THREE.Vector3();
const startScreenCenter=new THREE.Vector3();

// The unfold starts with the reveal, as the manifesto's last line reaches data-reveal (see manifesto.js),
// and runs to the end of the page.
function measure(){
  trackStart=last?last.getBoundingClientRect().top+scrollY-innerHeight*parseFloat(last.dataset.reveal):journey.getBoundingClientRect().top+scrollY;
  trackSpan=Math.max(1,document.documentElement.scrollHeight-innerHeight-trackStart);
}
function readScroll(){
  target=clamp((scrollY-trackStart)/trackSpan);
  requestFrame();
}
function setPose(p){
  if(!action || Math.abs(p-lastPose)<1e-7)return;
  action.enabled=true;action.paused=false;
  mixer.setTime(p*clip.duration);action.paused=true;
  model.updateMatrixWorld(true);lastPose=p;
}
function fitCamera(p){
  if(!bounds)return;
  const w=stage.clientWidth,h=stage.clientHeight,aspect=w/h;
  const turn=THREE.MathUtils.degToRad(14*(1-ease(p)));
  camera.position.copy(center).add(new THREE.Vector3(Math.sin(turn)*3,.20,Math.cos(turn)*3));
  camera.lookAt(center);camera.updateMatrixWorld(true);
  const projectedSize=bound=>{
    const box=new THREE.Box3();
    for(const x of [bound.min.x,bound.max.x])for(const y of [bound.min.y,bound.max.y])for(const z of [bound.min.z,bound.max.z])box.expandByPoint(new THREE.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));
    return box.getSize(new THREE.Vector3());
  };
  const extent=projectedSize(bounds),start=projectedSize(startBounds);
  const fit=extent=>Math.max(extent.y/(w<600?.60:.68),extent.x/(aspect*(w<600?.91:.83)));
  const fullHeight=THREE.MathUtils.lerp(fit(start),fit(extent),ease(clamp(p*1.5)));
  const fullWidth=fullHeight*aspect;
  const reveal=ease(p);
  const offsetX=startScreenCenter.x*(1-reveal);
  const offsetY=startScreenCenter.y*(1-reveal);
  const shift=((w<600?.035:.045)+.075)*reveal;
  camera.left=offsetX-fullWidth/2;camera.right=offsetX+fullWidth/2;
  camera.top=offsetY+fullHeight*(.5-shift);camera.bottom=offsetY+fullHeight*(-.5-shift);
  camera.updateProjectionMatrix();
}
function paint(now){
  frame=0;
  const dt=lastTime?Math.min((now-lastTime)/1000,.05):1/60;lastTime=now;
  // Glide toward the scroll position, but snap on big jumps (a restored scroll on refresh, the End key)
  // so the unfold and the Suit 1 fade don't replay.
  const gap=target-progress;
  progress=reduced.matches || Math.abs(gap)>.25?target:progress+gap*(1-Math.exp(-dt*12));
  if(Math.abs(target-progress)<.00015)progress=target;
  const motion=clamp(progress/.92);
  // Suit 1 fades in early, as the vellum clears and the arms begin to open. The fade follows scroll
  // rather than a timer, so a refresh at the bottom shows it at once instead of replaying it.
  const shown=ease((progress-.28)/.14);
  identity.style.opacity=shown.toFixed(3);
  identity.style.visibility=shown>0?'visible':'hidden';
  identity.setAttribute('aria-hidden',String(shown<.5));
  if(loaded){
    const view=reduced.matches?(motion<.5?0:1):motion;
    // While the manifesto is read the pose is fixed, so skip identical renders.
    if(view!==lastView || reduced.matches!==lastReduced){
      setPose(view);
      fitCamera(reduced.matches?0:motion);
      renderer.render(scene,camera);
      lastView=view;lastReduced=reduced.matches;
    }
  } else if(reduced.matches || !renderer){
    poster.src=motion<.5?'./assets/standing.png':'./assets/spread.png';
  }
  if(Math.abs(target-progress)>.00001)requestFrame();
}
function requestFrame(){if(!frame)frame=requestAnimationFrame(paint);}
// The line under Suit 1 is scaled so its ink spans exactly the wordmark's ink, edge to edge.
const wordmark=document.getElementById('wordmark');
const subtitle=identity.querySelector('p');
const pen=document.createElement('canvas').getContext('2d');
function ink(el){
  const text=el.textContent, range=document.createRange();
  range.selectNodeContents(el);
  const box=range.getBoundingClientRect(), style=getComputedStyle(el);
  pen.font=`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const first=pen.measureText(text[0]), final=pen.measureText(text[text.length-1]);
  const spacing=parseFloat(style.letterSpacing)||0; // trails the last glyph in the range box
  return {left:box.left-first.actualBoundingBoxLeft, right:box.right-spacing-(final.width-final.actualBoundingBoxRight)};
}
function fitSubtitle(){
  subtitle.style.fontSize='';subtitle.style.transform='';
  let mark=ink(wordmark), line=ink(subtitle);
  subtitle.style.fontSize=`${parseFloat(getComputedStyle(subtitle).fontSize)*(mark.right-mark.left)/(line.right-line.left)}px`;
  mark=ink(wordmark);line=ink(subtitle); // the shared box may have changed width
  subtitle.style.transform=`translateX(${(mark.left-line.left).toFixed(2)}px)`;
}
function resize(){
  renderer?.setSize(stage.clientWidth,stage.clientHeight,false);
  lastView=-1;measure();readScroll();fitSubtitle();
}
addEventListener('scroll',readScroll,{passive:true});
addEventListener('resize',resize,{passive:true});
addEventListener('pageshow',()=>{measure();readScroll();});
reduced.addEventListener('change',requestFrame);
if(manifesto)new ResizeObserver(()=>{measure();readScroll();}).observe(manifesto);
measure();readScroll();fitSubtitle();
document.fonts?.ready.then(fitSubtitle);

try{
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0xffffff,0);
  renderer.setSize(stage.clientWidth,stage.clientHeight,false);
  renderer.domElement.setAttribute('aria-hidden','true');host.append(renderer.domElement);
  scene=new THREE.Scene();camera=new THREE.OrthographicCamera(-1,1,1,-1,.01,20);
  const gltf=await new GLTFLoader().loadAsync('./assets/exo.glb',event=>{
    if(event.total)loading.style.transform=`scaleX(${Math.max(.02,event.loaded/event.total)})`;
  });
  model=gltf.scene;scene.add(model);
  const black=new THREE.MeshBasicMaterial({color:0x000000,side:THREE.DoubleSide,toneMapped:false});
  model.traverse(object=>{if(object.isMesh){object.material=black;object.frustumCulled=false;}});
  clip=THREE.AnimationClip.findByName(gltf.animations,'StandingToSpread');
  if(!clip)throw new Error('The EXO motion is missing.');
  mixer=new THREE.AnimationMixer(model);action=mixer.clipAction(clip);
  action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();
  setPose(0);startBounds=new THREE.Box3().setFromObject(model);
  bounds=new THREE.Box3();
  for(let i=0;i<=60;i++){setPose(i/60);bounds.union(new THREE.Box3().setFromObject(model));}
  bounds.getCenter(center);setPose(0);fitCamera(0);
  // Center the visible opening silhouette, rather than the entire motion envelope.
  const projectedStart=new THREE.Box3(),vertex=new THREE.Vector3(),viewMatrix=new THREE.Matrix4();
  model.traverseVisible(object=>{
    if(!object.isMesh)return;
    viewMatrix.multiplyMatrices(camera.matrixWorldInverse,object.matrixWorld);
    const positions=object.geometry.attributes.position;
    for(let i=0;i<positions.count;i++)projectedStart.expandByPoint(vertex.fromBufferAttribute(positions,i).applyMatrix4(viewMatrix));
  });
  projectedStart.getCenter(startScreenCenter);
  setPose(clamp(progress/.92));loaded=true;
  document.body.classList.add('ready');requestFrame();
}catch(error){
  console.error('EXO motion could not load',error);
  renderer?.domElement.remove();renderer=null;
  loading.style.opacity='0';
  requestFrame();
}
