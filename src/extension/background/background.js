
chrome.runtime.onMessage.addListener((msg) => {
    console.log('msg', msg)
    switch (msg.type) {
        case "UPDATE_CUSTOM_PROMPT":
            // sendAnalytics(msg.details);
            setUpCustomChromeMenuOption(msg.arr)
            break;
        default:
            break;
    }

});
chrome.action.onClicked.addListener(function(tab) {
    if (tab.url && !tab.url.startsWith("chrome://")) {
        if (tab.url.indexOf("?internalWindow") === -1) {
            injectSideMenuWithAngular(tab.id);
        }
        var url = new URL(tab.url);
        injectContentHostScript(tab.id, url.hostname)
    }
})

// inject sidebar and chat gpt scripts when page loaded
// chrome.tabs.onUpdated.addListener(function (tabId , info, tab) {
//     if (info.status === 'complete') {
//         console.log('onUpdated complete event', info)
//         if (tab.url && !tab.url.startsWith("chrome://")) {
//             injectSideMenuWithAngular(tab.id);
//             console.log('tabId1', tabId)
//         //     var url = new URL(tab.url);
//         //     injectContentHostScript(tab.id, url.hostname)
//         }
//     }
// });
chrome.webNavigation.onCompleted.addListener(function(event) {
    if (event.frameType === 'outermost_frame') {
        if (event.url && event.tabId && event.url.indexOf('internalPopUp') === -1) {
            if (!event.url.startsWith("chrome://")) {
                try {
                    var url = new URL(event.url);
                    injectContentHostScript(event.tabId, url.hostname)
                    // when detecting page inject side menu as well
                    if (event.url.indexOf("?internalWindow") === -1) {
                        injectSideMenuWithAngular(event.tabId);
                    }
                } catch (e) {
                    return e;
                }
            }
        }
    }
}, {
    // url: [{urlMatches : 'https://chat.openai.com/chat'}]
});

chrome.runtime.onInstalled.addListener(function (object) {
    // let externalUrl = "http://yoursite.com/";
    var internalUrl = chrome.runtime.getURL("extension/pages/welcome/welcome.html"); // welcome page

    if (object.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.tabs.create({ url: internalUrl }, function (tab) {
            console.log("New tab launched");
        });
    }
    setUpChromeMenuOption();
});

function injectSideMenuWithAngular(tab_id) {
    chrome.scripting.executeScript({
        target: {tabId: tab_id, allFrames: false},
        files: [
            'extension/scripts/side_menu.js'
        ]
    }).then(() => console.log("script injected in one frame"));
    chrome.scripting.insertCSS({
        target: { tabId: tab_id, allFrames: false},
        files: ["extension/scripts/side_menu.css"]
    }).then(() => console.log("css injected in one frame"));
}

function injectContentHostScript(tab_id, host) {
    let url = chrome.runtime.getURL('extension/inject_to_page/' + host + '/script.js');
    fetch(url).then((res) => {
        chrome.scripting.executeScript({
            target: {tabId: tab_id, allFrames: false},
            files: [
                'extension/inject_to_page/' + host + '/script.js'
            ]
        });
        chrome.scripting.insertCSS({
            target: { tabId: tab_id, allFrames: false},
            files: [
                'extension/inject_to_page/' + host + '/script.css'
            ]
        });
    }, (err) => {

    })
}

function sendHostNameToContentScript(tab_id, host) {
    chrome.tabs.sendMessage(tab_id, {type: 'init-from-background', host: host});
}

// chrome.storage.onChanged.addListener(function(changes, namespace) {
//     if (namespace === 'managed') {
//         console.log('managed storage was updated');
//         chrome.storage.managed.get('api_key', function (data) {
//             console.lo('data', data);
//         });
//         // Handle changes to the managed storage area
//     }
// });

// chrome.policy.PolicyService.onInitialized.addListener(function() {
//     var apiKeyPolicy = new chrome.policy.StringPolicy({
//         // levelOfControl: "DOMAIN",
//         // mandatoryDomains: ["example.com"],
//
//         // levelOfControl: "RECOMMENDED",
//         // policyName: "apiKey",
//         // value: "your_api_key_here"
//
//
//         // To set up a recommended policy that can be set by the administrator, follow these steps:
//         //
//         // Log in to the Google Admin console at https://admin.google.com using your administrator account.
//         //
//         // Click on "Devices" and then "Chrome management".
//         //
//         // Click on "User & browser settings".
//         //
//         // Under "User settings", click on "Add a new policy".
//         //
//         // Enter a name for the policy and set the "Level" to "Recommended".
//         //
//         // Under "Settings", enter the key name (e.g. "apiKey") and the default value for the policy.
//         //
//         // Click on "Save" to create the policy.
//         //
//         // Once the policy is created, the administrator can set a new value for the policy by following these steps:
//         //
//         // Log in to the Google Admin console at https://admin.google.com using your administrator account.
//         //
//         // Click on "Devices" and then "Chrome management".
//         //
//         // Click on "User & browser settings".
//         //
//         // Under "User settings", find the policy you want to update and click on the name of the policy.
//         //
//         // Under "Settings", enter the new value for the policy.
//         //
//         // Click on "Save" to update the policy.
//         //
//         // The updated value for the policy will be distributed to all users who have the extension installed and the extension will read the updated value from the "chrome.storage.managed" API. Note that it may take some time for the updated value to be distributed to all users.
//
//         levelOfControl: "MACHINE",
//         policyName: "api_key",
//         value: "your_api_key_here"
//     });
//     chrome.policy.PolicyService.setPolicy(apiKeyPolicy);
// });

chrome.identity.getProfileUserInfo(async function(userInfo) {
    // console.log('userInfo.email', userInfo.email)
    var domain = userInfo.email.substring(userInfo.email.indexOf('@') + 1);
    // console.log('domain', domain)
    // var auth = new google.auth.GoogleAuth({
    //     scopes: ['https://www.googleapis.com/auth/admin.directory.domain.readonly']
    // });
    // var client = await auth.getClient();
    // var admin = google.admin({version: 'directory_v1', auth: client});
    // var response = await admin.domains.get({domainName: domain});
    // console.log(response.data);
});

function setUpChromeMenuOption() {
    // var parent = chrome.contextMenus.create({"title": "Gaia", "id": "gaiaMain"});
    // var child1 = chrome.contextMenus.create(
    //     {"title": "Summarize:", "parentId": parent, contexts: ["selection"], "id": "gaiaSummarize"});
    // var child2 = chrome.contextMenus.create(
    //     {"title": "Ask:", "parentId": parent, contexts: ["selection"], "id": "gaiaAsk"});
    chrome.contextMenus.create({
        title: 'Gaia',
        // "title": 'Gaia To Chat "%s"',
        contexts: ["selection"],
        id: "gaiaMain"
    });
    chrome.contextMenus.create({
        title: 'Summarize: "%s"',
        // "title": 'Gaia To Chat "%s"',
        contexts: ["selection"],
        parentId: "gaiaMain",
        id: "gaiaSummarize"
    });
    chrome.contextMenus.create({
        title: 'Ask: "%s"',
        // "title": 'Gaia To Chat "%s"',
        contexts: ["selection"],
        parentId: "gaiaMain",
        id: "gaiaAsk"
    });
    chrome.contextMenus.create({
        title: 'Expend: "%s"',
        // "title": 'Gaia To Chat "%s"',
        contexts: ["selection"],
        parentId: "gaiaMain",
        id: "gaiaExpend"
    });
    const parentId = "customPrompt";
    chrome.contextMenus.create({
        title: 'Custom Prompt',
        parentId: "gaiaMain",
        contexts: ["selection"],
        enabled: false,
        visible: false,
        id: parentId
    });
    chrome.contextMenus.create({
        title: 'Custom1: "%s"',
        // "title": 'Gaia To Chat "%s"',
        contexts: ["selection"],
        enabled: false,
        visible: false,
        parentId: parentId,
        id: 'Custom1'
    });
    chrome.contextMenus.create({
        title: 'Custom2: "%s"',
        // "title": 'Gaia To Chat "%s"',
        contexts: ["selection"],
        enabled: false,
        visible: false,
        parentId: parentId,
        id: 'Custom2'
    });
    chrome.contextMenus.create({
        title: 'Custom3: "%s"',
        // "title": 'Gaia To Chat "%s"',
        contexts: ["selection"],
        enabled: false,
        visible: false,
        parentId: parentId,
        id: 'Custom3'
    });
    chrome.contextMenus.create({
        title: 'Custom4: "%s"',
        // "title": 'Gaia To Chat "%s"',
        contexts: ["selection"],
        enabled: false,
        visible: false,
        parentId: parentId,
        id: 'Custom4'
    });
    chrome.contextMenus.create({
        title: 'Custom5: "%s"',
        // "title": 'Gaia To Chat "%s"',
        contexts: ["selection"],
        enabled: false,
        visible: false,
        parentId: parentId,
        id: 'Custom5'
    });
    // chrome.contextMenus.create({
    //     "title": 'Send To Chat "%s"',
    //     contexts: ["selection"],
    //     "id": "myContextMenuId"
    // });
    // chrome.contextMenus.create({
    //     "title": 'Send To Chat "%s"',
    //     contexts: ["selection"],
    //     "id": "myContextMenuId"
    // });
}


function setUpCustomChromeMenuOption(arr) {
    const mainMenuId = "gaiaMain"
    // var parent = chrome.contextMenus.create({"title": "Gaia", "id": "gaiaMain"});
    // var child1 = chrome.contextMenus.create(
    //     {"title": "Summarize:", "parentId": parent, contexts: ["selection"], "id": "gaiaSummarize"});
    // var child2 = chrome.contextMenus.create(
    //     {"title": "Ask:", "parentId": parent, contexts: ["selection"], "id": "gaiaAsk"});
    const parentId = "customPrompt";
    chrome.contextMenus.update(parentId,{
        enabled: false,
        visible: false,
    });
    if (arr && arr.length) {
        let limit = 5;
        chrome.contextMenus.update(parentId,{
            enabled: true,
            visible: true,
        });
        for (let i = 0; i < limit; i++) {
            const idNum = i + 1;
            chrome.contextMenus.update('Custom' + idNum,{
                enabled: false,
                visible: false,
            });
        }
        limit = arr.length > 5 ? 5 : arr.length;
        for (let i = 0; i < limit; i++) {
            const item = arr[i]
            const idNum = i + 1;
            const id = 'Custom' + idNum;
            chrome.contextMenus.update(id,{
                title: item.title + ': "%s"',
                enabled: true,
                visible: true,
            });
            const objToSet = {}
            objToSet[id] = item.title;
            chrome.storage.sync.set(objToSet)
        }
    }
}

chrome.contextMenus.onClicked.addListener(function(info, tab) {
    let text = info.selectionText;
    console.log('info', info)
    if (info.menuItemId === 'gaiaSummarize') {
        text = 'Summarize:\n ' + text;
    } else if (info.menuItemId === 'gaiaAsk') {
        text = 'Ask:\n ' + text;
    } else if (info.menuItemId === 'gaiaExpend') {
        text = 'Expend:\n ' + text;
    } else {
        const orig_text = text;
        text = '';
        chrome.storage.sync.get(info.menuItemId, function (obj) {
            if (obj && obj[info.menuItemId]) {
                text = obj[info.menuItemId] + ':\n' + orig_text;
                chrome.tabs.sendMessage(tab.id, {type: 'chat', text: text});
            }
        })
    }
    if (text) {
        chrome.tabs.sendMessage(tab.id, {type: 'chat', text: text});
    }
})


// chrome.identity.getAuthToken({ 'interactive': false }, token => {
//     console.log('token', token)
//     if (chrome.runtime.lastError) {
//         // Handle error
//     } else {
//         // Use token to fetch user info
//         fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
//             headers: {
//                 Authorization: 'Bearer ' + token
//             }
//         }).then(function(response) {
//             if (response.ok) {
//                 return response.json();
//             } else {
//                 throw new Error('Failed to fetch user info');
//             }
//         }).then(function(userinfo) {
//             // Display user info
//             console.log('Email address:', userinfo);
//         }).catch(function(error) {
//             // Handle error
//         });
//     }
// })
