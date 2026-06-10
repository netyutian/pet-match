export type ScreenName = 'menu' | 'levelSelect' | 'game' | 'home';

export class ScreenManager {
  private container: HTMLElement;
  private screens: Map<ScreenName, HTMLElement> = new Map();
  private current: ScreenName | null = null;

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) {
      throw new Error(`ScreenManager: container with id "${containerId}" not found`);
    }
    this.container = el;
  }

  register(name: ScreenName, element: HTMLElement): void {
    element.classList.add('screen');
    element.style.display = 'none';
    this.container.appendChild(element);
    this.screens.set(name, element);
  }

  show(name: ScreenName): void {
    const target = this.screens.get(name);
    if (!target) {
      throw new Error(`ScreenManager: screen "${name}" is not registered`);
    }

    for (const el of this.screens.values()) {
      el.classList.remove('active');
      el.style.display = 'none';
    }

    target.style.display = 'flex';
    target.classList.add('active');
    this.current = name;
  }

  getCurrent(): ScreenName | null {
    return this.current;
  }
}
