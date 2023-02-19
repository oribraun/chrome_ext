chrome.action.onClicked.addListener(function(tab) {
    injectSideMenuWithAngular(tab.id);
    var url =  new URL(tab.url);
    injectContentHostScript(tab.id, url.hostname)
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
    console.log('userInfo.email', userInfo.email)
    var domain = userInfo.email.substring(userInfo.email.indexOf('@') + 1);
    console.log('domain', domain)
    // var auth = new google.auth.GoogleAuth({
    //     scopes: ['https://www.googleapis.com/auth/admin.directory.domain.readonly']
    // });
    // var client = await auth.getClient();
    // var admin = google.admin({version: 'directory_v1', auth: client});
    // var response = await admin.domains.get({domainName: domain});
    // console.log(response.data);
});
