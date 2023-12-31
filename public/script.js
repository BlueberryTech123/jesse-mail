let errorWindow = `
<div class="window" id="error-window">
    <div class="window-header">
        Error
    </div>
    <div class="window-content" style="width: 500px;">
        <div style="display: inline-block; width: 100px;">
            <img src="error.png" style="width: 64px; height: 64px;">
        </div>
        <div style="display: inline-block; vertical-align: top;">
            <span id="error">Error testingggg</span>
        </div>
        <br><br>
        <center>
            <button onclick="closeError();">OK</button>
            <button disabled>Cancel</button>
        </center>
    </div>
</div>`

const parser = new DOMParser();

const clickSound = new Audio("audio/click.wav");
const keySound = new Audio("audio/key.wav");
const errorSound = new Audio("audio/error.mp3");

let activeChatId = -1;

addEventListener("error", (event, source, line, col, error) => {
    displayError(`${event.message}\nLine: ${line}\nSource: ${source}`);
});

addEventListener("click", (event) => {
    clickSound.currentTime = 0;
    clickSound.play();
});
addEventListener("keypress", (event) => {
    keySound.currentTime = 0;
    keySound.play();
})

const colors = ["#1f46a8", "#ff5733", "#fcba03", "#299126", "#c94bb6", "#848c18"]

function colorFromString(str) {
    let index = str.charCodeAt(0) + str.charCodeAt(3);
    index = index % colors.length;

    return colors[index];
}
function setCookie(name, value) {
    document.cookie = name + "=" + value + ";";
}
function getCookie(name) {
    let namePrefix = name + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(namePrefix) == 0) {
            return c.substring(namePrefix.length, c.length);
        }
    }
    return "";
}
function clearCookies(name) {
    document.cookie = null;
}

function storeUser(username, password) {
    clearCookies();
    setCookie("username", username);
    setCookie("password", password);
}

function bottomOfChat() {
    const chat = document.getElementById("chat-content");
    chat.scrollTop = chat.scrollHeight;
}

function displayError(error) {
    let window = document.querySelector("#error-window");
    if (window) {
        window.classList.remove("hidden");
    }
    else {
        document.body.innerHTML += errorWindow;
        window = document.querySelector("#error-window");
    }
    errorSound.play();
    document.getElementById("error").innerText = error;

}
function closeError() {
    let window = document.querySelector("#error-window");
    window.classList.add("hidden");
}

function displayWindow(id) {
    document.querySelector(`#${id}`).classList.remove("hidden");
}
function closeWindow(id) {
    document.querySelector(`#${id}`).classList.add("hidden");
}


function validate() {
    closeWindow("loading");

    if (getCookie("username") == "" || getCookie("password") == "") {
        closeWindow("chat");
        displayWindow("login");
    }
    else {
        displayWindow("chat");
        closeWindow("login");

        renderSidebar();
        renderChat();
    }
}
function updateUserCookies(username, password) {
    clearCookies();
    setCookie("username", username);
    setCookie("password", password);
}

function signOn() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    displayWindow("loading");

    $.post("/signon", { username: username, password: password }, (data, status) => {
        if (data.success) {
            updateUserCookies(username, password);
            validate();
        }
        else {
            displayError(data.message);
            closeWindow("loading");
        }
    });
    return false;
}
function logOut() {
    document.cookie = "username=;expires=Thu, 01 Jan 1970 00:00:01 GMT";
    document.cookie = "password=;expires=Thu, 01 Jan 1970 00:00:01 GMT";
    activeChatId = -1;
    document.getElementById("sidebar").innerHTML = "Loading...";
    validate();
}
function createAccount() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    displayWindow("loading");

    $.post("/createaccount", { username: username, password: password }, (data, status) => {
        if (data.success) {
            updateUserCookies(username, password);
            validate();
        }
        else {
            displayError(data.message);
            closeWindow("loading");
        }
    });
    return false;
}

function createChat() {
    const username = getCookie("username");
    const password = getCookie("password");
    const name = document.getElementById("add-input").value;

    document.getElementById("sidebar").innerHTML += "<button class=\"sidebar-button\" style=\"color: #ddd; font-weight: normal; background-color: #999;\">Creating...</button><br>"

    $.post("/createchat", { username: username, password: password, name: name }, (data, status) => {
        if (data.success) {
            closeWindow("loading");
            renderSidebar();
        }
        else {
            displayError(data.message);
            closeWindow("loading");
            renderSidebar();
        }
    });
}


function renderSidebar() {
    $.post("/getchats", { username: getCookie("username"), password: getCookie("password") }, (data, status) => {
        if (data.success) {
            const chats = data.message;
            let newContent = "";
            for (let i = 0; i < chats.length; i++) {
                const name = chats[i].name;
                newContent += `<button class="sidebar-button" style="color: ${colorFromString(name)};" onclick="activeChatId = ${chats[i].id}; renderChat(); console.log(activeChatId);">${name}</button><br>`;
            }
            if (chats.length == 0) {
                newContent = "You aren't in any chats. Press \"Add\" to join or create one!";
            }
            
            document.getElementById("sidebar").innerHTML = newContent;
        }
        else {
            displayError(data.message);
        }
    });
}

function appendMessage(data, chat, back = false) {
    const date = new Date(data.created_at);
    const displayedDate = `${date.getMonth()}/${date.getDay()}/${date.getYear()} - ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    const filteredContent = data.content.replaceAll('<', '&lt;');
    
    const msg = `<div class="message"><span>${displayedDate}</span>&nbsp;&nbsp;<span class="message-username" style="background: ${colorFromString(data.username)};">${data.username}</span>&nbsp;&nbsp;&nbsp;<span>${filteredContent}</span><hr></div>`;
    if (back) {
        chat.innerHTML = `${msg}${chat.innerHTML}`;
    }
    else {
        chat.innerHTML = `${chat.innerHTML}${msg}`;
    }
}
function sendMessage() {
    const content = document.getElementById("message").value;
    document.getElementById("message").value = null;

    document.getElementById("chat-content").innerHTML += "Sending...<br>";
    bottomOfChat();

    $.post("/sendmessage", { username: getCookie("username"), password: getCookie("password"), id: activeChatId, content: content }, (data, status) => {
        if (data.success) {
            // temporary, pelase remove ;-;
            renderChat(true);
        }
        else {
            displayError(data.message);
        }
    });
}
function renderChat(seamless = false) {
    let chat = document.querySelector("#chat-content");

    if (activeChatId == -1) {
        document.getElementById("chat-content").innerHTML = "<center>Click or add a chat on the sidebar...</center>";
        document.getElementById("message").disabled = true;
        return;
    }

    if (!seamless) {
        displayWindow("loading");
        chat.innerHTML = "<center>Loading messages...</center>";
    }
    document.getElementById("message").disabled = false;
    $.post("/getmessages", { username: getCookie("username"), password: getCookie("password"), id: activeChatId }, (data, status) => {
        chat.innerHTML = "";
        if (data.success) {
            closeWindow("loading");
            
            let messages = data.message;
            console.log(messages);
            if (!messages) {
                return;
            }
            
            for (let i = messages.length - 1; i >= 0; i--) {
                appendMessage(messages[i], chat, true);
                console.log(messages[i]);
            }

            bottomOfChat();
        }
        else {
            displayError(data.message);
            closeWindow("loading");
        }
    });
}