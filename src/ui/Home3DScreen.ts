import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import type { PetSystem } from '../systems/PetSystem';
import { COLORS } from '../constants';
interface PetActor {
  mesh: THREE.Group;
  body: CANNON.Body;
  target: CANNON.Vec3;
  waitTimer: number;
  id: string;
  name: string;
  dialogues: string[];
}

const DIALOGUES: Record<string, string[]> = {
  rat: ['欢迎来到动物城！', '今天要去市中心逛逛吗？', '老鼠也能当大英雄！', '要不要一起坐地铁？'],
  ox: ['哞！动物城欢迎大家！', '我力气大，可以帮你搬东西！', ' Savannah Central 真热闹！', '一起去吃冰淇淋吧！'],
  tiger: ['嗷呜！动物城需要勇敢者！', '警察局今天又接到新案子！', '我当警察一定超帅！', '谁敢破坏动物城？'],
  rabbit: ['蹦蹦跳跳进动物城！', ' anyone can be anything！', '我要去当一名警官！', '胡萝卜城最爱的胡萝卜！'],
  dragon: ['呼——动物城的天空真美！', '龙也可以在这里生活！', '想不想坐我的热气球？', '动物城没有不可能！'],
  snake: ['嘶嘶——动物城真大！', '没有偏见，只有无限可能！', '冷血动物也有热血梦想！', '我准备好融入城市了！'],
  horse: ['哒哒哒！上班别迟到！', '动物城的地铁真快！', '今天去 Rainforest District 看看！', '城市跑酷我最行！'],
  goat: ['咩！动物城空气真好！', '我要开一家咖啡馆！', '温柔的羊也能当市长！', '一起去动物城广场？'],
  monkey: ['吱吱吱！城市太好玩了！', '我要开一家冰淇淋店！', 'Popsicle 是我的招牌！', '动物城每天都精彩！'],
  rooster: ['喔喔喔！动物城早上好！', '我要当一名新闻主播！', '今天的头条是什么？', '大家一起建设动物城！'],
  dog: ['汪汪！欢迎来到动物城！', '警察局需要更多好狗狗！', '我会闻出城里的秘密！', '要一起去巡逻吗？'],
  pig: ['哼哼！动物城美食真多！', '我想开一家甜品店！', '甜甜圈最好吃了！', '动物城的生活真幸福！'],
};

export class Home3DScreen {
  private container: HTMLElement;
  private pets: PetSystem;
  private onBack: () => void;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private animFrame!: number;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  private world!: CANNON.World;
  private actors: PetActor[] = [];
  private time = 0;
  private muted = false;

  constructor(pets: PetSystem, onBack: () => void) {
    this.pets = pets;
    this.onBack = onBack;

    this.container = document.createElement('div');
    this.container.classList.add('screen', 'active', 'home-screen');
    this.container.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;overflow:hidden;';

    this.buildUI();
    this.init3D();
    this.initPhysics();
    this.buildRoom();
    this.spawnPets();
    this.bindEvents();
    this.animate();
  }

  private buildUI(): void {
    const header = document.createElement('div');
    header.style.cssText = 'position:absolute;top:0;left:0;right:0;z-index:10;display:flex;justify-content:space-between;align-items:center;padding:12px 16px;pointer-events:none;';

    const title = document.createElement('h2');
    title.textContent = '动物世界';
    title.style.cssText = 'margin:0;color:#1a3a5c;font-size:18px;pointer-events:auto;';
    header.appendChild(title);

    const controls = document.createElement('div');
    controls.style.cssText = 'display:flex;gap:8px;align-items:center;pointer-events:auto;';
    header.appendChild(controls);

    const muteBtn = document.createElement('button');
    muteBtn.textContent = '🔊';
    muteBtn.title = '关闭声音';
    muteBtn.style.cssText = 'padding:8px 12px;font-size:14px;min-width:40px;';
    muteBtn.addEventListener('click', () => {
      this.muted = !this.muted;
      muteBtn.textContent = this.muted ? '🔇' : '🔊';
      muteBtn.title = this.muted ? '开启声音' : '关闭声音';
      if (this.muted) {
        speechSynthesis.cancel();
      }
    });
    controls.appendChild(muteBtn);

    const backBtn = document.createElement('button');
    backBtn.textContent = '返回';
    backBtn.style.cssText = 'padding:8px 16px;font-size:14px;';
    backBtn.addEventListener('click', () => this.dispose());
    controls.appendChild(backBtn);

    this.container.appendChild(header);

    const hint = document.createElement('div');
    hint.textContent = '点击动物和它们互动';
    hint.style.cssText = 'position:absolute;bottom:12px;left:50%;transform:translateX(-50%);z-index:10;color:#1a3a5c;font-size:12px;pointer-events:none;';
    this.container.appendChild(hint);
  }

  private init3D(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xBDE0FE);
    this.scene.fog = new THREE.Fog(0xBDE0FE, 20, 50);

    this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    this.camera.position.set(0, 12, 16);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    const ambient = new THREE.AmbientLight(0xE8F4FF, 0.5);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xFFF0DD, 0.8);
    sun.position.set(10, 12, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 40;
    sun.shadow.camera.left = -12;
    sun.shadow.camera.right = 12;
    sun.shadow.camera.top = 12;
    sun.shadow.camera.bottom = -12;
    this.scene.add(sun);
  }

  private initPhysics(): void {
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.82, 0);
  }

  private buildRoom(): void {
    const plazaSize = 24;
    const half = plazaSize / 2;
    const tileSize = 2;
    const tiles = plazaSize / tileSize; // 12
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xF5F5F5, roughness: 0.8 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0xE0E0E0, roughness: 0.8 });
    const tileGeo = new THREE.BoxGeometry(tileSize, 0.08, tileSize);

    for (let x = 0; x < tiles; x++) {
      for (let z = 0; z < tiles; z++) {
        const mat = (x + z) % 2 === 0 ? lightMat : darkMat;
        const tile = new THREE.Mesh(tileGeo, mat);
        tile.position.set(
          -half + x * tileSize + tileSize / 2,
          0,
          -half + z * tileSize + tileSize / 2
        );
        tile.receiveShadow = true;
        this.scene.add(tile);
      }
    }

    // Plaza curb
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x9B9B9B });
    const curbGeo = new THREE.BoxGeometry(plazaSize, 0.15, 0.25);
    const curbPositions = [
      { x: 0, z: -half + 0.125, ry: 0 },
      { x: 0, z: half - 0.125, ry: 0 },
      { x: -half + 0.125, z: 0, ry: Math.PI / 2 },
      { x: half - 0.125, z: 0, ry: Math.PI / 2 },
    ];
    for (const pos of curbPositions) {
      const curb = new THREE.Mesh(curbGeo, curbMat);
      curb.position.set(pos.x, 0.075, pos.z);
      curb.rotation.y = pos.ry;
      curb.receiveShadow = true;
      this.scene.add(curb);
    }

    // Invisible physics walls to keep pets in the plaza
    const wallH = 1;
    this.addWall(0, wallH / 2, -half, plazaSize, wallH, 0.2);
    this.addWall(0, wallH / 2, half, plazaSize, wallH, 0.2);
    this.addWall(-half, wallH / 2, 0, 0.2, wallH, plazaSize);
    this.addWall(half, wallH / 2, 0, 0.2, wallH, plazaSize);

    // Physics ground
    const groundBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.world.addBody(groundBody);

    this.buildCity();
    this.buildZPDMonument();
  }

  private buildCity(): void {
    // Zootopia district building palettes
    const districts: { color: number; accent: number; count: number; minH: number; maxH: number }[] = [
      { color: 0x4A90E2, accent: 0xFFFFFF, count: 5, minH: 2, maxH: 5 },  // City Hall / Downtown
      { color: 0xF5A623, accent: 0xFFF8E7, count: 4, minH: 1.5, maxH: 3.5 }, // Savannah Central
      { color: 0x50C8E8, accent: 0xFFFFFF, count: 3, minH: 2, maxH: 4 },   // Tundratown
      { color: 0x7ED321, accent: 0xE8F5E9, count: 3, minH: 2.5, maxH: 5 },  // Rainforest District
      { color: 0xD3B88C, accent: 0xF5F0E1, count: 3, minH: 1.5, maxH: 3 },  // Sahara Square
    ];

    const cityRadius = 14;
    const buildingCount = 18;
    let districtIndex = 0;
    let districtUsed = 0;

    for (let i = 0; i < buildingCount; i++) {
      const angle = (i / buildingCount) * Math.PI * 2;
      const x = Math.cos(angle) * cityRadius;
      const z = Math.sin(angle) * cityRadius;

      const district = districts[districtIndex];
      const h = district.minH + Math.random() * (district.maxH - district.minH);
      const w = 1.5 + Math.random() * 1.5;
      const d = 1.5 + Math.random() * 1.5;

      const geo = new THREE.BoxGeometry(w, h, d);
      const mat = new THREE.MeshStandardMaterial({ color: district.color, roughness: 0.7 });
      const building = new THREE.Mesh(geo, mat);
      building.position.set(x, h / 2, z);
      building.lookAt(0, h / 2, 0);
      building.castShadow = true;
      building.receiveShadow = true;
      this.scene.add(building);

      // Accent top or windows
      const accentGeo = new THREE.BoxGeometry(w * 0.7, 0.2, d * 0.7);
      const accentMat = new THREE.MeshStandardMaterial({ color: district.accent });
      const accent = new THREE.Mesh(accentGeo, accentMat);
      accent.position.set(x, h + 0.1, z);
      accent.lookAt(0, h + 0.1, 0);
      this.scene.add(accent);

      districtUsed++;
      if (districtUsed >= district.count) {
        districtUsed = 0;
        districtIndex = (districtIndex + 1) % districts.length;
      }
    }

    // City Hall: blue building with a white dome at the back
    const hallX = 0;
    const hallZ = -cityRadius;
    const hallW = 4;
    const hallD = 2.5;
    const hallH = 5;
    const hall = new THREE.Mesh(
      new THREE.BoxGeometry(hallW, hallH, hallD),
      new THREE.MeshStandardMaterial({ color: 0x4A90E2, roughness: 0.6 })
    );
    hall.position.set(hallX, hallH / 2, hallZ);
    hall.castShadow = true;
    hall.receiveShadow = true;
    this.scene.add(hall);

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(1.6, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.4 })
    );
    dome.position.set(hallX, hallH, hallZ);
    this.scene.add(dome);
  }

  private buildZPDMonument(): void {
    // Pedestal
    const pedestal = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.8, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x5A6C7D, roughness: 0.7 })
    );
    pedestal.position.set(0, 0.4, 0);
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    this.scene.add(pedestal);

    // Golden badge / ring
    const badge = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.12, 8, 24),
      new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.6, roughness: 0.3 })
    );
    badge.position.set(0, 1.3, 0);
    badge.rotation.x = Math.PI / 2;
    badge.castShadow = true;
    this.scene.add(badge);

    // Small star/paw center
    const star = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.08, 5),
      new THREE.MeshStandardMaterial({ color: 0xFFFFFF })
    );
    star.position.set(0, 1.3, 0);
    star.castShadow = true;
    this.scene.add(star);
  }

  private addWall(x: number, y: number, z: number, w: number, h: number, d: number): void {
    const shape = new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2));
    const body = new CANNON.Body({ mass: 0, shape });
    body.position.set(x, y, z);
    this.world.addBody(body);
  }

  private spawnPets(): void {
    const all = this.pets.getAllPets();
    for (let i = 0; i < all.length; i++) {
      const pet = all[i];
      const angle = (i / Math.max(all.length, 1)) * Math.PI * 2;
      const r = 3 + Math.random() * 2;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      this.createActor(pet.id, pet.name, x, z);
    }
  }

  private createActor(id: string, name: string, x: number, z: number): void {
    const color = (COLORS as any)[id] || 0xFFB6C1;
    const group = new THREE.Group();

    // Body (sphere)
    const bodyGeo = new THREE.SphereGeometry(0.55, 16, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.55;
    bodyMesh.castShadow = true;
    group.add(bodyMesh);

    // Head (smaller sphere)
    const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const headMesh = new THREE.Mesh(headGeo, bodyMat);
    headMesh.position.set(0, 1.1, 0.25);
    headMesh.castShadow = true;
    group.add(headMesh);

    // Collar (Zootopia citizen accessory)
    const collarGeo = new THREE.TorusGeometry(0.28, 0.04, 8, 20);
    const collarMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.4, roughness: 0.4 });
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.set(0, 0.92, 0.25);
    collar.rotation.x = Math.PI / 2;
    collar.castShadow = true;
    group.add(collar);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.12, 1.2, 0.55);
    group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.12, 1.2, 0.55);
    group.add(rightEye);

    // Legs (small capsules)
    const legGeo = new THREE.CapsuleGeometry(0.1, 0.3, 4, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const positions = [[-0.25, 0.15, 0.25], [0.25, 0.15, 0.25], [-0.25, 0.15, -0.25], [0.25, 0.15, -0.25]];
    for (const [lx, ly, lz] of positions) {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, ly, lz);
      group.add(leg);
    }

    // Tail
    const tailGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const tail = new THREE.Mesh(tailGeo, bodyMat);
    tail.position.set(0, 0.6, -0.55);
    group.add(tail);

    group.position.set(x, 0, z);
    this.scene.add(group);

    // Physics
    const shape = new CANNON.Sphere(0.55);
    const body = new CANNON.Body({ mass: 5, shape });
    body.position.set(x, 0.55, z);
    body.linearDamping = 0.7;
    body.angularDamping = 0.7;
    this.world.addBody(body);

    const actor: PetActor = {
      mesh: group,
      body,
      target: new CANNON.Vec3(x, 0.55, z),
      waitTimer: Math.random() * 2,
      id,
      name,
      dialogues: DIALOGUES[id] || DIALOGUES.rat,
    };
    this.actors.push(actor);
  }

  private bindEvents(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);

      const meshes = this.actors.map(a => a.mesh);
      const intersects = this.raycaster.intersectObjects(meshes, true);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        let group = hit.parent;
        while (group && group.type !== 'Group') group = group.parent;
        if (group) {
          const actor = this.actors.find(a => a.mesh === group);
          if (actor) this.speak(actor);
        }
      }
    });

    window.addEventListener('resize', () => this.onResize());
  }

  private onResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private speak(actor: PetActor): void {
    if (!this.muted) {
      const text = actor.dialogues[Math.floor(Math.random() * actor.dialogues.length)];
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.pitch = 1.6;
      utterance.rate = 1.1;
      utterance.volume = 1;
      speechSynthesis.speak(utterance);
    }

    // Visual feedback: jump
    actor.body.velocity.y = 3;
  }

  private animate(): void {
    this.time += 1 / 60;
    this.world.step(1 / 60);

    for (const actor of this.actors) {
      // Sync mesh to body
      actor.mesh.position.set(actor.body.position.x, actor.body.position.y - 0.55, actor.body.position.z);
      actor.mesh.quaternion.set(
        actor.body.quaternion.x,
        actor.body.quaternion.y,
        actor.body.quaternion.z,
        actor.body.quaternion.w
      );

      // Tail wag
      const tail = actor.mesh.children[actor.mesh.children.length - 1];
      if (tail) {
        tail.rotation.z = Math.sin(this.time * 6 + actor.id.charCodeAt(0)) * 0.3;
      }

      // AI movement
      actor.waitTimer -= 1 / 60;
      if (actor.waitTimer <= 0) {
        actor.waitTimer = 1 + Math.random() * 3;
        const angle = Math.random() * Math.PI * 2;
        const dist = 2 + Math.random() * 4;
        actor.target.set(
          Math.cos(angle) * dist,
          0.55,
          Math.sin(angle) * dist
        );
      }

      const dx = actor.target.x - actor.body.position.x;
      const dz = actor.target.z - actor.body.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 0.5) {
        const speed = 3;
        actor.body.velocity.x = (dx / dist) * speed;
        actor.body.velocity.z = (dz / dist) * speed;
      } else {
        actor.body.velocity.x *= 0.8;
        actor.body.velocity.z *= 0.8;
      }

      // Keep upright
      actor.body.quaternion.set(0, 0, 0, 1);
      actor.body.angularVelocity.set(0, 0, 0);
    }

    // Random inter-pet conversation
    if (this.actors.length >= 2 && Math.random() < 0.002) {
      const a = this.actors[Math.floor(Math.random() * this.actors.length)];
      const b = this.actors[Math.floor(Math.random() * this.actors.length)];
      if (a !== b) {
        this.speak(a);
        setTimeout(() => this.speak(b), 1500);
      }
    }

    this.renderer.render(this.scene, this.camera);
    this.animFrame = requestAnimationFrame(() => this.animate());
  }

  private dispose(): void {
    cancelAnimationFrame(this.animFrame);
    window.removeEventListener('resize', () => this.onResize());
    this.renderer.dispose();
    this.onBack();
  }

  getElement(): HTMLElement {
    return this.container;
  }
}
