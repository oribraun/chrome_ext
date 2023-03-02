try {
    importScripts(
        "background.js",
        "local_chat_gpt.js"
    );
} catch (e) {
    console.log(e);
}
