import { FURNITURE_DATA, ROOMS } from '../constants';
import type { HomeSystem } from '../systems/HomeSystem';
import type { PetSystem } from '../systems/PetSystem';
import type { ResourceSystem } from '../systems/ResourceSystem';

export class HomeScreen {
  private container: HTMLElement;
  private home: HomeSystem;
  private pets: PetSystem;
  private resources: ResourceSystem;

  private currentRoomId: string;
  private roomView: HTMLElement;
  private petList: HTMLElement;
  private modal: HTMLElement | null = null;

  constructor(home: HomeSystem, pets: PetSystem, resources: ResourceSystem) {
    this.home = home;
    this.pets = pets;
    this.resources = resources;

    this.currentRoomId = 'living';

    this.container = document.createElement('div');
    this.container.classList.add('screen', 'active');

    const title = document.createElement('h1');
    title.textContent = '我的家园';
    this.container.appendChild(title);

    const tabs = document.createElement('div');
    tabs.style.display = 'flex';
    tabs.style.gap = '8px';
    tabs.style.marginBottom = '12px';
    for (const roomDef of ROOMS) {
      const btn = document.createElement('button');
      btn.textContent = roomDef.name;
      btn.style.padding = '8px 16px';
      btn.style.fontSize = '14px';
      const unlocked = this.home.isRoomUnlocked(roomDef.id);
      if (!unlocked) {
        btn.disabled = true;
        btn.style.opacity = '0.4';
        btn.style.cursor = 'not-allowed';
      } else if (roomDef.id === this.currentRoomId) {
        btn.style.background = '#FF8FA3';
      }
      btn.addEventListener('click', () => {
        if (unlocked) {
          this.currentRoomId = roomDef.id;
          this.renderRoomTabs(tabs);
          this.renderRoomView();
        }
      });
      tabs.appendChild(btn);
    }
    this.container.appendChild(tabs);

    this.roomView = document.createElement('div');
    this.roomView.classList.add('room-view');
    this.container.appendChild(this.roomView);

    const addBtn = document.createElement('button');
    addBtn.textContent = '+ 家具';
    addBtn.style.marginBottom = '16px';
    addBtn.addEventListener('click', () => this.openShopModal());
    this.container.appendChild(addBtn);

    this.petList = document.createElement('div');
    this.petList.classList.add('pet-list');
    this.container.appendChild(this.petList);

    this.renderRoomView();
    this.renderPetList();
  }

  private renderRoomTabs(tabs: HTMLElement): void {
    const buttons = tabs.querySelectorAll('button');
    const roomDefs = ROOMS;
    buttons.forEach((btn, index) => {
      const roomDef = roomDefs[index];
      const unlocked = this.home.isRoomUnlocked(roomDef.id);
      if (unlocked) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.style.background = roomDef.id === this.currentRoomId ? '#FF8FA3' : '#FFB6C1';
      }
    });
  }

  private renderRoomView(): void {
    this.roomView.innerHTML = '';
    const room = this.home.getRoom(this.currentRoomId);
    if (!room) return;

    const furniture = this.home.getRoomFurniture(this.currentRoomId);
    for (const item of furniture) {
      const data = FURNITURE_DATA.find(f => f.id === item.itemId);
      const label = document.createElement('div');
      label.textContent = data?.name ?? item.itemId;
      label.style.position = 'absolute';
      label.style.left = `${item.col * 40}px`;
      label.style.top = `${item.row * 40}px`;
      label.style.background = 'rgba(255,255,255,0.8)';
      label.style.padding = '4px 8px';
      label.style.borderRadius = '8px';
      label.style.fontSize = '12px';
      label.style.boxShadow = '0 1px 4px rgba(0,0,0,0.1)';
      this.roomView.appendChild(label);
    }

    // Render pets in room
    const pets = this.pets.getAllPets();
    for (let i = 0; i < pets.length; i++) {
      const pet = pets[i];
      const petEl = document.createElement('img');
      petEl.src = `/assets/avatars/${pet.id}.png`;
      petEl.style.position = 'absolute';
      petEl.style.width = '48px';
      petEl.style.height = '48px';
      petEl.style.objectFit = 'contain';
      petEl.style.left = `${(i % 3) * 60 + 20}px`;
      petEl.style.top = `${Math.floor(i / 3) * 60 + 20}px`;
      petEl.style.borderRadius = '8px';
      petEl.style.background = 'rgba(255,255,255,0.6)';
      petEl.style.padding = '2px';
      this.roomView.appendChild(petEl);
    }
  }

  private renderPetList(): void {
    this.petList.innerHTML = '';
    for (const pet of this.pets.getAllPets()) {
      const card = document.createElement('div');
      card.classList.add('pet-card');

      const avatar = document.createElement('img');
      avatar.src = `/assets/avatars/${pet.id}.png`;
      avatar.style.width = '40px';
      avatar.style.height = '40px';
      avatar.style.borderRadius = '8px';
      avatar.style.objectFit = 'contain';
      avatar.style.marginRight = '12px';
      card.appendChild(avatar);

      const info = document.createElement('div');
      const name = document.createElement('div');
      name.textContent = pet.name;
      name.style.fontWeight = '600';
      const intimacy = document.createElement('div');
      intimacy.textContent = `亲密度: ${pet.intimacy}`;
      intimacy.style.fontSize = '12px';
      intimacy.style.color = '#888';
      info.appendChild(name);
      info.appendChild(intimacy);

      const feedBtn = document.createElement('button');
      feedBtn.textContent = '喂食';
      feedBtn.style.padding = '8px 16px';
      feedBtn.style.fontSize = '14px';
      feedBtn.addEventListener('click', () => {
        this.pets.feed(pet.id);
        this.renderPetList();
      });

      card.appendChild(info);
      card.appendChild(feedBtn);
      this.petList.appendChild(card);
    }
  }

  private openShopModal(): void {
    if (this.modal) return;

    this.modal = document.createElement('div');
    this.modal.classList.add('modal');

    const content = document.createElement('div');

    const title = document.createElement('h2');
    title.textContent = '家具商店';
    title.style.margin = '0 0 8px';
    content.appendChild(title);

    const items = FURNITURE_DATA.filter(f => f.roomType === this.currentRoomId);
    for (const item of items) {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'center';

      const info = document.createElement('span');
      info.textContent = `${item.name} - ${item.price}金币`;

      const buyBtn = document.createElement('button');
      buyBtn.textContent = '购买';
      buyBtn.style.padding = '6px 12px';
      buyBtn.style.fontSize = '12px';
      buyBtn.addEventListener('click', () => {
        if (this.resources.spendCoins(item.price)) {
          const room = this.home.getRoom(this.currentRoomId);
          const count = room ? room.furniture.length : 0;
          this.home.placeFurniture(this.currentRoomId, item.id, count % 5, Math.floor(count / 5), 0);
          this.renderRoomView();
        }
      });

      row.appendChild(info);
      row.appendChild(buyBtn);
      content.appendChild(row);
    }

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '关闭';
    closeBtn.style.background = '#D3D3D3';
    closeBtn.style.color = '#4A4A4A';
    closeBtn.addEventListener('click', () => this.closeShopModal());
    content.appendChild(closeBtn);

    this.modal.appendChild(content);
    this.container.appendChild(this.modal);
  }

  private closeShopModal(): void {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
  }

  getElement(): HTMLElement {
    return this.container;
  }
}
