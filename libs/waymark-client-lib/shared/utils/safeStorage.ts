/**
 * Facade for localStorage and sessionStorage which can safely fall back to in-memory storage
 * if storage access is blocked/disabled by the browser.
 * This is particularly an issue for us when our site is being run in an iframe in
 * an incognito window, as 3rd-party site data is blocked by default in that case.
 * Because the site is used in iframes for SDK integrations, this is a very real issue, meaning we should avoid directly accessing
 * localStorage or sessionStorage anywhere in the app in favor of using this facade.
 */
export class SafeStorage implements Storage {
  storage!: Storage;
  fallbackStorage: Record<string, string> | null = null;

  constructor(storageType: 'localStorage' | 'sessionStorage' = 'localStorage') {
    try {
      // Attempt to grab a reference to the browser storage that we want to use; this will throw
      // an error if access is blocked.
      this.storage = window[storageType];
    } catch (err) {
      console.warn(
        `Access to window.${storageType} was blocked; falling back to in-memory storage`,
      );
      this.fallbackStorage = {};
    }
  }

  get length(): number {
    if (this.fallbackStorage) {
      return Object.keys(this.fallbackStorage).length;
    }

    return this.storage.length;
  }

  setItem(key: string, value: string): void {
    // Ensure the value is cast as a string
    const valueAsString = String(value);

    if (this.fallbackStorage) {
      this.fallbackStorage[key] = valueAsString;
      return;
    }

    this.storage.setItem(key, valueAsString);
  }

  getItem(key: string): string | null {
    if (this.fallbackStorage) {
      return this.fallbackStorage[key] ?? null;
    }

    return this.storage.getItem(key);
  }

  removeItem(key: string): void {
    if (this.fallbackStorage) {
      delete this.fallbackStorage[key];
      return;
    }

    this.storage.removeItem(key);
  }

  clear(): void {
    if (this.fallbackStorage) {
      this.fallbackStorage = {};
      return;
    }

    this.storage.clear();
  }

  key(index: number): string | null {
    if (this.fallbackStorage) {
      return Object.keys(this.fallbackStorage)[index] ?? null;
    }

    return this.storage.key(index);
  }
}

export const safeLocalStorage = new SafeStorage('localStorage');
export const safeSessionStorage = new SafeStorage('sessionStorage');
