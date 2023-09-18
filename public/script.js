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

addEventListener("error", (event, source, line, col, error) => {
    displayError(`${event.message}\nLine: ${line}\nSource: ${source}`);
});

function displayError(error) {
    let window = document.querySelector("#error-window");
    if (window) {
        window.classList.remove("hidden");
    }
    else {
        document.body.innerHTML += errorWindow;
        window = document.querySelector("#error-window");
    }
    document.getElementById("error").innerText = error;
    
}
function closeError() {
    let window = document.querySelector("#error-window");
    window.classList.add("hidden");
}

function signOn() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    $.post("/signon", {username: username, password: password}, (data, status) => {
        if (data.success) {
            window.location.href = "balls";
        }
        else {
            displayError(data.message);
        }
    });
    return false;
}