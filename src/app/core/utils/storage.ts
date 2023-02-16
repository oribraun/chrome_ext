import { environment } from '@environment';

export class Storage {
    public static async get(key: string): Promise<{ [key: string]: string | number | boolean }> {
        if (chrome.storage) {
            return chrome.storage.sync.get(this.getKey(key));
        } else {
            key = this.getKey(key)
            const obj: any = {}
            obj[key] = localStorage.getItem(key)
            return new Promise((resolve, reject) => {
                resolve(obj);
            })
        }
    }

    public static async set(key: string, value: any): Promise<void> {
        if (chrome.storage) {
            return chrome.storage.sync.set({[this.getKey(key)]: value});
        } else {
            return new Promise((resolve, reject) => {
                resolve(localStorage.setItem(this.getKey(key), value))
            })
        }
    }

    public static async remove(key: string): Promise<void> {
        if (chrome.storage) {
            return chrome.storage.sync.remove(this.getKey(key));
        } else {
            return new Promise((resolve, reject) => {
                resolve(localStorage.removeItem(this.getKey(key)))
            })
        }
    }

    public static async clear(): Promise<void> {
        if (chrome.storage) {
            return chrome.storage.sync.clear();
        } else {
            return new Promise((resolve, reject) => {
                resolve(localStorage.clear())
            })
        }
    }

    public static async getBytesInUse(): Promise<number> {
        if (chrome.storage) {
            return chrome.storage.sync.getBytesInUse();
        } else {
            return new Promise((resolve, reject) => {
                resolve(new Blob(Object.values(localStorage)).size)
            })
        }
    }

    private static getKey(key: string): string {
        return `${environment.appStoragePrefix}_${key}`;
    }
}
