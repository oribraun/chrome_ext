class Main {
    interval;
    debug = false;

    constructor() {
        if (typeof window.extentionLastEventListeners !== 'object') {
            window.extentionLastEventListeners = {}
        }
    }

    init(inject) {
        const textarea_clone_list = document.getElementsByClassName('textarea_clone');
        if (textarea_clone_list && textarea_clone_list.length) {
            this.onRemoveInitAngular(this.debug)
        } else {
            if (inject) {
                this.onInitAngular(this.debug);
                this.getTokenFromChatGpt(this.debug);
            }
        }
    }

    getTokenFromChatGpt(debug) {
        if (window.location.host === 'chat.openai.com') {
            // interval = setInterval((() => {
            //     tryToGetToken();
            // }), 500)
            let interval_max = 5;
            this.interval = setInterval(() => {
                if (debug) {
                    console.log('chatGptGetSessionToken')
                }
                if (chrome.runtime) {
                    let chatGptPort = chrome.runtime.connect({name: "chatGptPort"});
                    chatGptPort.postMessage({type: 'chatGptGetSessionToken'});
                }
                interval_max--;
                if (!interval_max) {
                    clearInterval(this.interval)
                }
            }, 500)
        }
    }

    tryToGetToken() {
        this.interval = setInterval(() => {
            // console.log('getTokenFromChatGpt interval')
            let e = document.querySelector('script[id="__NEXT_DATA__"]');
            if (e && e.textContent) {
                let textContent = e.textContent;
                try {
                    let json = JSON.parse(textContent)
                    if (json && json.props && json.props.pageProps && json.props.pageProps.accessToken) {
                        if (chrome.runtime) {
                            let chatGptPort = chrome.runtime.connect({name: "chatGptPort"});
                            chatGptPort.postMessage({type: 'chatGptGotToken', token: json.props.pageProps.accessToken});
                            // chrome.runtime.sendMessage({
                            //     type: "chatGptGotToken",
                            //     token: json.props.pageProps.accessToken
                            // })
                        }
                        clearInterval(this.interval);
                    }
                } catch (e) {

                }
            }
        }, 500);
    }

    async onInitAngular(debug=false) {
        let form_list;
        let form;
        let button;
        let textarea;
        let textarea_clone;
        let textarea_parent;
        let buttons_list;
        let button_click_do_original = false;
        let textarea_clone_list;

        form_list = document.getElementsByTagName('form');
        if (form_list && form_list.length) {
            form = form_list[0];
            const textarea_list = form.getElementsByTagName('textarea');
            if (textarea_list && textarea_list.length) {
                textarea = textarea_list[0];
                if(!textarea) {
                    return;
                }
                textarea_clone = textarea.cloneNode();
                textarea_clone.classList.add('textarea_clone');
                textarea_parent = textarea.parentElement;
            }
            if (!textarea_parent) {
                return;
            }
            buttons_list = textarea_parent.getElementsByTagName('button');
            if (buttons_list && buttons_list.length) {
                button = buttons_list[0]
                button.classList.add('button_clone');
                if(!button) {
                    return;
                }
            }
            button_click_do_original = false;

            if (!textarea) {
                return;
            }

            async function listenForMessagesFromExtension(request, sender, sendResponse) {
                if (request.type) {
                    const res = request.response;
                    if (request.type === 'force-prompt') {
                        forceContinue();
                    }
                    if (request.type === 'copy-prompt') {
                        textarea_clone.value = res.prompt
                    }
                    if (request.type === 'login-required') {

                    }
                    if (request.type === 'privacy-model-response') {
                        if (debug) {
                            console.log('privacy model results in content script', res)
                        }
                        if (res.pass_privacy) {
                            forceContinue();
                        }
                    }
                }
                sendResponse({success: true})
            }

            function callOurPrivacyModelFromAngular(val) {
                chrome.runtime.sendMessage({type: 'privacy-model', prompt: val}, function (response) {
                    // console.log("Response from angular: ", response);
                    if (response) {
                        if (debug) {
                            console.log('extension script got the message', response)
                        }
                    } else {
                        // extension script removed by user click on extention icon
                        forceContinue();
                    }
                });
            }

            async function onKeyDownHandler(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    button.click();
                }
            }
            async function onClickHandler(e) {
                const val = textarea_clone.value;
                textarea.value = val;
                if (button_click_do_original) {
                    button_click_do_original = false; // reset flag
                    return; // let the event bubble away
                }
                e.preventDefault();
                let d = {}
                callOurPrivacyModelFromAngular(val);
                if (debug) {
                    console.log('button clicked', val)
                    console.log('returned', d)
                    console.log('d.pass_privacy', d.pass_privacy)
                }
                // if (d.pass_privacy) {
                //     if (!button_click_do_original) {
                //         button_click_do_original = true;
                //     }
                //     button.click();
                // }
            }
            // function windowOnClick(e) {
            //     console.log('window clicked injected script')
            //     let myOldUrl = window.location.href;
            //     console.log('myOldUrl', myOldUrl)
            //     setTimeout(() => {
            //         let newUrl = window.location.href;
            //         console.log('newUrl', newUrl)
            //         if (myOldUrl !== newUrl) {
            //             checkLoading().then(() => {
            //                 setTimeout(() => {
            //                     onRemoveInitAngular(true)
            //                     onInitAngular(true)
            //                 }, 500)
            //             })
            //         }
            //     }, 1500)
            // }

            function onDivChange(e) {
                // console.log('onDivChange e', e)
                textarea_clone_list = document.getElementsByClassName('textarea_clone');
                if (textarea_clone_list && textarea_clone_list.length) {
                    if (debug) {
                        console.log('no need to inject')
                    }
                } else {
                    if (debug) {
                        console.log('need to inject')
                    }
                    onRemoveInitAngular(true)
                    onInitAngular(true)

                }
            }
            function forceContinue() {
                button_click_do_original = true;
                button.click();
                setTimeout(() => {
                    textarea_clone.value = '';
                })
            }

            this.sendHostNameToContentScript();
            textarea.style.display = 'none'
            textarea_clone.addEventListener('keydown', onKeyDownHandler);
            textarea_parent.append(textarea_clone);

            button.addEventListener('click', onClickHandler);

            // window.addEventListener('click', windowOnClick, true);

            let target = document.querySelector('#__next');
            target.addEventListener("DOMNodeInserted", onDivChange, false);

            chrome.runtime.onMessage.addListener(listenForMessagesFromExtension);

            let lastTextAreaKeydown = window.extentionLastEventListeners['textarea-keydown'];
            let lastButtonClick = window.extentionLastEventListeners['button-click'];
            let lastChromeMessageTwo = window.extentionLastEventListeners['chrome-message-two'];
            let lastOnDivChange = window.extentionLastEventListeners['on-div-change'];
            // let lastWindowClick = window.extentionLastEventListeners['window-click'];
            if (lastTextAreaKeydown) {
                textarea_clone.removeEventListener('keydown', lastTextAreaKeydown);
            }
            if (lastButtonClick) {
                button.removeEventListener('click', lastButtonClick);
            }
            if (lastChromeMessageTwo) {
                chrome.runtime.onMessage.removeListener(lastChromeMessageTwo);
            }
            if (lastOnDivChange) {
                target.removeEventListener("DOMNodeInserted", lastOnDivChange, false);
            }
            // if (lastWindowClick) {
            //     window.removeEventListener('click', lastWindowClick, true);
            // }

            window.extentionLastEventListeners['textarea-keydown'] = onKeyDownHandler;
            window.extentionLastEventListeners['button-click'] = onClickHandler;
            window.extentionLastEventListeners['chrome-message-two'] = listenForMessagesFromExtension;
            window.extentionLastEventListeners['on-div-change'] = onDivChange;
            // window.extentionLastEventListeners['window-click'] = windowOnClick;

            // will be used with when
            // force button clicked
            // user removed extension by clicking icon
            // privacy model pass_privacy is true

            if (debug) {
                console.log('form', form)
                console.log('button', button)
                console.log('textarea', [textarea_clone])
            }
        }
    }

    async onRemoveInitAngular(debug=false) {
        const textarea_clone_list = document.getElementsByClassName('textarea_clone');
        if (textarea_clone_list && textarea_clone_list.length) {
            const textarea_clone_injected = textarea_clone_list[0];
            const textarea_clone_injected_parent = textarea_clone_injected.parentElement;
            const buttons_list = textarea_clone_injected_parent.getElementsByTagName('button');
            if (buttons_list && buttons_list.length) {
                const button = buttons_list[0]
                if(!button) {
                    return;
                }
            }
            let target = document.querySelector('#__next');

            if (debug) {
                console.log('removing injected script')
            }
            let lastTextAreaKeydown = window.extentionLastEventListeners['textarea-keydown'];
            let lastButtonClick = window.extentionLastEventListeners['button-click'];
            let lastChromeMessageTwo = window.extentionLastEventListeners['chrome-message-two'];
            let lastOnDivChange = window.extentionLastEventListeners['on-div-change'];
            // let lastWindowClick = window.extentionLastEventListeners['window-click'];
            if (lastTextAreaKeydown && textarea_clone_injected) {
                textarea_clone_injected.removeEventListener('keydown', lastTextAreaKeydown);
            }
            if (lastButtonClick && button) {
                button.removeEventListener('click', lastButtonClick);
            }
            if (lastChromeMessageTwo) {
                chrome.runtime.onMessage.removeListener(lastChromeMessageTwo);
            }
            if (lastOnDivChange && target) {
                target.removeEventListener("DOMNodeInserted", lastOnDivChange, false);
            }
            button.classList.remove('button_clone');
            textarea_clone_injected_parent.removeChild(textarea_clone_injected);

            const form_list = document.getElementsByTagName('form');
            if (form_list && form_list.length) {
                const form = form_list[0];
                const textarea_list = form.getElementsByTagName('textarea');
                if (textarea_list && textarea_list.length) {
                    const textarea = textarea_list[0];
                    textarea.style.display = ''
                }
            }
        }
    }

    sendHostNameToContentScript() {
        setTimeout(() => {
            chrome.runtime.sendMessage({type: 'init-from-content-script', host: window.location.host}, function(response) {

            })
        }, 500)
    }

    sendClearHostNameToContentScript() {
        setTimeout(() => {
            chrome.runtime.sendMessage({type: 'init-from-content-script', host: ''}, function(response) {

            })
        }, 500)
    }

    testFetchingLocalApiKey() {
        fetch('file:///C:/Users/orib/Downloads/test.txt')
            .then(response => response.text())
            .then(apiKey => {
                console.log('apiKey', apiKey)
                // Use the API key in your API requests
            })
            .catch(error => {
                console.error('apiKey', error);
            });
    }

    checkLoading() {
        return new Promise((resolve, reject) => {
            let interval = setInterval(() => {
                let main = document.getElementsByTagName('main');
                console.log('main', main)
                if (main && main.length) {
                    let loader = main[0].getElementsByClassName('animate-spin');
                    console.log('loader', loader)
                    if (!loader.length) {
                        clearInterval(interval)
                        setTimeout(() => {
                            resolve()
                        }, 1000)
                    }
                }
            }, 300)
        })
    }

}

try {
    const main = new Main();

    let inject = false;
    if (window.location.href.indexOf('https://chat.openai.com/chat') > -1) {
        inject = true;
    }
    if (document.readyState === "complete") {
        // checkLoading().then(() => {
        main.init(inject);
        // })
    } else {
        let loadfunction = window.onload;
        window.onload = function (event) {
            //enter here the action you want to do once loaded
            // checkLoading().then(() => {
            main.init(inject);
            // })
            if (loadfunction) loadfunction(event);
        }
    }
} catch (e) {}
