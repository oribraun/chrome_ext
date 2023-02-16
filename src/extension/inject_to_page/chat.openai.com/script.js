async function onInitAngular(debug=false) {
    const form_list = document.getElementsByTagName('form');
    if (form_list && form_list.length) {
        const form = form_list[0];
        let button;
        let textarea;
        let textarea_clone;
        let textarea_parent;
        const textarea_list = form.getElementsByTagName('textarea');
        const buttons_list = form.getElementsByTagName('button');
        if (textarea_list && textarea_list.length) {
            textarea = textarea_list[0];
            if(!textarea) {
                return;
            }
            textarea_clone = textarea.cloneNode();
            textarea_parent = textarea.parentElement;
        }
        if (buttons_list && buttons_list.length) {
            button = buttons_list[0]
            if(!button) {
                return;
            }
        }
        let button_click_do_original = false;

        if (!textarea) {
            return;
        }
        textarea.style.display = 'none'
        textarea_clone.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                button.click();
            }
        });
        textarea_parent.append(textarea_clone);

        button.addEventListener('click',  async (e) => {
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
        });

        function callOurPrivacyModelFromAngular(val) {
            chrome.runtime.sendMessage({type: 'privacy-model', prompt: val}, function(response) {
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

        chrome.runtime.onMessage.removeListener(listenForMessagesFromExtension);
        chrome.runtime.onMessage.addListener(listenForMessagesFromExtension);
        // will be used with when
        // force button clicked
        // user removed extension by clicking icon
        // privacy model pass_privacy is true
        function forceContinue() {
            button_click_do_original = true;
            button.click();
        }
        if (debug) {
            console.log('form', form)
            console.log('button', button)
            console.log('textarea', [textarea_clone])
        }
    }
}

async function onRemoveInitAngular(debug=false) {
    const textarea_list = form.getElementsByTagName('textarea');
    const textarea_clone_list = form.getElementsByTagName('textarea_clone');
    let textarea;
    let textarea_clone;
    if (textarea_list && textarea_list.length) {
        textarea = textarea_list[0];
    }
    if (textarea_clone_list && textarea_clone_list.length) {
        textarea_clone = textarea_clone_list[0];
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
if (document.readyState === "complete") {
    onInitAngular(true);
    sendHostNameToContentScript();
} else {
    var loadfunction = window.onload;
    window.onload = function (event) {
        //enter here the action you want to do once loaded
        onInitAngular(true);
        sendHostNameToContentScript();
        if (loadfunction) loadfunction(event);
    }
}
