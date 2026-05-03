export const getEditorHTML = (roomW = 5, roomH = 5) => `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
  <title>Room 3D</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:100%;height:100%;overflow:hidden;background:#1a1a2e}
    canvas{display:block;touch-action:none}
    #inv-canvas{touch-action:pan-x;}
    #inventory{touch-action:pan-x;}
    #overlay{
      position:fixed;inset:0;background:#1a1a2e;
      display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;
    }
    #overlay.hidden{display:none}
    .ov-icon{font-size:44px}
    .ov-text{color:#a0a0c0;font-family:sans-serif;font-size:14px}
    #loading{
      position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
      background:rgba(0,0,0,0.82);color:#fff;
      padding:10px 22px;border-radius:12px;
      font-family:sans-serif;font-size:13px;
      display:none;z-index:200;pointer-events:none;
    }
    #info{
      position:fixed;bottom:120px;left:50%;transform:translateX(-50%);
      background:rgba(0,0,0,0.52);color:rgba(255,255,255,0.88);
      padding:5px 14px;border-radius:16px;
      font-family:sans-serif;font-size:11px;
      pointer-events:none;z-index:100;white-space:nowrap;
    }
    #topbar{
      position:fixed;top:10px;right:10px;
      display:flex;flex-direction:column;gap:7px;z-index:100;
    }
    .tbtn{
      width:40px;height:40px;border-radius:10px;
      border:1px solid rgba(255,255,255,0.2);
      background:rgba(15,52,96,0.75);
      color:#fff;font-size:17px;cursor:pointer;
      display:flex;align-items:center;justify-content:center;
    }
    #selbar{
      position:fixed;top:10px;left:10px;
      background:rgba(15,52,96,0.92);
      border:1px solid rgba(255,255,255,0.18);
      border-radius:13px;padding:7px 10px;
      display:none;align-items:center;gap:7px;z-index:100;
      box-shadow:0 4px 20px rgba(0,0,0,0.4);
    }
    #selbar.show{display:flex}
    #selname{color:#fff;font-family:sans-serif;font-size:12px;font-weight:700;max-width:90px;overflow:hidden;text-overflow:ellipsis}
    .selbtn{
      background:rgba(255,255,255,0.18);border:none;border-radius:8px;
      color:#fff;width:33px;height:33px;font-size:15px;cursor:pointer;
      display:flex;align-items:center;justify-content:center;
    }
    .selbtn.red{background:rgba(233,69,96,0.75)}
    #inventory{
      position:fixed;bottom:10px;left:0px;right:0px;height:110px;
      background:#0a0a1a;border-top:2px solid #848494;
      z-index:10;display:none;
      overflow-x:auto;overflow-y:hidden;
      -webkit-overflow-scrolling:touch;
    }
    #inventory::-webkit-scrollbar{height:0;display:none;}
    #inv-wrap{display:flex;flex-direction:column;height:110px;width:max-content;position:relative;}
    #inv-labels{
      position:absolute;top:0;left:0;height:110px;
      display:flex;pointer-events:none;z-index:5;
    }
    .slot-lbl{
      flex:0 0 auto;display:flex;
      align-items:flex-end;justify-content:center;
      padding-bottom:4px;
    }
    .sh{
      font-size:14px;font-family:sans-serif;color:#fff;
      font-weight:bold;line-height:1;
      width:22px;height:22px;border-radius:50%;
      background:rgba(15,52,96,0.85);
      display:flex;align-items:center;justify-content:center;
      border:1px solid rgba(255,255,255,0.25);
    }
    .slot-lbl.placed .sh{
      background:rgba(76,175,80,0.9);
      border-color:rgba(255,255,255,0.4);
    }
    #no-items{
      position:fixed;bottom:0;left:0;right:0;height:110px;
      display:flex;align-items:center;justify-content:center;
      background:#0a0a1a;border-top:2px solid #2a2a4a;
      z-index:10;pointer-events:none;
    }
    #no-items span{color:#404060;font-family:sans-serif;font-size:13px;}
  </style>
</head>
<body>

<div id="overlay">
  <div class="ov-icon">🏠</div>
  <div class="ov-text">Initialisation...</div>
</div>

<canvas id="c"></canvas>
<div id="loading">⏳ Chargement du modèle...</div>
<div id="info">Tape un meuble de l'inventaire pour l'ajouter</div>

<div id="topbar">
  <button class="tbtn" onclick="setCameraIso()" title="Vue 3D isométrique">◈</button>
  <button class="tbtn" onclick="setCameraTop()" title="Vue de dessus">⊞</button>
  <button class="tbtn" onclick="setCameraFront()" title="Vue de face">◻</button>
</div>

<div id="selbar">
  <span id="selname">Meuble</span>
  <button class="selbtn" onclick="rotSel(-90)">↺</button>
  <button class="selbtn" onclick="rotSel(90)">↻</button>
  <button class="selbtn red" onclick="delSel()">🗑</button>
</div>

<div id="inventory">
  <div id="inv-wrap">
    <canvas id="inv-canvas"></canvas>
    <div id="inv-labels"></div>
  </div>
</div>
<div id="no-items">
  <span>Chargement des meubles…</span>
</div>

<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/"
  }
}
</script>

<script type="module">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const RW = ${roomW}, RH = ${roomH};
const INV_H = 110, MODEL_H = 80;

const overlay   = document.getElementById('overlay');
const loadingEl = document.getElementById('loading');
const infoEl    = document.getElementById('info');
const selbar    = document.getElementById('selbar');
const selname   = document.getElementById('selname');

// ── Renderer principal ─────────────────────────────────────────────────────
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

// ── Renderer inventaire ────────────────────────────────────────────────────
let invRenderer = null;
let SLOT_W = 110;

// ── Scène ──────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);
scene.fog = new THREE.FogExp2(0x1a1a2e, 0.032);

// ── Caméra ─────────────────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(48, innerWidth/innerHeight, 0.1, 80);
camera.position.set(RW/2, 7, RH + 3);
camera.lookAt(RW/2, 0, RH/2);

// ── Contrôles ──────────────────────────────────────────────────────────────
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(RW/2, 0, RH/2);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.maxPolarAngle = Math.PI/2 - 0.04;
controls.minDistance = 2;
controls.maxDistance = 24;

// ── Lumières ───────────────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const sun = new THREE.DirectionalLight(0xfff4e0, 1.1);
sun.position.set(RW * 0.7, 12, RH * 0.9);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, {near:0.5,far:60,left:-RW*1.5,right:RW*2.5,top:RH*2.2,bottom:-RH});
scene.add(sun);
const fill = new THREE.DirectionalLight(0xb0c8ff, 0.25);
fill.position.set(-4, 6, -4);
scene.add(fill);

// ── Sol ────────────────────────────────────────────────────────────────────
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(RW, RH),
  new THREE.MeshLambertMaterial({color:0xf2e4c8})
);
floor.rotation.x = -Math.PI/2;
floor.position.set(RW/2, 0, RH/2);
floor.receiveShadow = true;
scene.add(floor);

// ── Grille ─────────────────────────────────────────────────────────────────
const grid = new THREE.GridHelper(Math.max(RW,RH)*3, Math.max(RW,RH)*12, 0x888888, 0xbbbbbb);
grid.position.set(RW/2, 0.004, RH/2);
grid.material.opacity = 0.35;
grid.material.transparent = true;
scene.add(grid);

// ── Murs ───────────────────────────────────────────────────────────────────
const WH = 3.2;
const wallMat = () => new THREE.MeshLambertMaterial({color:0xece0ce, side:THREE.FrontSide, transparent:true, opacity:0.88});
function addWall(w,h,x,y,z,ry){
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w,h), wallMat());
  m.position.set(x,y,z); m.rotation.y=ry; scene.add(m);
}
addWall(RW, WH, RW/2, WH/2, 0,        0);
addWall(RH, WH, 0,   WH/2, RH/2,  Math.PI/2);
addWall(RH, WH, RW,  WH/2, RH/2, -Math.PI/2);
const lineMat = new THREE.LineBasicMaterial({color:0xb89a6a});
function addLine(pts){
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map(p=>new THREE.Vector3(...p))), lineMat));
}
addLine([[0,0,0],[RW,0,0]]); addLine([[0,0,0],[0,0,RH]]);
addLine([[RW,0,0],[RW,0,RH]]); addLine([[0,0,RH],[RW,0,RH]]);

// ── État ───────────────────────────────────────────────────────────────────
const FURN      = {};
const INV_ITEMS = [];
const loader    = new GLTFLoader();
const floorPlane = new THREE.Plane(new THREE.Vector3(0,1,0), 0);
const raycaster  = new THREE.Raycaster();

let selectedId   = null;
let modelTouched = false;
let dragStarted  = false;
let t0   = {x:0,y:0,ms:0};
let tlast = {x:0,y:0};
let expectedN = 0, loadedN = 0;

function snap(v,s=0.25) { return Math.round(v/s)*s; }
function clamp(v,lo,hi) { return Math.max(lo,Math.min(hi,v)); }
function ndcOf(px,py)   { return {x:(px/innerWidth)*2-1, y:-(py/innerHeight)*2+1}; }

function getFurnitureRoot(obj){
  let o=obj; while(o.parent && o.parent!==scene) o=o.parent; return o;
}

function selectFurniture(id){
  if(selectedId && FURN[selectedId]){
    FURN[selectedId].root.traverse(c=>{
      if(c.isMesh && c.material.emissive){
        c.material.emissive.setHex(c.userData._eo||0);
        c.material.emissiveIntensity = c.userData._ei||0;
      }
    });
  }
  selectedId=id;
  if(id && FURN[id]){
    FURN[id].root.traverse(c=>{
      if(c.isMesh && c.material.emissive){
        c.userData._eo=c.material.emissive.getHex();
        c.userData._ei=c.material.emissiveIntensity;
        c.material.emissive.setHex(0x1144cc);
        c.material.emissiveIntensity=0.4;
      }
    });
    selbar.classList.add('show');
    selname.textContent=FURN[id].name;
    infoEl.textContent='Glisse pour déplacer · ↺↻ rotation';
  } else {
    selbar.classList.remove('show');
    infoEl.textContent='Tape un meuble de l\\'inventaire pour l\\'ajouter';
  }
}

function toRN(data){
  if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(data));
}
function notifyPos(id){
  if(!FURN[id]) return;
  const p=FURN[id].root.position;
  toRN({type:'positionUpdate',id,x:p.x,z:p.z,rotation:FURN[id].root.rotation.y});
}

// ── pointerdown capture : bloque OrbitControls AVANT qu'il reçoive l'event ──
canvas.addEventListener('pointerdown', e=>{
  if(e.clientY > innerHeight - INV_H) return;
  raycaster.setFromCamera(ndcOf(e.clientX, e.clientY), camera);
  const hits = raycaster.intersectObjects(Object.values(FURN).map(f=>f.root), true);
  controls.enabled = hits.length === 0;
}, {capture: true});

// ── Touch chambre ──────────────────────────────────────────────────────────
canvas.addEventListener('touchstart', e=>{
  e.preventDefault();
  const t=e.touches[0];
  if(t.clientY > innerHeight - INV_H){ controls.enabled=false; return; }
  t0={x:t.clientX,y:t.clientY,ms:Date.now()};
  tlast={x:t.clientX,y:t.clientY};
  modelTouched=false; dragStarted=false;
  raycaster.setFromCamera(ndcOf(t.clientX,t.clientY),camera);
  const roots=Object.values(FURN).map(f=>f.root);
  const hits=raycaster.intersectObjects(roots,true);
  if(hits.length>0){
    const root=getFurnitureRoot(hits[0].object);
    const found=Object.entries(FURN).find(([,v])=>v.root===root);
    if(found){ selectFurniture(found[0]); modelTouched=true; controls.enabled=false; }
  }
},{passive:false});

canvas.addEventListener('touchmove', e=>{
  e.preventDefault();
  const t=e.touches[0];
  if(t.clientY > innerHeight - INV_H) return;
  tlast={x:t.clientX,y:t.clientY};
  const dx=tlast.x-t0.x, dy=tlast.y-t0.y;
  if(modelTouched && selectedId && Math.hypot(dx,dy)>3){
    dragStarted=true;
    raycaster.setFromCamera(ndcOf(t.clientX,t.clientY),camera);
    const hit=new THREE.Vector3();
    if(raycaster.ray.intersectPlane(floorPlane,hit)){
      FURN[selectedId].root.position.set(
        snap(clamp(hit.x,0.3,RW-0.3)), FURN[selectedId].yOff, snap(clamp(hit.z,0.3,RH-0.3))
      );
    }
  }
},{passive:false});

canvas.addEventListener('touchend', e=>{
  e.preventDefault();
  controls.enabled=true;
  if(!modelTouched){
    const dx=tlast.x-t0.x, dy=tlast.y-t0.y;
    if(Math.hypot(dx,dy)<10 && Date.now()-t0.ms<350) selectFurniture(null);
  }
  if(selectedId && dragStarted) notifyPos(selectedId);
  modelTouched=false; dragStarted=false;
},{passive:false});

// ── Inventaire ─────────────────────────────────────────────────────────────
function refreshSlotW(){
  SLOT_W = 110;
}

function rebuildInvLabels(){
  const el = document.getElementById('inv-labels');
  el.innerHTML = '';
  INV_ITEMS.forEach(item => {
    const d = document.createElement('div');
    d.className = 'slot-lbl' + (item.placed ? ' placed' : '');
    d.style.width = SLOT_W + 'px';
    d.innerHTML = \`<span class="sh">\${item.placed ? '✓' : '+'}</span>\`;
    el.appendChild(d);
  });
}

function initInvRenderer(){
  if(invRenderer) return;
  const invCanvas = document.getElementById('inv-canvas');
  invRenderer = new THREE.WebGLRenderer({ canvas:invCanvas, antialias:true });
  invRenderer.setPixelRatio(Math.min(devicePixelRatio,2));
  invRenderer.autoClear = false;
  invRenderer.setSize(innerWidth, MODEL_H);
}

function showInventoryBar(){
  document.getElementById('inventory').style.display = 'block';
  document.getElementById('no-items').style.display  = 'none';
  refreshSlotW();
  initInvRenderer();
  const totalW = Math.max(innerWidth, INV_ITEMS.length * SLOT_W);
  invRenderer.setSize(totalW, MODEL_H);
  document.getElementById('inv-wrap').style.width    = totalW + 'px';
  document.getElementById('inv-labels').style.width  = totalW + 'px';
  document.getElementById('inv-canvas').style.width  = totalW + 'px';
  rebuildInvLabels();
}

function buildInvScene(modelClone){
  const sc = new THREE.Scene();
  sc.background = new THREE.Color(0x0a0a1a);
  sc.add(new THREE.AmbientLight(0xffffff, 0.75));
  const dl = new THREE.DirectionalLight(0xffffff, 0.9);
  dl.position.set(2, 3, 2);
  sc.add(dl);
  sc.add(new THREE.HemisphereLight(0x4466ff, 0x1a1a2e, 0.4));

  let box = new THREE.Box3().setFromObject(modelClone);
  const size = new THREE.Vector3(); box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  if(maxDim > 0) modelClone.scale.setScalar(1 / maxDim);

  modelClone.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(modelClone);
  const center = new THREE.Vector3(); box.getCenter(center);
  modelClone.position.x = -center.x;
  modelClone.position.z = -center.z;
  modelClone.position.y = -box.min.y;

  sc.add(modelClone);

  const modelH = box.max.y - box.min.y;
  const cam = new THREE.PerspectiveCamera(32, SLOT_W/MODEL_H, 0.01, 50);
  cam.position.set(1.3, 1.0, 1.5);
  cam.lookAt(0, modelH * 0.5, 0);

  return {scene: sc, camera: cam, model: modelClone};
}

function placeInRoom(idx){
  const item=INV_ITEMS[idx]; if(!item) return;
  if(item.placed && FURN[item.id]){ selectFurniture(item.id); return; }
  const root=item.original.clone(true);
  const box=new THREE.Box3().setFromObject(root);
  const sz=box.getSize(new THREE.Vector3());
  const biggest=Math.max(sz.x,sz.y,sz.z);
  if(biggest>0.01) root.scale.multiplyScalar(2.0/biggest);
  const box2=new THREE.Box3().setFromObject(root);
  const yOff=-box2.min.y;
  root.position.set(
    snap(clamp(RW/2+(Math.random()-0.5)*1.5,0.3,RW-0.3)), yOff,
    snap(clamp(RH/2+(Math.random()-0.5)*1.5,0.3,RH-0.3))
  );
  root.traverse(c=>{ if(c.isMesh){c.castShadow=true;c.receiveShadow=true;} });
  FURN[item.id]={root,name:item.name,yOff};
  scene.add(root);
  item.placed=true;
  rebuildInvLabels();
  selectFurniture(item.id);
  toRN({type:'modelAdded',id:item.id});
  notifyPos(item.id);
}

// Touch inventaire : scroll natif (passive:true) + détection tap
const invEl = document.getElementById('inventory');
let invT0 = {x:0, y:0, ms:0};

invEl.addEventListener('touchstart', e=>{
  const t = e.touches[0];
  invT0 = {x:t.clientX, y:t.clientY, ms:Date.now()};
  e.stopPropagation();
},{passive:true});

invEl.addEventListener('touchend', e=>{
  const t = e.changedTouches[0];
  const dx = Math.abs(t.clientX - invT0.x);
  const dy = Math.abs(t.clientY - invT0.y);
  const dt = Date.now() - invT0.ms;
  if(dx < 10 && dy < 10 && dt < 350){
    const scrollX = invEl.scrollLeft;
    placeInRoom(Math.floor((t.clientX + scrollX) / SLOT_W));
  }
  e.stopPropagation();
},{passive:true});

// ── API publique ────────────────────────────────────────────────────────────
window.addInventoryItem = function(id,name,b64,width,depth){
  const bin=atob(b64), buf=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) buf[i]=bin.charCodeAt(i);
  loader.parse(buf.buffer,'',
    gltf=>{
      const original=gltf.scene;
      const invData=buildInvScene(original.clone(true));
      INV_ITEMS.push({id,name,width,depth,original,placed:false,...invData});
      loadedN++;
      showInventoryBar();
      if(loadedN>=expectedN) toRN({type:'allItemsReady'});
      toRN({type:'itemReady',id});
    },
    err=>console.error('inv parse err',err)
  );
};

window.setExpectedCount = function(n){
  expectedN=n;
  if(n===0) document.querySelector('#no-items span').textContent='Aucun meuble sélectionné';
};

window.removeModelById = function(id){
  if(!FURN[id]) return;
  scene.remove(FURN[id].root); delete FURN[id];
  const inv=INV_ITEMS.find(i=>i.id===id);
  if(inv){inv.placed=false;rebuildInvLabels();}
  if(selectedId===id) selectFurniture(null);
};

window.clearAll = function(){
  Object.values(FURN).forEach(f=>scene.remove(f.root));
  for(const k in FURN) delete FURN[k];
  INV_ITEMS.forEach(i=>i.placed=false);
  rebuildInvLabels(); selectFurniture(null);
};

window.setCameraIso   = ()=>{ camera.position.set(RW/2,7,RH+3); controls.target.set(RW/2,0,RH/2); controls.update(); };
window.setCameraTop   = ()=>{ camera.position.set(RW/2,11,RH/2); controls.target.set(RW/2,0,RH/2); controls.update(); };
window.setCameraFront = ()=>{ camera.position.set(RW/2,2.5,RH+5); controls.target.set(RW/2,1.5,RH/2); controls.update(); };

window.rotSel = function(deg){
  if(!selectedId||!FURN[selectedId]) return;
  FURN[selectedId].root.rotation.y+=deg*Math.PI/180;
  notifyPos(selectedId);
};
window.delSel = function(){
  if(!selectedId) return;
  toRN({type:'deleteItem',id:selectedId});
  scene.remove(FURN[selectedId].root);
  const inv=INV_ITEMS.find(i=>i.id===selectedId);
  if(inv){inv.placed=false;rebuildInvLabels();}
  delete FURN[selectedId];
  selectFurniture(null);
};

// ── Boucle de rendu ────────────────────────────────────────────────────────
function animate(){
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene,camera);
  if(invRenderer && INV_ITEMS.length>0){
    invRenderer.setScissorTest(true);
    INV_ITEMS.forEach((item,i)=>{
      item.camera.aspect=SLOT_W/MODEL_H;
      item.camera.updateProjectionMatrix();
      invRenderer.setViewport(i*SLOT_W,0,SLOT_W,MODEL_H);
      invRenderer.setScissor(i*SLOT_W,0,SLOT_W,MODEL_H);
      invRenderer.setClearColor(0x0a0a1a,1);
      invRenderer.clear(true,true,false);
      invRenderer.render(item.scene,item.camera);
    });
  }
}
animate();

window.addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
  if(invRenderer){
    refreshSlotW();
    const totalW = Math.max(innerWidth, INV_ITEMS.length * SLOT_W);
    invRenderer.setSize(totalW, MODEL_H);
    document.getElementById('inv-wrap').style.width    = totalW + 'px';
    document.getElementById('inv-labels').style.width  = totalW + 'px';
    document.getElementById('inv-canvas').style.width  = totalW + 'px';
    rebuildInvLabels();
  }
});

overlay.classList.add('hidden');
setTimeout(()=>toRN({type:'ready'}),300);
</script>
</body>
</html>`;
