var loadfunction = window.onload;
window.onload = function(event){
    console.log('window.location.host', window.location.host)
    chrome.runtime.sendMessage({type:'init-from-main-content-script', host: window.location.host}, function(response) {
        console.log("Response: ", response);
    });
    if (loadfunction) loadfunction(event);
}
