function checkHost(val) {
    return new Promise((resolve, reject) => {
        const host = window.location.host
        if (window.location.host === 'chat.openai.com') {
            resolve(host)
        } else {
            reject(false)
        }
    })
}

function callOurPrivacyModel(val) {
    return new Promise((resolve, reject) => {
        // var http = new XMLHttpRequest();
        // var url = 'http://localhost:8000/api/public';
        // var data = {prompt: val};
        // http.open('POST', url, true);
        //
        // //Send the proper header information along with the request
        // http.setRequestHeader('Content-type', "application/json;charset=UTF-8");
        //
        // http.onreadystatechange = function() {
        //     if(http.readyState === 4) {
        //         if (http.status === 200) {
        //             resolve(JSON.parse(http.responseText));
        //         } else {
        //             reject()
        //         }
        //     }
        // }
        // http.send(JSON.stringify(data));
        // chrome.runtime.onMessage.removeListener(listenForMessagesFromExtension);
        // chrome.runtime.onMessage.addListener(listenForMessagesFromExtension);
        async function listenForMessagesFromExtension(request, sender, sendResponse) {
            if (request.type) {
                if (request.type === 'force-prompt') {
                    button_click_do_original = true;
                    button.click();
                }
                if (request.type === 'copy-prompt') {
                    textarea_clone.value = suggested_prompt.innerText
                }
                // if (request.type === 'privacy-model-response') {
                //     const res = request.response;
                //     if (!res.err) {
                //         resolve(res);
                //     } else {
                //         reject(res.errMessage)
                //     }
                //     console.log('response from extension', request.response)
                // }
            }
            sendResponse({success: true})
            return true;
        }
        chrome.runtime.sendMessage({type: 'privacy-model', prompt: val}, function(response) {
            // console.log("Response from angular: ", response);
            if (debug) {
                console.log('extension script got the message')
            }
            chrome.runtime.onMessage.removeListener(listenForMessagesFromExtension);
            chrome.runtime.onMessage.addListener(listenForMessagesFromExtension);
        });
    })
}

async function onInit(debug=false) {
    await createToolTip();
    const suggested_prompt = document.getElementById('suggested_prompt');
    const suggested_prompt_clipboard = document.getElementById('suggested_prompt_clipboard');
    const suggested_prompt_from = document.getElementById('suggested_prompt_from');
    const pass_privacy = document.getElementById('pass_privacy');
    const force_button = document.getElementById('force_button');

    function cleanSuggested() {
        suggested_prompt.innerHTML = '';
        suggested_prompt_from.innerHTML = '';
        pass_privacy.innerHTML = '';
    }
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
            cleanSuggested();
            hideToolTip()
            textarea.value = val;
            if (button_click_do_original) {
                button_click_do_original = false; // reset flag
                return; // let the event bubble away
            }
            e.preventDefault();
            let d = {}
            try {
                d = await callOurPrivacyModel(val);
            } catch (err) {
                console.log('callOurPrivacyModel err', err)
            }
            if (debug) {
                console.log('button clicked', val)
                console.log('returned', d)
                console.log('d.pass_privacy', d.pass_privacy)
            }
            if (d.suggested_prompt && d.suggested_prompt !== val) {
                let message = '';
                if (!d.pass_privacy && d.suggested_prompt) {
                    suggested_prompt.innerText = d.suggested_prompt;
                    suggested_prompt_from.innerHTML = 'from ' + d.suggested_model + ' - ' + JSON.stringify(d.model_res);
                }
                if (d.pass_privacy) {
                    pass_privacy.innerHTML = '<div class="pass_privacy_success">prompt pass privacy policy</div>';
                } else {
                    pass_privacy.innerHTML = '<div class="pass_privacy_failed">prompt did not pass privacy policy</div>';
                }
                showToolTip()
            }
            if (d.pass_privacy) {
                if (!button_click_do_original) {
                    button_click_do_original = true;
                }
                button.click();
            }
        });

        force_button.addEventListener('click',  async (e) => {
            button_click_do_original = true;
            button.click();
        })
        suggested_prompt_clipboard.addEventListener('click',  async (e) => {
            textarea_clone.value = suggested_prompt.innerText
            // button_click_do_original = true;
            // button.click();
        })
        if (debug) {
            console.log('form', form)
            console.log('button', button)
            console.log('textarea', [textarea_clone])
        }
    }
}
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

async function createToolTip() {
    const inject_html = chrome.runtime.getURL('/extension/inject_to_page/chat.openai.com/script.html')
    const res  = await fetch(inject_html)
    const html = await res.text();
    const main = document.body.getElementsByTagName('main');
    if (main && main.length) {
        main[0].insertAdjacentHTML('beforeend', html);
    } else {
        document.body.insertAdjacentHTML('beforeend', html);
    }

    const close = document.getElementById('close');
    close.addEventListener('click', function() {
        hideToolTip();
    })
    return {tooltip: 'tooltip', data: 'data', suggested_prompt: 'suggested_prompt'}

}
function showToolTip(dom) {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
        tooltip.classList.add('tooltip_show');
    }
}

function hideToolTip(dom) {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
        tooltip.classList.remove('tooltip_show');
    }
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
