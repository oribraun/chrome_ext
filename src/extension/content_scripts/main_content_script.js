var loadfunction = window.onload;
window.onload = function(event){
    const obj = {
        type:'init-from-main-content-script',
        host: window.location.host,
        url: window.location.href
    }
    console.log('obj', obj)
    setTimeout(() => {
        chrome.runtime.sendMessage(obj, function(response) {
            // console.log("Response: ", response);
        });
    }, 200)
    if (loadfunction) loadfunction(event);
}
