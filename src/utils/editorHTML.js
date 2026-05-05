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
      position:fixed;bottom:130px;left:50%;transform:translateX(-50%);
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

    /* ══════════════════════════════════════════
       SURFACE PICKER (bottom sheet)
    ══════════════════════════════════════════ */
    #surf-sheet{
      position:fixed;
      bottom:-230px;left:0;right:0;
      height:220px;
      background:rgba(8,8,22,0.97);
      border-top:1px solid rgba(255,255,255,0.12);
      border-radius:18px 18px 0 0;
      z-index:150;
      transition:bottom 0.32s cubic-bezier(0.34,1.2,0.64,1);
      padding:0 16px 14px;
      backdrop-filter:blur(12px);
    }
    #surf-sheet.open{bottom:120px;}
    #surf-handle{
      width:34px;height:3px;border-radius:2px;
      background:rgba(255,255,255,0.2);
      margin:10px auto 10px;
    }
    #surf-header{
      display:flex;align-items:center;justify-content:space-between;
      margin-bottom:10px;
    }
    #surf-title{
      color:#fff;font-family:sans-serif;font-size:12px;
      font-weight:700;letter-spacing:0.5px;
    }
    #surf-close{
      background:rgba(255,255,255,0.1);border:none;
      border-radius:50%;color:rgba(255,255,255,0.6);
      width:24px;height:24px;font-size:13px;
      cursor:pointer;display:flex;align-items:center;justify-content:center;
    }
    #surf-colors{
      display:flex;flex-wrap:wrap;gap:8px;
      justify-content:flex-start;
      overflow-y:auto;max-height:148px;
      padding:2px 0;
    }
    #surf-colors::-webkit-scrollbar{height:0;width:0;}
    .swatch-wrap{
      display:flex;flex-direction:column;align-items:center;gap:3px;
    }
    .swatch{
      width:38px;height:38px;border-radius:10px;
      border:2px solid rgba(255,255,255,0.08);
      cursor:pointer;
      transition:border-color 0.18s,transform 0.15s;
      flex-shrink:0;
    }
    .swatch.active{
      border-color:#fff;
      transform:scale(1.08);
      box-shadow:0 0 0 2px rgba(255,255,255,0.2);
    }
    .swatch-name{
      color:#606080;font-size:6px;font-family:sans-serif;
      text-align:center;width:40px;overflow:hidden;
      text-overflow:ellipsis;white-space:nowrap;
    }

    /* ══════════════════════════════════════════
       INVENTORY
    ══════════════════════════════════════════ */
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

    /* Bouton + inventaire */
    #inv-add{
      position:fixed;bottom:50px;right:10px;
      width:34px;height:34px;border-radius:50%;
      background:#e94560;border:none;color:#fff;
      font-size:22px;line-height:1;font-weight:300;
      cursor:pointer;z-index:20;
      display:none;align-items:center;justify-content:center;
      box-shadow:0 3px 12px rgba(233,69,96,0.55);
      transition:transform 0.15s;
    }
    #inv-add.show{display:flex;}

    #no-items{
      position:fixed;bottom:0;left:0;right:0;height:110px;
      display:flex;align-items:center;justify-content:center;
      background:#0a0a1a;border-top:2px solid #2a2a4a;
      z-index:10;pointer-events:none;
    }
    #no-items span{color:#404060;font-family:sans-serif;font-size:13px;}

    /* ══════════════════════════════════════════
       CATALOGUE MODAL
    ══════════════════════════════════════════ */
    #cat-overlay{
      position:fixed;inset:0;
      background:rgba(0,0,0,0.5);
      z-index:200;display:none;
      opacity:0;transition:opacity 0.3s;
    }
    #cat-overlay.open{
      display:block;opacity:1;
    }
    #cat-sheet{
      position:fixed;bottom:0;left:0;right:0;
      height:70vh;max-height:600px;
      background:rgba(8,8,22,0.98);
      border-top:1px solid rgba(255,255,255,0.12);
      border-radius:20px 20px 0 0;
      z-index:210;
      transition:transform 0.32s cubic-bezier(0.34,1.2,0.64,1);
      transform:translateY(100%);
      padding:0 16px 20px;
      backdrop-filter:blur(12px);
      display:flex;flex-direction:column;
    }
    #cat-sheet.open{
      transform:translateY(0);
    }
    #cat-handle{
      width:34px;height:3px;border-radius:2px;
      background:rgba(255,255,255,0.2);
      margin:10px auto 12px;
    }
    #cat-header{
      display:flex;align-items:center;justify-content:space-between;
      margin-bottom:12px;
    }
    #cat-title{
      color:#fff;font-family:sans-serif;font-size:14px;
      font-weight:700;letter-spacing:0.5px;
    }
    #cat-close{
      background:rgba(255,255,255,0.1);border:none;
      border-radius:50%;color:rgba(255,255,255,0.6);
      width:28px;height:28px;font-size:16px;
      cursor:pointer;display:flex;align-items:center;justify-content:center;
      transition:background 0.2s;
    }
    #cat-close:active{background:rgba(255,255,255,0.2);}
    #cat-list{
      flex:1;overflow-y:auto;padding:8px 0;
      display:flex;flex-direction:column;gap:6px;
    }
    #cat-list::-webkit-scrollbar{width:4px;}
    #cat-list::-webkit-scrollbar-track{background:transparent;}
    #cat-list::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px;}
    .cat-item{
      background:rgba(20,60,100,0.6);border:1px solid rgba(255,255,255,0.1);
      border-radius:12px;padding:12px 14px;
      display:flex;align-items:center;justify-content:space-between;
      cursor:pointer;transition:all 0.15s;
    }
    .cat-item:active{
      background:rgba(30,80,140,0.8);
      border-color:rgba(76,175,80,0.4);
      transform:scale(0.98);
    }
    .cat-info{
      display:flex;flex-direction:column;gap:2px;
    }
    .cat-name{
      color:#fff;font-family:sans-serif;font-size:13px;font-weight:600;
    }
    .cat-desc{
      color:#909090;font-family:sans-serif;font-size:11px;
    }
    .cat-btn{
      background:#4caf50;border:none;border-radius:8px;
      color:#fff;padding:6px 12px;font-size:12px;font-weight:600;
      cursor:pointer;transition:background 0.2s;
    }
    .cat-btn:active{background:#45a049;}
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

<!-- Camera buttons -->
<div id="topbar">
  <button class="tbtn" onclick="setCameraIso()" title="Vue 3D isométrique">◈</button>
  <button class="tbtn" onclick="setCameraTop()" title="Vue de dessus">⊞</button>
  <button class="tbtn" onclick="setCameraFront()" title="Vue de face">◻</button>
</div>

<!-- Furniture selection bar -->
<div id="selbar">
  <span id="selname">Meuble</span>
  <button class="selbtn" onclick="rotSel(-90)">↺</button>
  <button class="selbtn" onclick="rotSel(90)">↻</button>
  <button class="selbtn red" onclick="delSel()">🗑</button>
</div>

<!-- ── SURFACE PICKER ────────────────────────────── -->
<div id="surf-sheet">
  <div id="surf-handle"></div>
  <div id="surf-header">
    <div id="surf-title">Couleur du mur</div>
    <button id="surf-close">✕</button>
  </div>
  <div id="surf-colors"></div>
</div>

<!-- ── INVENTORY ──────────────────────────────────── -->
<div id="inventory">
  <div id="inv-wrap">
    <canvas id="inv-canvas"></canvas>
    <div id="inv-labels"></div>
  </div>
</div>
<div id="no-items">
  <span>Chargement des meubles…</span>
</div>

<!-- + button above inventory -->
<button id="inv-add">+</button>

<!-- ── CATALOGUE MODAL ─────────────────────────────── -->
<div id="cat-sheet">
  <div id="cat-handle"></div>
  <div id="cat-header">
    <div id="cat-title">Ajouter un meuble</div>
    <button id="cat-close">✕</button>
  </div>
  <div id="cat-list"></div>
</div>
<div id="cat-overlay"></div>

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
const INV_H = 120, MODEL_H = 80;

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
const FLOOR_THICKNESS = 0.02;  // 8 cm d'épaisseur
const floor = new THREE.Mesh(
  new THREE.BoxGeometry(RW, FLOOR_THICKNESS, RH),
  new THREE.MeshLambertMaterial({ color: 0xf2e4c8 })
);
// Position : la face SUPÉRIEURE du sol reste à y=0 (les meubles ne bougent pas)
floor.position.set(RW/2, -FLOOR_THICKNESS/2, RH/2);
floor.receiveShadow = true;
floor.userData.surfType = 'floor'; // pour le surface picker
scene.add(floor);

// // ── Grille ─────────────────────────────────────────────────────────────────
// const grid = new THREE.GridHelper(Math.max(RW,RH)*3, Math.max(RW,RH)*12, 0x888888, 0xbbbbbb);
// grid.position.set(RW/2, 0.004, RH/2);
// grid.material.opacity = 0.05;
// grid.material.transparent = true;
// scene.add(grid);

// ── Murs ───────────────────────────────────────────────────────────────────
const WH = 3.2;                  // hauteur des murs (3.2m)
const WALL_THICKNESS = 0.08;     // 8 cm d'épaisseur (sensation de mur réel)
const walls = {}; // ← {back, left, right}
const wallColors = { back: 0xece0ce, left: 0xece0ce, right: 0xece0ce };

const wallMat = () => new THREE.MeshLambertMaterial({
  color: 0xece0ce,
  side: THREE.DoubleSide,  // visible des 2 côtés (utile quand la caméra tourne autour)
});

// Helper : crée un mur avec une géométrie box et une position précise
function addWall(id, geom, position) {
  const m = new THREE.Mesh(geom, wallMat());
  m.position.copy(position);
  m.userData.surfType = 'wall';
  m.userData.wallId = id;
  m.receiveShadow = true;
  scene.add(m);
  walls[id] = m;
}

// Mur arrière : épaisseur dans Z, face intérieure à z=0
addWall(
  'back',
  new THREE.BoxGeometry(RW, WH, WALL_THICKNESS),
  new THREE.Vector3(RW/2, WH/2, -WALL_THICKNESS/2)
);

// Mur gauche : épaisseur dans X, face intérieure à x=0
addWall(
  'left',
  new THREE.BoxGeometry(WALL_THICKNESS, WH, RH),
  new THREE.Vector3(-WALL_THICKNESS/2, WH/2, RH/2)
);

// Mur droit : épaisseur dans X, face intérieure à x=RW
addWall(
  'right',
  new THREE.BoxGeometry(WALL_THICKNESS, WH, RH),
  new THREE.Vector3(RW + WALL_THICKNESS/2, WH/2, RH/2)
);

// ── État furniture ─────────────────────────────────────────────────────────
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

// ══════════════════════════════════════════════════════════
//  WALL SIDEBAR
// ══════════════════════════════════════════════════════════
const WALL_PRESETS = [
  {id:'beige',    label:'Beige',      color:'#ece0ce', hex:0xece0ce},
  {id:'white',    label:'Blanc',      color:'#f4f1ec', hex:0xf4f1ec},
  {id:'grey',     label:'Gris',       color:'#b8b4ae', hex:0xb8b4ae},
  {id:'dark',     label:'Sombre',     color:'#3d3d5c', hex:0x3d3d5c},
  {id:'brick',    label:'Brique',     color:'#b5674d', hex:0xb5674d},
  {id:'sage',     label:'Sauge',      color:'#8fad8f', hex:0x8fad8f},
  {id:'navy',     label:'Marine',     color:'#2d4a7a', hex:0x2d4a7a},
  {id:'terra',    label:'Terracotta', color:'#cc7a5a', hex:0xcc7a5a},
  {id:'blush',    label:'Rose',       color:'#e8b4b8', hex:0xe8b4b8},
  {id:'mint',     label:'Menthe',     color:'#a8d8c8', hex:0xa8d8c8},
  {id:'lemon',    label:'Citron',     color:'#e0d88a', hex:0xe0d88a},
  {id:'lavender', label:'Lavande',    color:'#c4b0d8', hex:0xc4b0d8},
];

const FLOOR_PRESETS = [
  {id:'wood',     label:'Bois clair', color:'#f2e4c8', hex:0xf2e4c8},
  {id:'darkw',    label:'Bois foncé', color:'#8b6340', hex:0x8b6340},
  {id:'marble',   label:'Marbre',     color:'#e4e4e0', hex:0xe4e4e0},
  {id:'concrete', label:'Béton',      color:'#9a9898', hex:0x9a9898},
  {id:'terra',    label:'Terracotta', color:'#cc7a5a', hex:0xcc7a5a},
  {id:'black',    label:'Noir',       color:'#1e1e28', hex:0x1e1e28},
  {id:'parquet',  label:'Parquet',    color:'#c8a060', hex:0xc8a060},
  {id:'teal',     label:'Bleu-vert',  color:'#4a8a7a', hex:0x4a8a7a},
];

let activeWallPresetId  = 'beige';
let activeFloorPresetId = 'wood';
let currentWallId = null; // ← track quel mur a été touché

function applyWallColor(hex, id, wallId){
  if(wallId && walls[wallId]){
    walls[wallId].material.color.setHex(hex);
    walls[wallId].material.needsUpdate = true;
    wallColors[wallId] = hex;
    activeWallPresetId = id;
  }
  document.querySelectorAll('.swatch').forEach(b=>{
    b.classList.toggle('active', b.dataset.id === id);
  });
  toRN({type:'wallColorChanged', color:'#'+hex.toString(16).padStart(6,'0'), wallId});
}

function applyFloorColor(hex, id){
  floor.material.color.setHex(hex);
  floor.material.needsUpdate = true;
  activeFloorPresetId = id;
  document.querySelectorAll('.swatch').forEach(b=>{
    b.classList.toggle('active', b.dataset.id === id);
  });
  toRN({type:'floorColorChanged', color:'#'+hex.toString(16).padStart(6,'0')});
}

// ══════════════════════════════════════════════════════════
//  SURFACE PICKER (tap mur/sol → bottom sheet)
// ══════════════════════════════════════════════════════════
const surfSheet  = document.getElementById('surf-sheet');
const surfTitle  = document.getElementById('surf-title');
const surfColors = document.getElementById('surf-colors');
let surfPickerOpen = false;
let currentSurfType = null;
let currentSurfId = null;

document.getElementById('surf-close').addEventListener('touchend', e=>{
  e.preventDefault(); closeSurfPicker();
});
document.getElementById('surf-close').addEventListener('click', ()=>closeSurfPicker());

function openSurfPicker(type, surfId){
  currentSurfType = type;
  currentSurfId = surfId;
  
  if(type === 'wall'){
    surfTitle.textContent = 'Couleur du mur - ' + (surfId === 'back' ? 'Fond' : surfId === 'left' ? 'Gauche' : 'Droite');
  } else {
    surfTitle.textContent = 'Textures du sol';
  }
  
  surfColors.innerHTML = '';
  const presets = type === 'wall' ? WALL_PRESETS : FLOOR_PRESETS;
  const activeId = type === 'wall' ? activeWallPresetId : activeFloorPresetId;

  presets.forEach(function(p){
    const wrap = document.createElement('div');
    wrap.className = 'swatch-wrap';
    const sw = document.createElement('div');
    sw.className = 'swatch' + (p.id === activeId ? ' active' : '');
    sw.style.background = p.color;
    sw.addEventListener('touchend', function(e){
      e.preventDefault();
      if(type === 'wall') applyWallColor(p.hex, p.id, surfId);
      else applyFloorColor(p.hex, p.id);
      surfColors.querySelectorAll('.swatch').forEach(function(s){ s.classList.remove('active'); });
      sw.classList.add('active');
    });
    const nm = document.createElement('span');
    nm.className = 'swatch-name';
    nm.textContent = p.label;
    wrap.appendChild(sw);
    wrap.appendChild(nm);
    surfColors.appendChild(wrap);
  });

  surfSheet.classList.add('open');
  surfPickerOpen = true;
}

function closeSurfPicker(){
  surfSheet.classList.remove('open');
  surfPickerOpen = false;
  currentSurfType = null;
  currentSurfId = null;
}

// ── Inventory + button ─────────────────────────────────────────────────────
const invAddBtn = document.getElementById('inv-add');
console.log('Bouton + trouvé:', invAddBtn); // Debug

invAddBtn.addEventListener('touchend', function(e){
  console.log('Touchend sur bouton +'); // Debug
  e.preventDefault(); e.stopPropagation();
  toRN({type:'openCatalogue'});
});

invAddBtn.addEventListener('click', function(e){
  console.log('Click sur bouton +'); // Debug
  e.preventDefault(); e.stopPropagation();
  toRN({type:'openCatalogue'});
});

// ── pointerdown capture : bloque OrbitControls AVANT qu'il reçoive l'event ──
canvas.addEventListener('pointerdown', e=>{
  // Vérifier si le clic est sur le bouton +
  const invAddBtn = document.getElementById('inv-add');
  const rect = invAddBtn.getBoundingClientRect();
  const isOnButton = e.clientX >= rect.left && e.clientX <= rect.right &&
                     e.clientY >= rect.top && e.clientY <= rect.bottom;

  if(isOnButton) return; // Laisser le bouton gérer l'événement

  if(e.clientY > innerHeight - INV_H) return;
  raycaster.setFromCamera(ndcOf(e.clientX, e.clientY), camera);
  const hits = raycaster.intersectObjects(Object.values(FURN).map(f=>f.root), true);
  controls.enabled = hits.length === 0;
}, {capture: true});

// ── Touch chambre ──────────────────────────────────────────────────────────
canvas.addEventListener('touchstart', e=>{
  e.preventDefault();
  const t=e.touches[0];

  // Vérifier si le touch est sur le bouton +
  const invAddBtn = document.getElementById('inv-add');
  const rect = invAddBtn.getBoundingClientRect();
  const isOnButton = t.clientX >= rect.left && t.clientX <= rect.right &&
                     t.clientY >= rect.top && t.clientY <= rect.bottom;

  if(isOnButton) return; // Laisser le bouton gérer l'événement

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
    const isTap = Math.hypot(dx,dy)<10 && Date.now()-t0.ms<350;

    if(isTap){
      // Vérifie si tap sur mur ou sol → surface picker
      raycaster.setFromCamera(ndcOf(tlast.x, tlast.y), camera);
      const surfHits = raycaster.intersectObjects([floor, walls.back, walls.left, walls.right], false);
      if(surfHits.length > 0){
        const hitObj = surfHits[0].object;
        const type = hitObj.userData.surfType;
        const surfId = hitObj.userData.wallId || null;
        if(surfPickerOpen && currentSurfType === type && currentSurfId === surfId){
          // 2e tap sur même surface → ferme
          closeSurfPicker();
        } else {
          openSurfPicker(type, surfId);
        }
      } else {
        // Tap dans le vide → désélectionne tout
        selectFurniture(null);
        closeSurfPicker();
      }
    }
  }

  if(selectedId && dragStarted) notifyPos(selectedId);
  modelTouched=false; dragStarted=false;
},{passive:false});

// ── Inventaire ─────────────────────────────────────────────────────────────
function refreshSlotW(){ SLOT_W = 110; }

function rebuildInvLabels(){
  const el = document.getElementById('inv-labels');
  el.innerHTML = '';
  INV_ITEMS.forEach(function(item){
    const d = document.createElement('div');
    d.className = 'slot-lbl' + (item.placed ? ' placed' : '');
    d.style.width = SLOT_W + 'px';
    d.innerHTML = '<span class="sh">' + (item.placed ? '✓' : '+') + '</span>';
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

function placeInRoom(idx, presetX, presetZ, presetRot){
  const item=INV_ITEMS[idx]; if(!item) return;
  if(item.placed && FURN[item.id]){ selectFurniture(item.id); return; }
  const root=item.original.clone(true);
  const box=new THREE.Box3().setFromObject(root);
  const sz=box.getSize(new THREE.Vector3());
  const biggest=Math.max(sz.x,sz.y,sz.z);
  if(biggest>0.01) root.scale.multiplyScalar(2.0/biggest);
  const box2=new THREE.Box3().setFromObject(root);
  const yOff=-box2.min.y;
  const px = (presetX !== undefined && presetX !== null)
    ? snap(clamp(presetX, 0.3, RW-0.3))
    : snap(clamp(RW/2+(Math.random()-0.5)*1.5, 0.3, RW-0.3));
  const pz = (presetZ !== undefined && presetZ !== null)
    ? snap(clamp(presetZ, 0.3, RH-0.3))
    : snap(clamp(RH/2+(Math.random()-0.5)*1.5, 0.3, RH-0.3));
  root.position.set(px, yOff, pz);
  if(presetRot !== undefined && presetRot !== null) root.rotation.y = presetRot;
  root.traverse(c=>{ if(c.isMesh){c.castShadow=true;c.receiveShadow=true;} });
  FURN[item.id]={root,name:item.name,yOff};
  scene.add(root);
  item.placed=true;
  rebuildInvLabels();
  selectFurniture(item.id);
  toRN({type:'modelAdded',id:item.id});
  notifyPos(item.id);
}

// Touch inventaire : scroll natif + détection tap
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
window.addInventoryItem = function(id,name,b64,width,depth,presetX,presetZ,presetRot){
  const bin=atob(b64), buf=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) buf[i]=bin.charCodeAt(i);
  loader.parse(buf.buffer,'',
    gltf=>{
      const original=gltf.scene;
      const invData=buildInvScene(original.clone(true));
      INV_ITEMS.push({id,name,width,depth,original,placed:false,...invData});
      loadedN++;
      showInventoryBar();
      if(presetX !== undefined && presetX !== null){
        placeInRoom(INV_ITEMS.length - 1, presetX, presetZ, presetRot);
      }
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

// ── API : récupérer l'état des surfaces (pour SAVE) ──
window.getSurfacesState = function(){
  try {
    return JSON.stringify({
      walls: {
        back:  '#' + wallColors.back.toString(16).padStart(6,'0'),
        left:  '#' + wallColors.left.toString(16).padStart(6,'0'),
        right: '#' + wallColors.right.toString(16).padStart(6,'0'),
      },
      floor: '#' + floor.material.color.getHex().toString(16).padStart(6,'0'),
      activeWallPresetId,
      activeFloorPresetId,
    });
  } catch(e){ return '{}'; }
};

// ── API : restaurer l'état des surfaces (pour LOAD saved design) ──
window.setSurfacesState = function(stateJsonOrObj){
  try {
    const state = typeof stateJsonOrObj === 'string' ? JSON.parse(stateJsonOrObj) : stateJsonOrObj;
    if (!state) return;
    if (state.walls){
      ['back','left','right'].forEach(function(id){
        if (state.walls[id] && walls[id]){
          const hex = parseInt(state.walls[id].replace('#',''), 16);
          walls[id].material.color.setHex(hex);
          walls[id].material.needsUpdate = true;
          wallColors[id] = hex;
        }
      });
    }
    if (state.floor){
      const hex = parseInt(state.floor.replace('#',''), 16);
      floor.material.color.setHex(hex);
      floor.material.needsUpdate = true;
    }
    if (state.activeWallPresetId)  activeWallPresetId  = state.activeWallPresetId;
    if (state.activeFloorPresetId) activeFloorPresetId = state.activeFloorPresetId;
  } catch(e){ console.error('setSurfacesState error', e); }
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
// Afficher le bouton + en permanence pour accéder au catalogue
invAddBtn.classList.add('show');
console.log('Classe show ajoutée au bouton +'); // Debug
setTimeout(()=>toRN({type:'ready'}),300);
</script>
</body>
</html>`;
