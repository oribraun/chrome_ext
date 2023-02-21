async function onInitAngular(debug=false) {
    const form_list = document.getElementsByTagName('form');
    if (form_list && form_list.length) {
        const form = form_list[0];
        let button;
        let textarea;
        let textarea_clone;
        let textarea_parent;
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
        const buttons_list = textarea_parent.getElementsByTagName('button');
        if (buttons_list && buttons_list.length) {
            button = buttons_list[0]
            button.classList.add('button_clone');
            if(!button) {
                return;
            }
        }
        let button_click_do_original = false;

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

        function forceContinue() {
            button_click_do_original = true;
            button.click();
        }


        var textarea_clone_list = document.getElementsByClassName('textarea_clone');
        if (textarea_clone_list && textarea_clone_list.length) {
            textarea_clone_injected = textarea_clone_list[0];
            textarea_clone_injected_parent = textarea_clone_injected.parentElement;
            console.log('removing injected script')
            var lastTextAreaKeydown = window.extentionLastEventListeners['textarea-keydown'];
            var lastButtonClick = window.extentionLastEventListeners['button-click'];
            var lastChromeMessageTwo = window.extentionLastEventListeners['chrome-message-two'];
            if (lastTextAreaKeydown) {
                textarea_clone.removeEventListener('keydown', lastTextAreaKeydown);
            }
            if (lastButtonClick) {
                button.removeEventListener('click', lastButtonClick);
            }
            button.classList.remove('button_clone');
            textarea.style.display = ''
            textarea_clone_injected_parent.removeChild(textarea_clone_injected);
            if (lastChromeMessageTwo) {
                chrome.runtime.onMessage.removeListener(lastChromeMessageTwo);
            }
        } else {
            sendHostNameToContentScript();
            textarea.style.display = 'none'
            textarea_clone.addEventListener('keydown', onKeyDownHandler);
            textarea_parent.append(textarea_clone);

            button.addEventListener('click', onClickHandler);

            chrome.runtime.onMessage.addListener(listenForMessagesFromExtension);

            window.extentionLastEventListeners['textarea-keydown'] = onKeyDownHandler;
            window.extentionLastEventListeners['button-click'] = onClickHandler;
            window.extentionLastEventListeners['chrome-message-two'] = listenForMessagesFromExtension;

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
}

async function onRemoveInitAngular(debug=false) {
    var textarea
    var button
    var textarea_list = document.getElementsByClassName('textarea_clone');
    var button_list = form.getElementsByTagName('button');
    if (textarea_clone && textarea_clone.length) {
        textarea = textarea_list[0]
    }
    if (button_list && button_list.length) {
        button = button_list[0]
    }
    if (textarea) {
        textarea_parent = textarea.parentElement;
        textarea_parent.removeChild(textarea)
    }

    textarea.style.display = 'none'
    textarea_clone.parentNode.removeChild(textarea_clone);
}

function sendHostNameToContentScript() {
    setTimeout(() => {
        chrome.runtime.sendMessage({type: 'init-from-content-script', host: window.location.host}, function(response) {

        })
    }, 500)
}

function sendClearHostNameToContentScript() {
    setTimeout(() => {
        chrome.runtime.sendMessage({type: 'init-from-content-script', host: ''}, function(response) {

        })
    }, 500)
}

function testFetchingLocalApiKey() {
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

if (typeof window.extentionLastEventListeners !== 'object') {
    window.extentionLastEventListeners = {}
}
var inject = false;
if (window.location.href.indexOf('https://chat.openai.com/chat') > -1) {
    inject = true;
}
if (document.readyState === "complete") {
    if (inject) {
        onInitAngular(true);
    }
} else {
    var loadfunction = window.onload;
    window.onload = function (event) {
        //enter here the action you want to do once loaded
        if (inject) {
            onInitAngular(true);
        }
        if (loadfunction) loadfunction(event);
    }
}
