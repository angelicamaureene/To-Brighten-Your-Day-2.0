/* -------------- script.js -------------- */
const canvas = document.getElementById("fireCanvas");
const ctx    = canvas.getContext("2d");
function resize(){canvas.width=innerWidth;canvas.height=innerHeight;} resize();addEventListener("resize",resize);

const TWO_PI=Math.PI*2,rand=(a,b)=>Math.random()*(b-a)+a,rgb=(r,g,b)=>`rgb(${r},${g},${b})`;

/* particle */
class Particle{constructor(x,y,a,s,c,l=80,g=true){this.x=x;this.y=y;this.vx=Math.cos(a)*s;this.vy=Math.sin(a)*s;this.c=c;this.l=0;this.L=l;this.g=g;}
 update(){this.l++;if(this.g)this.vy+=.02;this.vx*=.98;this.vy*=.98;this.x+=this.vx;this.y+=this.vy;}
 draw(){const o=Math.max(0,1-this.l/this.L);if(!o)return false;ctx.globalAlpha=o;ctx.fillStyle=this.c;ctx.beginPath();ctx.arc(this.x,this.y,2,0,TWO_PI);ctx.fill();return true;}}

/* bg pops */
class Firework{constructor(){this.x=rand(canvas.width*.2,canvas.width*.8);this.y=canvas.height;this.tY=rand(canvas.height*.2,canvas.height*.45);this.col=`hsl(${rand(0,360)}deg,100%,60%)`;this.spark=true;this.parts=[];}
 update(){if(this.spark){this.y-=4;if(this.y<=this.tY){for(let i=0;i<60;i++)this.parts.push(new Particle(this.x,this.y,rand(0,TWO_PI),rand(1,4),this.col));this.spark=false;}else{ctx.globalAlpha=1;ctx.fillStyle=\"#fff\";ctx.fillRect(this.x,this.y,2,2);}}
 this.parts=this.parts.filter(p=>{p.update();return p.draw();});}
 dead(){return!this.spark&&this.parts.length===0;}}

let bg=[],shapes=[];

/* image → sparks */
function imageFireworks(path,scale=.6){
  const img=new Image();img.crossOrigin=\"anonymous\";img.src=path;
  img.onload=()=>{const o=document.createElement(\"canvas\");o.width=img.width;o.height=img.height;const c=o.getContext(\"2d\");c.drawImage(img,0,0);
    const {data,width:hW,height:hH}=c.getImageData(0,0,o.width,o.height);
    const gap=7,bx=canvas.width/2-(hW*scale)/2,by=canvas.height/2-(hH*scale)/2;
    for(let y=0;y<hH;y+=gap)for(let x=0;x<hW;x+=gap){const i=(y*hW+x)*4;if(data[i+3]>128){const r=data[i],g=data[i+1],b=data[i+2];
        shapes.push(new Particle(bx+x*scale,by+y*scale,rand(0,TWO_PI),rand(.5,2),rgb(r,g,b),120,false));}}};}

/* loop */
let last=0,done=false;
function anim(t){
  ctx.globalCompositeOperation=\"destination-out\";ctx.fillStyle=\"rgba(0,0,0,.25)\";ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.globalCompositeOperation=\"lighter\";
  if(t-last>200){bg.push(new Firework());last=t;}
  bg=bg.filter(f=>{f.update();return!f.dead();});
  shapes=shapes.filter(p=>{p.update();return p.draw();});
  if(!done)requestAnimationFrame(anim);
}

/* sequence */
const imgs=[\"images/cherry-blossom.png\",\"images/rainbow.png\",\"images/flower-bouquet-1.png\",\"images/moomin.png\",\"images/strawberry.png\",\"images/flower-bouquet-2.png\",\"images/personal-1.jpg\",\"images/personal-2.jpg\",\"images/personal-3.jpg\"];
let idx=-1,timer;
function next(){idx++;idx<imgs.length?imageFireworks(imgs[idx]):end();}
function end(){done=true;clearInterval(timer);overlay.classList.add(\"show\");}

/* overlay / replay */
const overlay=document.getElementById(\"overlay\");document.getElementById(\"replay\").onclick=start;
function start(){overlay.classList.remove(\"show\");done=false;idx=-1;bg=[];shapes=[];ctx.clearRect(0,0,canvas.width,canvas.height);requestAnimationFrame(anim);next();timer=setInterval(next,20000);}

start();
