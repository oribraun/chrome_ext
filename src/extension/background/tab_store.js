export class tabsManager {

    static tabStore = {}
    constructor() {

    }

    static init() {
        console.log('init tabs manager')
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            this.tabStore[tabId] = tab;
            // console.log('onUpdated tabStore', this.tabStore)
        });
        chrome.tabs.onRemoved.addListener((tabId) => {
            delete this.tabStore[tabId];
            // console.log('onRemoved tabStore', this.tabStore)
        });
    }
}

tabsManager.init();
