import {tabsManager} from "./tab_store.js";

// console.log('tabsManager', tabsManager.tabStore)

class ChatGPTClient {
    storageKey = "gaia-chatgpt-token"
    chatGPTUrl = "https://chat.openai.com/chat";
    chatGptBackendApi = 'https://chat.openai.com/backend-api/';
    chatGPTApiUrl = "https://chat.openai.com/backend-api/conversation";
    chatGptGetConversationUrl = 'https://chat.openai.com/backend-api/conversations?offset=0&limit=20'
    creatingWindow = false;

    accessToken = '';

    controller;

    constructor() {
        this.init();
    }

    init = async () => {
        this.getAccessTokenFromApi().then(() => {
            // console.log('getAccessTokenFromApi success', this.accessToken)
        }).catch(() => {
            // console.log('getAccessTokenFromApi rejected')
            this.getTokenFromStorage().then(() => {
                // console.log('getTokenFromStorage success', this.accessToken)
            }).catch(() => {
                // console.log('getTokenFromStorage rejected')
                this.tryToGetFromWindow()
            });
        })
    }

    generalResponse() {
        const response = {
            err: 0,
            errMessage: '',
            status: 0,
            text: '',
            data: {},
            toManyRequests: false,
            messageLength: false
        }
        return response;
    }

    getTokenFromStorage = () => {
        return new Promise((resolve, reject) => {
            chrome.storage.local
                .get(this.storageKey)
                .then((result) => {
                    if (result[this.storageKey]) {
                        this.accessToken = result[this.storageKey];
                    }
                    if (this.accessToken) {
                        resolve(1);
                    } else {
                        reject(0);
                    }
                }).catch((err) => {});
        });
    }

    tryToGetFromWindow() {
        // console.log('tryToGetFromWindow')
        if (this.creatingWindow) {
            return;
        }
        this.creatingWindow = true;
        chrome.windows.create(
            {
                url: this.chatGPTUrl + '?internalWindow',
                state: "minimized"

            },
            (window) => {
                this.creatingWindow = false;
                if (window) {
                    this.removeWindow(window.id);
                }
            });
    }

    removeWindow(window_id) {
        setTimeout(() => {
            this.getTokenFromStorage().then(() => {
                // console.log('removeWindow getTokenFromStorage success', this.accessToken)
            }).catch(() => {
                // console.log('removeWindow getTokenFromStorage rejected')
                this.getAccessTokenFromApi().then(() => {
                    // console.log('removeWindow getAccessTokenFromApi success', this.accessToken)
                }).catch(() => {
                    // console.log('removeWindow getAccessTokenFromApi rejected')
                })
            });
            // console.log('this.accessToken', this.accessToken)
            chrome.windows.remove(window_id);
        }, 2000)
    }

    generateChatGPTReponse = async (payload, cb) => {
        let retryCount = 0, requestCount = 0;

        let models = [];

        this.controller = new AbortController();

        const response = this.generalResponse();
        // const resp = await this.getModels(this.accessToken);
        // if (resp.status !== 200) {
        //     response.err = 1;
        //     let resJson;
        //     try {
        //         resJson = await resp.json();
        //     } catch (e){}
        //     response.data = resJson;
        //     if (resp.status === 401 || resp.status === 403) {
        //         response.errMessage = "Unauthorized";
        //     } else if (resp.status === 429) {
        //         response.errMessage = resJson?.detail;
        //         response.toManyRequests = true;
        //     } else if (resp.status === 413) {
        //         response.errMessage = resJson?.detail?.message;
        //         response.messageLength = true;
        //     } else {
        //         response.errMessage = resJson?.detail || "something went wrong";
        //     }
        //     // sendAnalytics({ event: "error", type: resp.status, response: response });
        //     return cb(response);
        // } else {
        //     const resJson = await resp.json();
        //     models = resJson?.models
        // }
        //
        // const maxRequestCount = models.length < 5 ? 5 : models.length;
        //
        const maxRequestCount = 5;

        const sendRequestToChatGPT = async () => {
            if (requestCount > maxRequestCount) {
                response.err = 1;
                response.errMessage = "Unauthorized"
                return cb(response);
            }

            const resp = await fetch("https://chat.openai.com/backend-api/conversation", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.accessToken}`,
                },
                body: JSON.stringify({
                    ...payload,
                    model: models[retryCount]?.slug ?? payload.model
                }),
                signal: this.controller.signal
            });
            requestCount++;
            if (resp.status !== 200) {
                response.err = 1
                response.status = resp.status;
                try {
                    response.text = payload.messages[0].content.parts[0];
                } catch (err) {}
                let resJson;
                try {
                    resJson = await resp.json();
                } catch (e){}
                response.data = resJson;
                if (resp.status === 401 || resp.status === 403) {
                    response.errMessage = "Unauthorized";
                    if (this.accessToken) {
                        this.accessToken = '';
                    }
                } else if (resp.status === 429) {
                    response.errMessage = resJson?.detail;
                    response.toManyRequests = true;
                } else if (resp.status === 413) {
                    response.errMessage = resJson?.detail?.message;
                    response.messageLength = true;
                } else if (resp.status === 500) {
                    response.errMessage = "Unauthorized";
                    if (this.accessToken) {
                        this.accessToken = '';
                    }
                } else {
                    response.errMessage = resJson?.detail || resJson?.detail?.message || "something went wrong";
                }
                sendAnalytics({ event: "chat-gpt-error", type: resp.status, json: response });
                return cb(response);
            }

            // if (resp.status === 401 || resp.status === 403) {
            //     sendAnalytics({ event: "error", type: resp.status });
            //     return cb({text:"Unauthorized"});
            // }
            // if (resp.status === 429) { // to many requests
            //     const resJson = await resp.json();
            //     sendAnalytics({ event: "error", type: resp.status, data: resJson });
            //     return cb({text:resJson?.detail, toManyRequests: true});
            // }
            // if (resp.status === 413) { // to many requests
            //     const resJson = await resp.json();
            //     sendAnalytics({ event: "error", type: resp.status, data: resJson });
            //     return cb({text:resJson?.detail?.message, messageLength: true});
            // }
            // if ([400, 404, 422, 500].includes(resp.status)) {
            //     // if (retryCount < models.length) {
            //     //     retryCount++;
            //     //     return sendRequestToChatGPT();
            //     // }
            //     sendAnalytics({ event: "error", type: resp.status });
            //     const resJson = await resp.json();
            //     console.log('resJson', resJson)
            //     return cb({text:"Unauthorized", detail: resJson?.detail});
            //     // return cb({text:"Unauthorized"});
            // }

            for await (const chunk of this.streamAsyncIterable(resp.body)) {
                try {
                    const str = new TextDecoder().decode(chunk);

                    const data_arr = str
                        .split(/\r?\n/)
                        .filter((x) => x !== "")
                        .map((x) => x.replace("data: ", ""));
                    data_arr.forEach((str) => {
                        if (str === "[DONE]") {
                            return cb({ done: true });
                        } else {
                            const data = JSON.parse(`${str}`);
                            // const message_id = data.message.id;
                            // const conversation_id = data.conversation_id;
                            const text = data.message?.content?.parts?.[0];
                            response.text = text;
                            response.data = data
                            if (text) {
                                cb(response);
                            }
                        }
                    });
                } catch { }
            }
        };

        //call the function
        return await sendRequestToChatGPT();
    };

    updateAccessToken = (token) => {
        this.accessToken = token;
        const obj = {}
        obj[this.storageKey] = token;
        chrome.storage.local.set(obj);
    };

    getAccessTokenFromApi = async () => {
        return new Promise((resolve, reject) => {
            const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36"
            fetch("https://chat.openai.com/api/auth/session", {
                headers: {
                    cookie: `__Secure-next-auth.session-token=${this.accessToken}`,
                    "user-agent": userAgent
                }
            }).then(async (response) => {
                // console.log('response', response);
                if (response.status === 200) {
                    let json = await response.json()
                    // console.log('json', json)
                    if (json.accessToken) {
                        this.updateAccessToken(json.accessToken);
                        resolve(1);
                    } else {
                        reject(0);
                    }
                } else {
                    reject(0)
                }
            }).catch(() => {
                reject(0)
            });
        })
    };

    getModels = async (accessToken) => {
        const resp = await fetch("https://chat.openai.com/backend-api/models", {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`
            },
        });
        return resp;
        // if (resp.status === 401 || resp.status === 403) return { models: [], statusCode: resp.status };
        //
        // const resJson = await resp.json();
        // return { models: resJson?.models ?? [], statusCode: resp.status };
    }

    getLastConversation = async () => {
        const resp = await fetch("https://chat.openai.com/backend-api/conversations?offset=0&limit=20", {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.accessToken}`
            },
        });

        if (resp.status === 401 || resp.status === 403) return { models: [], statusCode: resp.status };

        const resJson = await resp.json();
        let lastConversationId = '';
        if (resJson?.items && resJson?.items.length) {
            lastConversationId = resJson.items[0].id;
        }
        return { lastConversationId: lastConversationId, statusCode: resp.status };
    }

    generateModerations = async (conversationId, input, message_id) => {
        const resp = await fetch("https://chat.openai.com/backend-api/moderations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.accessToken}`,
            },
            body: JSON.stringify({
                conversation_id: conversationId,
                input: input,
                message_id: message_id,
                model: "text-moderation-playground"
            }),
        });

        if (resp.status === 401 || resp.status === 403) return { models: [], statusCode: resp.status };

        const resJson = await resp.json();
        return { moderation_id: resJson.moderation_id, statusCode: resp.status };
    }

    generateConversationTitle = async (conversationId, message_id, model) => {
        const resp = await fetch("https://chat.openai.com/backend-api/conversation/gen_title/" + conversationId, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.accessToken}`,
            },
            body: JSON.stringify({
                message_id: message_id,
                model: model,
            }),
        });

        if (resp.status === 401 || resp.status === 403) return { models: [], statusCode: resp.status };

        const resJson = await resp.json();
        return { title: resJson.title, statusCode: resp.status };
    }

    openChatGPT = () => {
        return new Promise((resolve) => {
            const self = this;
            chrome.windows.create(
                {
                    url: this.chatGPTUrl + '?internalPopUp',
                    state: "minimized",

                },
                (window) => {

                    let newTabId = window.tabs[0].id;
                    let lastUrl = window.tabs[0].url;

                    chrome.tabs.onUpdated.addListener(function tabListener(tabId, info) {
                        if (info.url && tabId == newTabId) lastUrl = info.url;

                        if (tabId == newTabId && info.status == "complete") {
                            chrome.tabs.onUpdated.removeListener(tabListener);
                            if (self.chatGPTUrl !== lastUrl) {
                                chrome.windows.update(window.id, {
                                    state: "normal",
                                    width: 800,
                                    height: 600,
                                });
                                self.updateAccessToken(undefined);
                            }

                            if (self.chatGPTUrl === lastUrl) {
                                setTimeout(() => {
                                    chrome.windows.remove(window.id);
                                    resolve();
                                }, 2000);
                            } else {
                                resolve();
                            }
                        }
                    });
                }
            );
        });
    };

    async *streamAsyncIterable(stream) {
        const reader = stream.getReader();
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    return;
                }
                yield value;
            }
        } finally {
            reader.releaseLock();
        }
    }

    cancelStream() {
        if (this.controller) {
            this.controller.abort()
        }
    }
}

const uuidv4 = () => {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
        (
            c ^
            (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
        ).toString(16)
    );
};

const getUniqueId = async () => {
    let uniqueId = (await chrome.storage.local.get("gaia-extension-unique-id"))["gaia-extension-unique-id"];

    if (!uniqueId) {
        uniqueId = uuidv4();
        chrome.storage.local.set({ "gaia-extension-unique-id": uniqueId });
    }

    return uniqueId;
};

function isObject(obj) {
    return obj !== undefined && obj !== null && obj.constructor == Object;
}
const sendAnalytics = async (obj) => {

    const payload = {
        event: obj.event,
        properties: {
            distinct_id: await getUniqueId(),
            token: "d4af68efc97684ea4e001d1e662c335a",
            type: obj.type,
            // data: obj.data,
        }
    };
    if (obj?.json && isObject(obj?.json)) {
        payload.properties.json = obj?.json
    }
    if (obj?.data && isObject(obj?.data)) {
        payload.properties = {...payload.properties, ...obj?.data}
    }

    const resp = await fetch("https://api.mixpanel.com/track/?ip=1&verbose=1", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify([payload]),
    });
};



try {
    const chatgpt = new ChatGPTClient();

    chrome.runtime.onInstalled.addListener(function (details) {
        if (details.reason == "install") {
            // chrome.tabs.create({
            //   url: "https://link.chatgpteverywhere.com/oninstall",
            //   active: true,
            // });

            chrome.storage.local.set(
                { "gaia-extension": { "date-installed": new Date() } },
                function () { }
            );
        }

        // if (details.reason == 'update') {
        //   chrome.tabs.create({
        //     url: "https://link.chatgpteverywhere.com/onupdate",
        //     active: true,
        //   });
        // }

        return;
    });

    // chrome.runtime.setUninstallURL(
    //   "https://link.chatgpteverywhere.com/onuninstall"
    // );
    //
    // chrome.action.onClicked.addListener((tab) => {
    //     console.log('clicked')
    //   chrome.tabs.sendMessage(tab.id, {
    //     type: "actionClicked",
    //   });
    // });
    const ports = []
    chrome.runtime.onConnect.addListener((port) => {
        ports.push(port)
        let isDisconnected = false;
        if (port.name === "chatGptPort") {
            port.onMessage.addListener((msg) => {
                // console.log('msg', msg)
                if (msg.type === 'chatGptRequest') {
                    if (msg.payload) {
                        chatgpt.generateChatGPTReponse(msg.payload, (answer) => {
                            if (!isDisconnected) port.postMessage({port: port.name, type: msg.type, answer: answer});
                        }).then(() => {

                        }).catch((err) => {
                            // console.log('network error', err);
                            const response = chatgpt.generalResponse();
                            response.err = 1;
                            response.errMessage = err.message;
                            try {
                                response.text = msg.payload.messages[0].content.parts[0];
                            } catch (err) {}
                            if (response.errMessage === 'The user aborted a request.') {
                                response.errMessage = 'Aborted.'
                            } else {
                                sendAnalytics({ event: "chat-gpt-error", type: 'exception', json: response });
                            }
                            if (!isDisconnected) port.postMessage({port: port.name, type: msg.type, answer: response});
                        });
                    }
                }
                // if (msg.type === 'chatGptGetConversation') {
                //     chatgpt.getLastConversation().then((res) => {
                //         if (!isDisconnected) port.postMessage({port: port.name, type: msg.type, lastConversationId: res.lastConversationId});
                //     });
                // }
                if (msg.type === 'chatGptGenModerations') {
                    chatgpt.generateModerations(msg.conversation_id, msg.input, msg.message_id).then((res) => {
                        if (!isDisconnected) port.postMessage({port: port.name, type: msg.type, moderation_id: res.moderation_id});
                    }).catch((err) => {});
                }
                if (msg.type === 'chatGptGenTitle') {
                    chatgpt.generateConversationTitle(msg.conversation_id, msg.message_id, msg.model).then((res) => {
                        if (!isDisconnected) port.postMessage({port: port.name, type: msg.type, title: res.title});
                    }).catch((err) => {});
                }
                if (msg.type === 'chatGptRefreshToken') {
                    chatgpt.getTokenFromStorage().then(() => {
                        // console.log('chatGptPortRefreshToken getTokenFromStorage success', this.accessToken)
                    }).catch(() => {
                        // console.log('chatGptPortRefreshToken getTokenFromStorage rejected')
                    });
                }
                if (msg.type === 'chatGptGetSessionToken') {
                    if (!chatgpt.accessToken) {
                        chatgpt.getAccessTokenFromApi().then(() => {
                            if (chatgpt.accessToken) {
                                for (let tab_id in tabsManager.tabStore) {
                                    chrome.tabs.sendMessage(parseInt(tab_id), {
                                        type: 'chatGptGotToken',
                                        token: chatgpt.accessToken
                                    }, () => {
                                        console.log('chrome.runtime.lastError', chrome.runtime.lastError)
                                    });
                                }
                            }
                            // console.log('chatGptPortRefreshToken getTokenFromStorage success', this.accessToken)
                        }).catch(() => {
                            // console.log('chatGptPortRefreshToken getTokenFromStorage rejected')
                        });
                    }
                }
                if (msg.type === 'chatGptGotToken') {
                    console.log('msg', msg)
                    chatgpt.updateAccessToken(msg.token);
                    // port.postMessage({port: port.name, type: 'chatGptGotToken', token: msg.token});
                    for (let tab_id in tabsManager.tabStore) {
                        chrome.tabs.sendMessage(parseInt(tab_id), {type: 'chatGptGotToken', token: msg.token});
                    }
                    // chrome.tabs.query({}, function(tabs) {
                    //     tabs.forEach(function(tab) {
                    //         chrome.tabs.sendMessage(tab.id, {type: 'chatGptGotToken', token: msg.token});
                    //     });
                    // });
                }
            });

            port.onDisconnect.addListener(function () {
                isDisconnected = true;
            });
        }
    });

    chrome.runtime.onMessage.addListener((msg) => {
        // console.log('msg', msg)
        switch (msg.type) {
            case "chatGptGotToken":
                chatgpt.updateAccessToken(msg.token);
                break;
            case "chatGptStopStream":
                // console.log('chatGptStopStream')
                chatgpt.cancelStream();
                break;
            case "SEND_ANALYTICS":
                sendAnalytics(msg.obj);
                break;
            default:
                break;
        }

    });
} catch (e) { }
