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
  rat: ['吱吱！你好呀！', '我今天找到好多奶酪！', ' maze 是我的强项！', '想一起玩吗？'],
  ox: ['哞哞！你好！', '我力气很大的哦！', '青草真好吃！', '需要帮忙搬东西吗？'],
  tiger: ['嗷呜！我是百兽之王！', '我的爪子很锋利！', '今天要去巡视领地！', '你想听我的故事吗？'],
  rabbit: ['蹦蹦跳跳真开心！', '胡萝卜是我的最爱！', '我的耳朵能听到很远的声音！', '要一起挖洞吗？'],
  dragon: ['呼——我会喷火哦！', '龙珠糖真甜！', '我是十二生肖里最厉害的！', '要不要飞一圈？'],
  snake: ['嘶嘶——你好！', '鸡蛋真美味！', '我喜欢晒太阳！', '要玩捉迷藏吗？'],
  horse: ['哒哒哒！我跑得快！', '苹果真好吃！', '草原是我的家！', '要骑着我兜风吗？'],
  goat: ['咩咩！你好呀！', '青菜最好吃了！', '我的角很漂亮吧？', '要不要一起爬山？'],
  monkey: ['吱吱吱！你好！', '香蕉是最棒的！', '我爬树可厉害了！', '要表演杂技给你看吗？'],
  rooster: ['喔喔喔！早上好！', '米粒真香！', '我的羽毛很漂亮！', '要不要听我打鸣？'],
  dog: ['汪汪！你好！', '骨头最棒了！', '我会接飞盘！', '要一起散步吗？'],
  pig: ['哼哼！你好！', '红薯真好吃！', '我喜欢在泥里打滚！', '要一起睡午觉吗？'],
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

  constructor(pets: PetSystem, onBack: () => void) {
    this.pets = pets;
    this.onBack = onBack;

    this.container = document.createElement('div');
    this.container.classList.add('screen', 'active');
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
    title.textContent = '我的3D家园';
    title.style.cssText = 'margin:0;color:#6B4F4F;font-size:18px;pointer-events:auto;';
    header.appendChild(title);

    const backBtn = document.createElement('button');
    backBtn.textContent = '返回';
    backBtn.style.cssText = 'padding:8px 16px;font-size:14px;pointer-events:auto;';
    backBtn.addEventListener('click', () => this.dispose());
    header.appendChild(backBtn);

    this.container.appendChild(header);

    const hint = document.createElement('div');
    hint.textContent = '点击动物听它说话';
    hint.style.cssText = 'position:absolute;bottom:12px;left:50%;transform:translateX(-50%);z-index:10;color:#888;font-size:12px;pointer-events:none;';
    this.container.appendChild(hint);
  }

  private init3D(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xE8F5E9);
    this.scene.fog = new THREE.Fog(0xE8F5E9, 20, 40);

    this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    this.camera.position.set(0, 10, 14);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(8, 15, 8);
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
    // Ground
    const groundGeo = new THREE.PlaneGeometry(24, 24);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x90EE90, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const groundBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.world.addBody(groundBody);

    // Fence posts
    const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 1, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const railGeo = new THREE.BoxGeometry(3, 0.08, 0.08);
    const railMat = new THREE.MeshStandardMaterial({ color: 0xA0522D });

    const bounds = 10;
    const segments = 6;
    const step = (bounds * 2) / segments;

    for (let i = 0; i <= segments; i++) {
      const x = -bounds + i * step;
      // Back fence
      this.addFencePost(x, 0.5, -bounds, postGeo, postMat);
      // Front fence
      this.addFencePost(x, 0.5, bounds, postGeo, postMat);
      // Left fence
      this.addFencePost(-bounds, 0.5, x, postGeo, postMat);
      // Right fence
      this.addFencePost(bounds, 0.5, x, postGeo, postMat);
    }

    // Rails + physics walls
    for (let i = 0; i < segments; i++) {
      const x1 = -bounds + i * step;
      const x2 = x1 + step;
      const mid = (x1 + x2) / 2;
      // Horizontal rails (back/front)
      this.addRail(mid, 0.75, -bounds, railGeo, railMat, true);
      this.addRail(mid, 0.75, bounds, railGeo, railMat, true);
      // Vertical rails (left/right)
      this.addRail(-bounds, 0.75, mid, railGeo, railMat, false);
      this.addRail(bounds, 0.75, mid, railGeo, railMat, false);

      // Physics walls
      this.addWall(mid, 0.5, -bounds, step, 1, 0.2);
      this.addWall(mid, 0.5, bounds, step, 1, 0.2);
      this.addWall(-bounds, 0.5, mid, 0.2, 1, step);
      this.addWall(bounds, 0.5, mid, 0.2, 1, step);
    }
  }

  private addFencePost(x: number, y: number, z: number, geo: THREE.CylinderGeometry, mat: THREE.MeshStandardMaterial): void {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    this.scene.add(mesh);
  }

  private addRail(x: number, y: number, z: number, geo: THREE.BoxGeometry, mat: THREE.MeshStandardMaterial, rotateY: boolean): void {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    if (rotateY) mesh.rotation.y = 0; else mesh.rotation.y = Math.PI / 2;
    mesh.castShadow = true;
    this.scene.add(mesh);
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
    const text = actor.dialogues[Math.floor(Math.random() * actor.dialogues.length)];
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.pitch = 1.6;
    utterance.rate = 1.1;
    utterance.volume = 1;
    speechSynthesis.speak(utterance);

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
