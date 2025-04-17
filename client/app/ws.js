window.code = null;
window._keepAliveInterval = null;

function send(obj) {
    ws.send(JSON.stringify(obj));
}

function connect() {
    window.ws = new WebSocket("wss://equilink.equestria.horse/ws");

    ws.onopen = (event) => {
        console.log(event);

        window._keepAliveInterval = setInterval(() => {
            send({
                type: "keepAlive"
            });

            send({
                type: "refresh"
            });
        }, 2000);
    }

    ws.onclose = (event) => {
        document.getElementById("offline").classList.add("shown");
        console.log(event);
        clearInterval(window._keepAliveInterval);

        setTimeout(() => {
            connect();
        }, 500);
    }

    ws.onmessage = (event) => {
        let data;

        try {
            data = JSON.parse(event.data);
            if (data.type !== "refresh") console.log(data);
        } catch (e) {
            console.log(event);
        }

        if (!data) return;

        switch (data.type) {
            case "init":
                if (localStorage.getItem("equilink.id") && localStorage.getItem("equilink.key")) {
                    send({
                        type: "auth",
                        id: localStorage.getItem("equilink.id"),
                        key: localStorage.getItem("equilink.key")
                    });
                } else {
                    send({
                        type: "auth",
                        id: null,
                        key: null
                    });
                }
                break;

            case "session":
                localStorage.setItem("equilink.id", data.id);
                localStorage.setItem("equilink.key", data.key);
                window.code = data.code;

                break;

            case "boop":
                console.log("Boop");
                navigator.vibrate(200);

                document.getElementById("notification").classList.add("shown");
                document.getElementById("notification-sender").innerText = getDisplayName(data.source);
                window.lastBoop = new Date().getTime()

                break;

            case "refresh":
                window.data = data.data;
                loadUI();
                document.getElementById("loader").classList.add("hidden");

                if (typeof window.data.settings['notifications'] === "boolean") {
                    window.notificationsEnabled = window.data.settings['notifications'];
                }

                if (typeof window.data.settings['displayName'] === "string") {
                    document.getElementById("settings-name").value = window.data.settings['displayName'];
                }

                if (window.closeDialogAfterRefresh) {
                    closeDialog();
                    window.closeDialogAfterRefresh = false;
                }

                break;
        }
    }

    ws.onerror = (event) => {
        console.log(event);
        ws.close();
    }
}

connect();