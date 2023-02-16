chrome.action.onClicked.addListener(function(tab) {
    injectSideMenuWithAngular(tab.id);
})

// inject sidebar and chat gpt scripts when page loaded
chrome.webNavigation.onCompleted.addListener(function(event) {
    if (event.url && event.tabId) {
        try {
            var url =  new URL(event.url);
            injectContentHostScript(event.tabId, url.hostname)
            // when detecting page inject side menu as well
            injectSideMenuWithAngular(event.tabId);
        }
        catch(e) { return e; }
    }
}, {url: [{urlMatches : 'https://chat.openai.com/chat'}]});

chrome.runtime.onInstalled.addListener(function (object) {
    // let externalUrl = "http://yoursite.com/";
    var internalUrl = chrome.runtime.getURL("extension/pages/welcome/welcome.html"); // welcome page

    if (object.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.tabs.create({ url: internalUrl }, function (tab) {
            console.log("New tab launched");
        });
    }
});

function injectSideMenuWithAngular(tab_id) {
    chrome.scripting.executeScript({
        target: {tabId: tab_id, allFrames: true},
        files: [
            'extension/scripts/side_menu.js'
        ]
    });
    chrome.scripting.insertCSS({
        target: { tabId: tab_id, allFrames: true },
        files: ["extension/scripts/side_menu.css"]
    });
}

function injectContentHostScript(tab_id, host) {
    chrome.scripting.executeScript({
        target: {tabId: tab_id, allFrames: true},
        files: [
            'extension/inject_to_page/' + host + '/script.js'
        ]
    });
    chrome.scripting.insertCSS({
        target: { tabId: tab_id, allFrames: true },
        files: [
            'extension/inject_to_page/' + host + '/script.css'
        ]
    });
}

function sendHostNameToContentScript(tab_id, host) {
    chrome.tabs.sendMessage(tab_id, {type: 'init-from-background', host: host});
}
