window.closeDialogAfterRefresh = false;
window.boopTarget = null;
window.lastBoop = null;
window.notificationsEnabled = true;

setInterval(() => {
    if (document.getElementById("notification") && document.getElementById("notification").classList.contains("shown") && new Date().getTime() - window.lastBoop > 2000) {
        document.getElementById("notification").classList.remove("shown");
    }
});

function page(name) {
    Array.from(document.getElementsByClassName("navigation-item")).map(i => i.classList.remove("active"));
    document.getElementById("navigation-item-" + name).classList.add("active");

    Array.from(document.getElementsByClassName("page")).map(i => i.classList.remove("active"));
    document.getElementById("page-" + name).classList.add("active");
}

window.addEventListener("load", () => {
    Array.from(document.getElementsByClassName("dialog-add-content-input-text")).forEach((el, index) => {
        el.addEventListener("keyup", (event) => {
            dialogAddInput(index, event);
        })

        el.addEventListener("keydown", (event) => {
            dialogAddDelete(index, event);
        })
    });
});

function loadUI() {
    document.getElementById("offline").classList.remove("shown");
    document.getElementById("home-friend-code").innerText = code.substring(0, 10) + "****";
    document.getElementById("settings-friend-code").innerText = code;
    document.getElementById("settings-name").placeholder = code;

    if (data.requests.filter(i => i).length > 0) {
        document.getElementById("friends-requests-nothing").classList.remove("shown");
        document.getElementById("home-requests-nothing").classList.remove("shown");
        document.getElementById("friends-requests-list").classList.add("shown");
        document.getElementById("home-requests-list").classList.add("shown");

        document.getElementById("home-requests-list").innerHTML = document.getElementById("friends-requests-list").innerHTML = data.requests.filter(i => i).map((request) => `
        <div class="card-body-list-item">
            <div class="card-body-list-item-title">${request}</div>
            <div class="card-body-list-item-actions">
                <a onclick="acceptRequest('${request}');" class="positive">Accept</a>&nbsp;&nbsp;
                <a onclick="rejectRequest('${request}');" class="negative">Reject</a>
            </div>
        </div>
        `).join("");
    } else {
        document.getElementById("friends-requests-nothing").classList.add("shown");
        document.getElementById("home-requests-nothing").classList.add("shown");
        document.getElementById("friends-requests-list").classList.remove("shown");
        document.getElementById("home-requests-list").classList.remove("shown");
    }

    if (data.friends.filter(i => i).length > 0) {
        document.getElementById("friends-friends-nothing").classList.remove("shown");
        document.getElementById("friends-friends-list").classList.add("shown");
        document.getElementById("vibrate-targets-nothing").classList.remove("shown");
        document.getElementById("vibrate-targets-list").classList.add("shown");

        document.getElementById("friends-friends-list").innerHTML = data.friends.filter(i => i).map((friend) => `
        <div class="card-body-list-item">
            <div class="card-body-list-item-title">${getDisplayName(friend)} · ${data.online.includes(friend) ? `<span class="positive">Online</span>` : `<span class="muted">Offline</span>`}</div>
            <div class="card-body-list-item-actions">
                <a onclick="removeFriend('${friend}');" class="negative">Remove</a>
            </div>
        </div>
        `).join("");

        document.getElementById("vibrate-targets-list").innerHTML = `
        <div class="card-body-list-item">
            <div class="card-body-list-item-title"><a onclick="selectTarget(null);" class="neutral ${window.boopTarget === null ? 'target-selected' : ''}">Send to all friends</a></div>
        </div>
        ` + data.friends.filter(i => i).map((friend) => `
        <div class="card-body-list-item">
            <div class="card-body-list-item-title"><a onclick="selectTarget('${friend}');" class="neutral ${window.boopTarget === friend ? 'target-selected' : ''}">${getDisplayName(friend)} · ${data.online.includes(friend) ? `<span class="positive">Online</span>` : `<span class="muted">Offline</span>`}</a></div>
        </div>
        `).join("");
    } else {
        document.getElementById("friends-friends-nothing").classList.add("shown");
        document.getElementById("friends-friends-list").classList.remove("shown");
        document.getElementById("vibrate-targets-nothing").classList.add("shown");
        document.getElementById("vibrate-targets-list").classList.remove("shown");
    }

    if (data.online.filter(i => i).length > 0) {
        document.getElementById("home-online-nothing").classList.remove("shown");
        document.getElementById("home-online-list").classList.add("shown");

        document.getElementById("home-online-list").innerHTML = data.online.filter(i => i).map((friend) => `
        <div class="card-body-list-item">
            <div class="card-body-list-item-title">${getDisplayName(friend)}</div>
            <div class="card-body-list-item-actions"></div>
        </div>
        `).join("");
    } else {
        document.getElementById("home-online-nothing").classList.add("shown");
        document.getElementById("home-online-list").classList.remove("shown");
    }
}

function dialogAddInput(input, event) {
    console.log(event);

    document.getElementById("dialog-add-content-input-" + input).value = document.getElementById("dialog-add-content-input-" + input).value.replace(/\D/gm, "").substring(0, 1);

    if (document.getElementById("dialog-add-content-input-" + input).value.length === 1) {
        if (document.getElementById("dialog-add-content-input-" + (input + 1))) {
            document.getElementById("dialog-add-content-input-" + (input + 1)).focus();
        }
    }

    if (document.getElementById("dialog-add-content-input-0").value.length === 1
     && document.getElementById("dialog-add-content-input-1").value.length === 1
     && document.getElementById("dialog-add-content-input-2").value.length === 1
     && document.getElementById("dialog-add-content-input-3").value.length === 1
     && document.getElementById("dialog-add-content-input-4").value.length === 1
     && document.getElementById("dialog-add-content-input-5").value.length === 1
     && document.getElementById("dialog-add-content-input-6").value.length === 1
     && document.getElementById("dialog-add-content-input-7").value.length === 1
     && document.getElementById("dialog-add-content-input-8").value.length === 1
     && document.getElementById("dialog-add-content-input-9").value.length === 1
     && document.getElementById("dialog-add-content-input-10").value.length === 1
     && document.getElementById("dialog-add-content-input-11").value.length === 1) {
        document.getElementById("dialog-add-content-submit").classList.remove("disabled");
    } else {
        document.getElementById("dialog-add-content-submit").classList.add("disabled");
    }
}

function dialogAddDelete(input, event) {
    console.log(event);

    if (document.getElementById("dialog-add-content-input-" + input).value.length === 0 && event.code === "Backspace") {
        if (document.getElementById("dialog-add-content-input-" + (input - 1))) {
            document.getElementById("dialog-add-content-input-" + (input - 1)).focus();
        }
    }
}

function closeDialog() {
    Array.from(document.getElementsByTagName("input")).forEach((el) => {
        el.value = "";
    });
    document.getElementById("dialog-add-content-input").classList.remove("disabled");
    document.getElementById("dialog-add-content-submit").classList.add("disabled");

    document.getElementById("dialog-outer").style.display = "none";
}

function openDialog(mode) {
    document.getElementById("dialog-outer").style.display = "";

    if (mode === "add") {
        document.getElementById("dialog-add-content-input-0").focus();
    }
}

function sendRequest() {
    document.getElementById("dialog-add-content-input").classList.add("disabled");
    document.getElementById("dialog-add-content-submit").classList.add("disabled");

    window.closeDialogAfterRefresh = true;

    send({
        type: "sendRequest",
        code: document.getElementById("dialog-add-content-input-0").value + document.getElementById("dialog-add-content-input-1").value + document.getElementById("dialog-add-content-input-2").value + document.getElementById("dialog-add-content-input-3").value + "-" + document.getElementById("dialog-add-content-input-4").value + document.getElementById("dialog-add-content-input-5").value + document.getElementById("dialog-add-content-input-6").value + document.getElementById("dialog-add-content-input-7").value + "-" + document.getElementById("dialog-add-content-input-8").value + document.getElementById("dialog-add-content-input-9").value + document.getElementById("dialog-add-content-input-10").value + document.getElementById("dialog-add-content-input-11").value
    })

    document.body.blur();
}

function acceptRequest(id) {
    delete window.data.requests[window.data.requests.indexOf(id)];
    loadUI();

    send({
        type: "acceptRequest",
        code: id
    })
}

function rejectRequest(id) {
    delete window.data.requests[window.data.requests.indexOf(id)];
    loadUI();

    send({
        type: "rejectRequest",
        code: id
    })
}

function removeFriend(id) {
    delete window.data.friends[window.data.friends.indexOf(id)];
    loadUI();

    send({
        type: "removeFriend",
        code: id
    })
}

function getDisplayName(id) {
    if (window.data.displayNames[id]) {
        return window.data.displayNames[id];
    } else {
        return "&lt;unnamed&gt;";
    }
}

function selectTarget(select) {
    window.boopTarget = select;
    loadUI();
}

function sendBoop() {
    send({
        type: "boop",
        target: window.boopTarget
    })
}

function submitDisplayName() {
    saveSettings();
}

function saveSettings() {
    let settings = {}

    if (document.getElementById("settings-name").value.trim() !== "") {
        settings['displayName'] = document.getElementById("settings-name").value;
    }

    send({
        type: "settings",
        settings
    })
}

window.onclick = () => {
    document.getElementById("cta").classList.remove("shown");
}