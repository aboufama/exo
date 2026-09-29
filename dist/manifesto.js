// The manifesto sits on a sheet of paper over the machine, which stays hidden while reading. As the last line
// reaches data-reveal (a viewport fraction, 0 top to 1 bottom), the sheet and the text dissolve into the machine
// and app.js starts the unfold.
const manifesto = document.getElementById('manifesto');
const veil = document.getElementById('veil');
const masthead = document.getElementById('masthead');
const last = document.getElementById('last');
const clamp = (n, a=0, b=1) => Math.min(b, Math.max(a, n));
const ease = n => {n=clamp(n);return n*n*(3-2*n);};
const reveal=parseFloat(last.dataset.reveal);
let lastTop=0, frame=0;

function measure(){
  lastTop=last.getBoundingClientRect().top+scrollY;
  update();
}
function update(){
  frame=0;
  // Where the last line sits in the viewport: 1 at the bottom edge, 0 at the top.
  const at=(lastTop-scrollY)/innerHeight;
  const v=1-ease((reveal-at)/.35), opacity=v.toFixed(3);
  veil.style.opacity=opacity;
  veil.style.visibility=v<.001?'hidden':'';
  manifesto.style.opacity=opacity;
  masthead.classList.toggle('away',scrollY>40 && v>.5);
}
addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(update);},{passive:true});
addEventListener('resize',measure,{passive:true});
addEventListener('pageshow',measure);
new ResizeObserver(measure).observe(manifesto);
measure();

// Film grain: dark specks read on the paper, light specks on the machine.
const grain=document.querySelector('.grain');
if(grain){
  const size=200, canvas=document.createElement('canvas');
  canvas.width=canvas.height=size;
  const context=canvas.getContext('2d'), tile=context.createImageData(size,size), px=tile.data;
  for(let i=0;i<px.length;i+=4){
    const n=Math.random()*2-1;
    px[i]=px[i+1]=px[i+2]=n<0?0:255;
    px[i+3]=n*n*255;
  }
  context.putImageData(tile,0,0);
  grain.style.backgroundImage=`url(${canvas.toDataURL()})`;
}
