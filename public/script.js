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

const clickSound = new Audio("audio/click.wav");
const keySound = new Audio("audio/key.wav");
const errorSound = new Audio("audio/error.mp3");

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

function setCookie(name, value) {
    document.cookie = name + "=" + value + ";";
}
function getCookie(name) {
    let namePrefix = name + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i < ca.length; i++) {
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

    $.post("/signon", {username: username, password: password}, (data, status) => {
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
    validate();
}
function createAccount() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    displayWindow("loading");

    $.post("/createaccount", {username: username, password: password}, (data, status) => {
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

    displayError(name);

    displayWindow("loading");
    alert("balls");

    $.post("/createchat", {username: username, password: password, name: name}), (data, status) => {
        alert("hi");
        if (data.success) {
            closeWindow("loading");
        }
        else {
            displayError(data.message);
            closeWindow("loading");
        }
    }
}