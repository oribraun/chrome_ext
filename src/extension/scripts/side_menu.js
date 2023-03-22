// Script that opens an iframe to load the ng2 page
class SideMenu {

    storageIconPosKey = 'icon-pos-top';
    constructor() {
        if (typeof window.extentionLastEventListeners !== 'object') {
            window.extentionLastEventListeners = {}
        }
        this.init()
    }

    async init() {
        this.getIconPosition()
    }

    getSideBar() {
        return document.getElementById('domain-tabs-sidebar')
    }

    createSidebar () {
        const backgroundColor = '#ccc';
        let iFrame = document.createElement("iframe");
        iFrame.id = 'domain-tabs-sidebar-iframe';
        iFrame.src = chrome.runtime.getURL('index.html');
        // iFrame.setAttribute('sandbox',"allow-scripts");
        // iFrame.style.backgroundColor = backgroundColor;
        // iFrame.scrolling = 'no';
        // iFrame.onmouseover = function() {
        //     document.body.style.overflow='hidden';
        // };
        // iFrame.onmouseout = function() {
        //     document.body.style.overflow='auto';
        // };

        let newDiv = document.createElement("div");
        newDiv.id = 'domain-tabs-sidebar';
        newDiv.classList.add('domain-tabs-sidebar-small');

        const background_img_url = chrome.runtime.getURL('/assets/images/login/login-bg-pattern.svg')
        let newLeftArrow = document.createElement("div");
        newLeftArrow.id = 'domain-tabs-sidebar-left-arrow';
        newLeftArrow.style.backgroundImage = 'url(' + background_img_url + ')';

        const logo_img_url = chrome.runtime.getURL('/assets/images/Generative_Ai_Icon.png')
        let newLeftArrowBackground = document.createElement("div");
        newLeftArrowBackground.id = 'domain-tabs-sidebar-left-arrow-background';
        newLeftArrowBackground.style.backgroundImage = 'url(' + logo_img_url + ')';
        // newLeftArrow.style.borderTopColor = '20px solid ' + backgroundColor;
        // newLeftArrow.style.borderRightColor = backgroundColor;

        newLeftArrow.appendChild(newLeftArrowBackground)
        newDiv.appendChild(newLeftArrow)
        // setTimeout(function() {
        newDiv.appendChild(iFrame);
        // }, 200);

        document.body.appendChild(newDiv);
        this.addEvents();
        setTimeout(function() {
            // toggleSideBar();
        }, 200);
    }

    getPointerPos(e, preventTouch) {
        let x = 0;
        let y = 0;
        if (e.clientX !== undefined && e.clientY !== undefined) {
            x = e.clientX;
            y = e.clientY;
        } else if (e.taretTouches) {
            if (preventTouch) {
                e.preventDefault();
            }
            x = e.taretTouches[0].clientX;
            y = e.taretTouches[0].clientY;
        } else if (e.touches) {
            if (preventTouch) {
                e.preventDefault();
            }
            x = e.touches[0].clientX;
            y = e.touches[0].clientY;
        }
        return {
            x: x,
            y: y
        };
    }

    addEvents() {
        let startPos
        let origStartPos
        let startDrag = false;
        let moveStarted = false;
        let newLeftArrow = document.getElementById('domain-tabs-sidebar-left-arrow');
        newLeftArrow.addEventListener('mousedown', (e) => {
            startDrag = true;
            startPos = this.getPointerPos(e, false);
            origStartPos = startPos;
            let el = document.getElementById('domain-tabs-sidebar-iframe')
            el.classList.add('disable-pointer-events')
        })
        window.addEventListener('mousemove', (e) => {
            if (startDrag) {
                e.preventDefault();
                const pos = this.getPointerPos(e, false);
                if (!moveStarted && Math.abs(origStartPos.y - pos.y) > 3) {
                    moveStarted = true;
                }
                const moveY = pos.y - startPos.y;
                const moveYPercent = moveY / window.innerHeight * 100;
                const elementTopPercent = newLeftArrow.offsetTop / window.innerHeight * 100;
                const elementHeightPercent = newLeftArrow.clientHeight / window.innerHeight * 100;
                let newTopPercent = elementTopPercent + moveYPercent;
                if (newTopPercent < 0) {
                    newTopPercent = 0;
                }
                if (newTopPercent + elementHeightPercent > 100) {
                    newTopPercent = 100 - elementHeightPercent;
                }
                newLeftArrow.style.top = newTopPercent + '%';
                startPos = pos;
            }
        })
        window.addEventListener('mouseup', (e) => {
            if (startDrag) {
                let el = document.getElementById('domain-tabs-sidebar-iframe')
                el.classList.remove('disable-pointer-events')
                e.preventDefault();
                startDrag = false;
                startPos = null;
                this.setIconPosition();
                setTimeout(() => {
                    moveStarted = false;
                })
            }
        }, true)
        newLeftArrow.addEventListener('click', () => {
            if (!moveStarted) {
                this.toggleSideBar();
            }
        })
        let iframe = document.getElementById('domain-tabs-sidebar-iframe');
        iframe.addEventListener('hover', (e) => {
            e.preventDefault();
        })
    }
    removeSidebar () {
        let element = document.getElementById('domain-tabs-sidebar');
        if (element.className.indexOf('domain-tabs-sidebar-closing') !== -1) {
            return;
        }
        element.className += ' domain-tabs-sidebar-closing';
        setTimeout(function() {
            document.body.removeChild(element);
        }, 100);
    }
    hideSideBar() {
        let element = document.getElementById('domain-tabs-sidebar');
        if (element) {
            element.classList.remove('domain-tabs-sidebar-show')
        }
    }
    showSideBar() {
        let element = document.getElementById('domain-tabs-sidebar');
        if (element) {
            element.classList.add('domain-tabs-sidebar-show')
        }
    }
    expend() {
        let element = document.getElementById('domain-tabs-sidebar');
        if (!element.classList.contains('domain-tabs-sidebar-full')) {
            element.classList.add('domain-tabs-sidebar-full')
        }
    }
    minimize() {
        let element = document.getElementById('domain-tabs-sidebar');
        if (element.classList.contains('domain-tabs-sidebar-full')) {
            element.classList.remove('domain-tabs-sidebar-full')
        }
    }
    toggleSideBar() {
        let element = document.getElementById('domain-tabs-sidebar');
        if (element) {
            if (element.classList.contains('domain-tabs-sidebar-show')) {
                this.hideSideBar();
            } else {
                this.showSideBar();
            }
        }
    }

    setIconPosition() {
        let newLeftArrow = document.getElementById('domain-tabs-sidebar-left-arrow');
        const objToSet = {}
        objToSet[this.storageIconPosKey] = newLeftArrow.style.top;
        chrome.storage.sync.set(objToSet);
    }

    resetIconPosition() {
        chrome.storage.sync.remove(this.storageIconPosKey);
        let newLeftArrow = document.getElementById('domain-tabs-sidebar-left-arrow');
        newLeftArrow.style.top = '';
    }

    async getIconPosition() {
        const obj =  await chrome.storage.sync.get(this.storageIconPosKey);
        if (obj && obj[this.storageIconPosKey]) {
            let newLeftArrow = document.getElementById('domain-tabs-sidebar-left-arrow');
            newLeftArrow.style.top = obj[this.storageIconPosKey];
        }
    }

    sendInitDetails() {
        const obj = {
            type:'init-from-main-content-script',
            host: window.location.host,
            url: window.location.href
        }
        // console.log('sendInitDetails obj', obj)
        setTimeout(() => {
            chrome.runtime.sendMessage(obj, function(response) {
                // console.log("Response: ", response);
            });
        }, 200)
    }
}

try {
    const sideMenu = new SideMenu();

    let sidebar = sideMenu.getSideBar();
    if (sidebar) {
        let lastWindowClick = window.extentionLastEventListeners['window-click'];
        let lastChromeMessage = window.extentionLastEventListeners['chrome-message'];
        if (lastChromeMessage) {
            chrome.runtime.onMessage.removeListener(lastChromeMessage);
        }
        if (lastWindowClick) {
            window.removeEventListener('click', lastWindowClick, true);
        }
        sideMenu.removeSidebar();
    } else {
        sideMenu.createSidebar();
        chrome.runtime.onMessage.addListener(listenForMessagesFromExtension);
        window.addEventListener('click', windowOnClick, true);
        window.extentionLastEventListeners['window-click'] = windowOnClick;
        window.extentionLastEventListeners['chrome-message'] = listenForMessagesFromExtension;
        sideMenu.sendInitDetails();
    }

    async function listenForMessagesFromExtension(request, sender, sendResponse) {
        // console.log('side menu got the message', request.type);
        if (request.type) {
            if (request.type === 'toggle-sidebar') {
                sideMenu.toggleSideBar();
            }
            if (request.type === 'show-sidebar') {
                sideMenu.showSideBar();
            }
            if (request.type === 'hide-sidebar') {
                sideMenu.hideSideBar();
            }
            if (request.type === 'expend') {
                sideMenu.expend();
            }
            if (request.type === 'minimize') {
                sideMenu.minimize();
            }
        }
        if (request.type && request.type === 'get-html') {

            const body = document.body.cloneNode(true)
            body.innerHTML = body.innerHTML
                .replaceAll(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
                .replaceAll(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, "")
                .replaceAll(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
                .replaceAll(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, "")
                .replaceAll(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
                .replaceAll(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, "")
                .replaceAll(/<a\b[^<]*(?:(?!<\/a>)<[^<]*)*<\/a>/gi, "")
                .replaceAll(/<link\b[^<]*(?:(?!>))/gi, "")
                .replaceAll(/<img\b[^<]*(?:(?!>))/gi, "")
                .replaceAll(/<meta\b[^<]*(?:(?!>))/gi, "")
                .replaceAll(/\t/g, '')
                .replace(/\n +/g, '\n')
                .replace(/\n+/g, '\n')
                .replace(/ +/g, ' ');

            let final_text = '';
            if (request.content === 'html') {
                final_text += body.innerHTML;
            } else {
                let text = body.innerText.replaceAll(/<\/?[^>]+(>|$)/gi, "")
                    .replace(/\n +/g, '\n')
                    .replace(/\n+/g, '\n')
                    .replace(/ +/g, ' ');
                final_text += text;
            }
            // console.log('final_text', final_text)
            sendResponse({success: true, html: final_text})
            // const body_list = document.querySelectorAll('body:not(#domain-tabs-sidebar)');
            // const ignoreNodes = ['SCRIPT', 'NOSCRIPT', 'IFRAME', '#comment', '#text', 'IMG', 'LINK', 'META', 'FOOTER', 'STYLE']
            // const excludeIds = ['domain-tabs-sidebar']
            // let html = '';
            // let final_text = '';
            // if (body_list.length) {
            //     html = body_list[0];
            //     const nodes = html.childNodes;
            //     const final_nodes = [];
            //     for (let n of nodes) {
            //         if (excludeIds.indexOf(n.id) === -1 && ignoreNodes.indexOf(n.nodeName) === -1) {
            //             const clone = n.cloneNode(true);
            //             clone.innerHTML = clone.innerHTML
            //                 .replaceAll(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            //                 .replaceAll(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
            //                 .replaceAll(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, "")
            //                 .replaceAll(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
            //                 .replaceAll(/<a\b[^<]*(?:(?!<\/a>)<[^<]*)*<\/a>/gi, "")
            //                 .replaceAll(/<link\b[^<]*(?:(?!>))/gi, "")
            //                 .replaceAll(/<img\b[^<]*(?:(?!>))/gi, "")
            //                 .replaceAll(/<meta\b[^<]*(?:(?!>))/gi, "")
            //                 .replaceAll(/\t/g, '')
            //                 .replace(/\n +/g, '\n')
            //                 .replace(/\n+/g, '\n')
            //                 .replace(/ +/g, ' ');
            //
            //             final_nodes.push(clone)
            //             // console.log('final_nodes', final_nodes)
            //             if (request.content === 'html') {
            //                 final_text += clone.innerHTML;
            //             } else {
            //                 let text = clone.innerText.replaceAll(/<\/?[^>]+(>|$)/gi, "")
            //                     .replace(/\n +/g, '\n')
            //                     .replace(/\n+/g, '\n')
            //                     .replace(/ +/g, ' ');
            //                 final_text += text;
            //             }
            //             // console.log('n.nodeName', n.nodeName)
            //         }
            //     }
            // }
            // console.log('final_text', final_text)
            // sendResponse({success: true, html: final_text})

            // const body_list = document.querySelectorAll('body:not(#domain-tabs-sidebar)');
            // let html = '';
            // if (body_list.length) {
            //     html = body_list[0];
            //     if (request.content === 'html') {
            //         html = html.innerHTML;
            //     } else {
            //         html = html.innerText;
            //     }
            // }
            // sendResponse({success: true, html: html})
        } else if (request.type && request.type === 'copy-text') {
            if (navigator && navigator.clipboard) {
                const res = request.response;
                navigator.clipboard.writeText(res.text);
                sendResponse({success: true})
            } else {
                sendResponse({success: false})
            }
        } else {
            sendResponse({success: true})
        }
        return true;
    }

    function windowOnClick(e) {
        // console.log('window clicked', e.target)
        let side_bar = e.target.closest(".domain-tabs-sidebar-show");
        if (!side_bar) {
            sideMenu.hideSideBar();
            if (chrome.runtime) {
                chrome.runtime.sendMessage({
                    type: "hide-settings-on-window-click"
                })
            }
        }
    }

} catch (e) {}
