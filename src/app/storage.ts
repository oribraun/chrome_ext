import { environment } from '@environment';
import {Config} from "./config";
import * as CryptoJS from "crypto-js";

const secret = "My Secret Passphrase";

export class Storage {

    public static async get(key: string): Promise<{ [key: string]: string | number | boolean }> {
        if (chrome.storage) {
            return chrome.storage.sync.get(key);
        } else {
            const obj: any = {}
            obj[key] = localStorage.getItem(key)
            return new Promise((resolve, reject) => {
                resolve(obj);
            })
        }
    }

    public static async set(key: string, value: any): Promise<void> {
        if (chrome.storage) {
            return chrome.storage.sync.set({[key]: value});
        } else {
            return new Promise((resolve, reject) => {
                resolve(localStorage.setItem(key, value))
            })
        }
    }

    public static async remove(key: string): Promise<void> {
        if (chrome.storage) {
            return chrome.storage.sync.remove(key);
        } else {
            return new Promise((resolve, reject) => {
                resolve(localStorage.removeItem(key))
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
        // return `${environment.appStoragePrefix}_${key}`;
        return key;
    }

    private static Encrypt(word: string, key = 'share') {
        let encJson = CryptoJS.AES.encrypt(JSON.stringify(word), key).toString()
        let encData = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(encJson))
        return encData
    }

    private static Decrypt(word: string, key = 'share') {
        let decData = CryptoJS.enc.Base64.parse(word).toString(CryptoJS.enc.Utf8)
        let bytes = CryptoJS.AES.decrypt(decData, key).toString(CryptoJS.enc.Utf8)
        return JSON.parse(bytes)
    }
}
