import * as THREE from './assets/vendor/three.module.min.js';

const canvas = document.getElementById('threeScene');
const stage = document.getElementById('holoStage');
let enabled = true, state = 'idle', pointerX = 0, pointerY = 0;
let renderer, scene, camera, companion, chair, portrait, clock;

function material(color, emissive = 0) { return new THREE.MeshStandardMaterial({ color, roughness: .55, metalness: .22, emissive: color, emissiveIntensity: emissive }); }
function part(geometry, materialValue, position, rotation) { const mesh = new THREE.Mesh(geometry, materialValue); mesh.position.set(...position); if (rotation) mesh.rotation.set(...rotation); return mesh; }
function cylinder(radiusTop, radiusBottom, height, color, position, rotation) { return part(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 12), material(color), position, rotation); }
function buildCompanion() {
  const root = new THREE.Group(); const navy = material(0x102c55, .08), cyan = material(0x25ddff, .8), silver = material(0xa9c7d9, .22), skin = material(0xbfd4e3, .12), hair = material(0x142133);
  const head = part(new THREE.SphereGeometry(.36, 18, 14), skin, [0, 1.3, .1]); const hairCap = part(new THREE.SphereGeometry(.375, 18, 14, 0, Math.PI * 2, 0, Math.PI * .48), hair, [0, 1.38, .08]);
  root.add(head, hairCap, cylinder(.42, .56, .85, 0x102c55, [0, .62, .05]), part(new THREE.BoxGeometry(.72, .08, .12), silver, [0, .88, .1]));
  const leftArm = cylinder(.12, .15, .78, 0x102c55, [-.46, .63, .02], [0, 0, .38]); const rightArm = cylinder(.12, .15, .78, 0x102c55, [.46, .63, .02], [0, 0, -.38]); root.add(leftArm, rightArm);
  root.add(cylinder(.17, .2, .9, 0x102c55, [-.23, -.28, .18], [.52, 0, 0]), cylinder(.17, .2, .9, 0x102c55, [.23, -.28, .18], [.52, 0, 0]));
  root.add(part(new THREE.TorusGeometry(.46, .025, 8, 24), cyan, [0, .58, -.06], [Math.PI / 2, 0, 0])); return root;
}
function buildChair() { const root = new THREE.Group(), dark = material(0x071321, .03), cyan = material(0x25ddff, .45); root.add(part(new THREE.BoxGeometry(1.55, .24, 1.1), dark, [0, -.53, 0]), part(new THREE.BoxGeometry(1.4, 1.75, .22), dark, [0, .37, -.5]), part(new THREE.BoxGeometry(.18, .5, 1), dark, [-.85, -.18, 0]), part(new THREE.BoxGeometry(.18, .5, 1), dark, [.85, -.18, 0]), part(new THREE.TorusGeometry(.83, .018, 8, 32), cyan, [0, .2, -.61])); return root; }
function init() {
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' }); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(34, 1, .1, 100); camera.position.set(0, .35, 5.2); clock = new THREE.Clock();
    scene.add(new THREE.HemisphereLight(0xa8efff, 0x07101c, 2.4)); const light = new THREE.PointLight(0x38ddff, 20, 8); light.position.set(0, 2.5, 3); scene.add(light);
    chair = buildChair(); companion = buildCompanion(); companion.position.y = .1; scene.add(chair, companion);
    const texture = new THREE.TextureLoader().load('./assets/characters/command-officer-reference-v1.png'); const panel = part(new THREE.PlaneGeometry(1.2, 1.8), new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: .28 }), [1.35, .5, -.8], [0, -.45, 0]); scene.add(panel); portrait = panel;
    const resize = () => { const rect = stage.getBoundingClientRect(); renderer.setSize(rect.width, rect.height, false); camera.aspect = rect.width / rect.height; camera.updateProjectionMatrix(); }; new ResizeObserver(resize).observe(stage); resize();
    stage.addEventListener('pointermove', event => { const rect = stage.getBoundingClientRect(); pointerX = ((event.clientX - rect.left) / rect.width - .5) * .55; pointerY = ((event.clientY - rect.top) / rect.height - .5) * .18; }); stage.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; }); stage.addEventListener('click', () => { state = state === 'wave' ? 'idle' : 'wave'; }); render();
  } catch { enabled = false; canvas.hidden = true; }
}
function render() { requestAnimationFrame(render); if (!renderer || !enabled) return; const t = clock.getElapsedTime(); const activity = state === 'thinking' ? .12 : state === 'listening' ? .08 : .035; companion.rotation.y += (pointerX - companion.rotation.y) * .035; companion.rotation.x += (pointerY - companion.rotation.x) * .035; companion.position.y = .1 + Math.sin(t * (state === 'thinking' ? 2.4 : 1.2)) * activity; chair.rotation.y = Math.sin(t * .42) * .025; if (state === 'wave') companion.rotation.z = Math.sin(t * 4) * .08; else companion.rotation.z *= .92; portrait.material.opacity = state === 'thinking' ? .48 : .28; renderer.render(scene, camera); }
window.masterChiefThreeD = { setState: value => { state = value; }, setEnabled: value => { enabled = Boolean(value) && Boolean(renderer); canvas.hidden = !enabled; stage.classList.toggle('three-active', enabled); } };
init();
window.dispatchEvent(new Event('master-chief-three-ready'));
