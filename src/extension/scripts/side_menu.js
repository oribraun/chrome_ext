// Script that opens an iframe to load the ng2 page
class sideMenu {
    constructor() {
        if (typeof window.extentionLastEventListeners !== 'object') {
            window.extentionLastEventListeners = {}
        }
    }

    getSideBar() {
        return document.getElementById('domain-tabs-sidebar')
    }

    createSidebar () {
        const backgroundColor = '#ccc';
        var iFrame = document.createElement("iframe");
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

        var newDiv = document.createElement("div");
        newDiv.id = 'domain-tabs-sidebar';
        newDiv.classList.add('domain-tabs-sidebar-small');

        const background_img_url = chrome.runtime.getURL('/assets/images/login/login-bg-pattern.svg')
        var newLeftArrow = document.createElement("div");
        newLeftArrow.id = 'domain-tabs-sidebar-left-arrow';
        newLeftArrow.style.backgroundImage = 'url(' + background_img_url + ')';

        const logo_img_url = chrome.runtime.getURL('/assets/images/Generative_Ai_Logo.png')
        var newLeftArrowBackground = document.createElement("div");
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
        var startPos
        var origStartPos
        var startDrag = false;
        var moveStarted = false;
        var newLeftArrow = document.getElementById('domain-tabs-sidebar-left-arrow');
        newLeftArrow.addEventListener('mousedown', (e) => {
            startDrag = true;
            startPos = this.getPointerPos(e, false);
            origStartPos = startPos;
            var el = document.getElementById('domain-tabs-sidebar-iframe')
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
                var el = document.getElementById('domain-tabs-sidebar-iframe')
                el.classList.remove('disable-pointer-events')
                e.preventDefault();
                startDrag = false;
                startPos = null;
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
        var iframe = document.getElementById('domain-tabs-sidebar-iframe');
        iframe.addEventListener('hover', (e) => {
            e.preventDefault();
        })
    }
    removeSidebar () {
        var element = document.getElementById('domain-tabs-sidebar');
        if (element.className.indexOf('domain-tabs-sidebar-closing') !== -1) {
            return;
        }
        element.className += ' domain-tabs-sidebar-closing';
        setTimeout(function() {
            document.body.removeChild(element);
        }, 100);
    }
    hideSideBar() {
        var element = document.getElementById('domain-tabs-sidebar');
        if (element) {
            element.classList.remove('domain-tabs-sidebar-show')
        }
    }
    showSideBar() {
        var element = document.getElementById('domain-tabs-sidebar');
        if (element) {
            element.classList.add('domain-tabs-sidebar-show')
        }
    }
    expend() {
        var element = document.getElementById('domain-tabs-sidebar');
        if (!element.classList.contains('domain-tabs-sidebar-full')) {
            element.classList.add('domain-tabs-sidebar-full')
        }
    }
    minimize() {
        var element = document.getElementById('domain-tabs-sidebar');
        if (element.classList.contains('domain-tabs-sidebar-full')) {
            element.classList.remove('domain-tabs-sidebar-full')
        }
    }
    toggleSideBar() {
        var element = document.getElementById('domain-tabs-sidebar');
        if (element) {
            if (element.classList.contains('domain-tabs-sidebar-show')) {
                this.hideSideBar();
            } else {
                this.showSideBar();
            }
        }
    }
}

const menu = new sideMenu();

var sidebar = menu.getSideBar();
if (sidebar) {
    var lastWindowClick = window.extentionLastEventListeners['window-click'];
    var lastChromeMessage = window.extentionLastEventListeners['chrome-message'];
    if (lastChromeMessage) {
        chrome.runtime.onMessage.removeListener(lastChromeMessage);
    }
    if (lastWindowClick) {
        window.removeEventListener('click', lastWindowClick, true);
    }
    menu.removeSidebar();
} else {
    menu.createSidebar();
    chrome.runtime.onMessage.addListener(listenForMessagesFromExtension);
    window.addEventListener('click', windowOnClick, true);
    window.extentionLastEventListeners['window-click'] = windowOnClick;
    window.extentionLastEventListeners['chrome-message'] = listenForMessagesFromExtension;
}

async function listenForMessagesFromExtension(request, sender, sendResponse) {
    // console.log('side menu got the message', request.type);
    if (request.type) {
        if (request.type === 'toggle-sidebar') {
            menu.toggleSideBar();
        }
        if (request.type === 'show-sidebar') {
            menu.showSideBar();
        }
        if (request.type === 'hide-sidebar') {
            menu.hideSideBar();
        }
        if (request.type === 'expend') {
            menu.expend();
        }
        if (request.type === 'minimize') {
            menu.minimize();
        }
    }
    if (request.type && request.type === 'get-html') {
        const body_list = document.querySelectorAll('body:not(#domain-tabs-sidebar)');
        let html = '';
        if (body_list.length) {
            html = body_list[0];
            if (request.content === 'html') {
                html = html.innerHTML;
            } else {
                html = html.innerText;
            }
        }
        sendResponse({success: true, html: html})
    } else {
        sendResponse({success: true})
    }
    return true;
}

function windowOnClick(e) {
    // console.log('window clicked', e.target)
    var side_bar = e.target.closest(".domain-tabs-sidebar-show");
    if (!side_bar) {
        menu.hideSideBar();
        if (chrome.runtime) {
            chrome.runtime.sendMessage({
                type: "hide-sidebar-on-window-click"
            })
        }
    }
}
