// Script that opens an iframe to load the ng2 page

function createSidebar () {
    const backgroundColor = '#ccc';
    var iFrame = document.createElement("iframe");
    iFrame.id = 'domain-tabs-sidebar-iframe';
    iFrame.src = chrome.runtime.getURL('index.html');
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

    const background_img_url = chrome.runtime.getURL('/assets/images/login/login-bg-pattern.svg')
    var newLeftArrow = document.createElement("div");
    newLeftArrow.id = 'domain-tabs-sidebar-left-arrow';
    newLeftArrow.style.backgroundImage = 'url(' + background_img_url + ')';

    const logo_img_url = chrome.runtime.getURL('/assets/images/Gaia_blue_short_transparent.png')
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
    addEvents();
    setTimeout(function() {
        // toggleSideBar();
    }, 200);
}

function getPointerPos(e, preventTouch) {
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

function addEvents() {
    var startPos
    var startDrag = false;
    var moveStarted = false;
    var newLeftArrow = document.getElementById('domain-tabs-sidebar-left-arrow');
    newLeftArrow.addEventListener('mousedown', (e) => {
        startDrag = true;
        startPos = this.getPointerPos(e, false);
    })
    window.addEventListener('mousemove', (e) => {
        if (startDrag) {
            moveStarted = true;
            e.preventDefault();
            const pos = getPointerPos(e, false);
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
    newLeftArrow.addEventListener('mouseup', (e) => {
        if (startDrag) {
            e.preventDefault();
            startDrag = false;
            startPos = null;
            setTimeout(() => {
                moveStarted = false;
            })
        }
    })
    newLeftArrow.addEventListener('click', () => {
        if (!moveStarted) {
            toggleSideBar();
        }
    })
    var iframe = document.getElementById('domain-tabs-sidebar-iframe');
    iframe.addEventListener('hover', (e) => {
        e.preventDefault();
    })
}
function removeSidebar () {
    var element = document.getElementById('domain-tabs-sidebar');
    if (element.className.indexOf('domain-tabs-sidebar-closing') !== -1) {
        return;
    }
    element.className += ' domain-tabs-sidebar-closing';
    setTimeout(function() {
        document.body.removeChild(element);
    }, 100);
}
function hideSideBar() {
    var element = document.getElementById('domain-tabs-sidebar');
    if (element) {
        element.classList.remove('domain-tabs-sidebar-show')
    }
}
function showSideBar() {
    var element = document.getElementById('domain-tabs-sidebar');
    if (element) {
        element.classList.add('domain-tabs-sidebar-show')
    }
}
function toggleSideBar() {
    var element = document.getElementById('domain-tabs-sidebar');
    if (element) {
        if (element.classList.contains('domain-tabs-sidebar-show')) {
            hideSideBar();
        } else {
            showSideBar();
        }
    }
}

var sidebar = document.getElementById('domain-tabs-sidebar');
if (sidebar) {
    removeSidebar();
} else {
    createSidebar ();
    chrome.runtime.onMessage.removeListener(listenForMessagesFromExtension);
    chrome.runtime.onMessage.addListener(listenForMessagesFromExtension);
    window.addEventListener('click', function(e) {
        var side_bar = e.target.closest(".domain-tabs-sidebar-show");
        if (!side_bar) {
            hideSideBar();
        }
    })
}

async function listenForMessagesFromExtension(request, sender, sendResponse) {
    console.log('side menu got the message', request.type);
    if (request.type) {
        if (request.type === 'toggle-sidebar') {
            toggleSideBar();
        }
        if (request.type === 'show-sidebar') {
            showSideBar();
        }
        if (request.type === 'hide-sidebar') {
            hideSideBar();
        }
    }
    sendResponse({success: true})
    return true;
}
