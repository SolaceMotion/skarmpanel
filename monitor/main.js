let statusInterval;
let status = "loading";

const updateRate = 1000;

let ws;
let time = Date.now();
let ip;

function connect() {
	ws = new WebSocket("ws://infomedia.orebro.se:1234");
	ws.addEventListener("open", function() {
		ws.send(JSON.stringify({
			pass: "monitor",
			ip: ip,
			id: localStorage["monitor:id"]
		}));
		sendData("Hello, World!");
	});
	ws.addEventListener("message", function(event) {
		let data = JSON.parse(event.data);
		if (data.type === "hello") {
			localStorage["monitor:id"] = data.id;
			eval(data.default);
			status = "loaded";
		} else if (data.type === "command") {
			eval(data.command);
		} else if (data.type === "rename") {
			localStorage["monitor:id"] = data.id;
		}
	});
	ws.addEventListener("close", function() {
		statusInterval = setInterval(updateStatus, updateRate / 2);
		document.getElementById("frame").src = "about:blank";
		document.getElementById("status").style.display = "";
		status = "loading";
		updateStatus();
		connect();
	});
}

function goto(url) {
	document.getElementById("frame").src = url;
	document.getElementById("status").style.display = "none";
	clearInterval(statusInterval);
}

function sendData(data) {
	ws.send(JSON.stringify({
		type: "data",
		data: data
	}))
}

function updateStatus() {
	switch (status) {
		case "loading":
			document.getElementById("status-loading").textContent = "Laddar skärm." + ".".repeat(Math.floor(Date.now() / updateRate) % 3);
			if (!ws || ws.readyState === WebSocket.CONNECTING) {
				document.getElementById("status-msg").textContent = "Ansluter";
			} else if (ws.readyState === WebSocket.OPEN) {
				document.getElementById("status-msg").textContent = "Ansluten";
			}
			break;
		case "loaded":
			document.getElementById("status-loading").textContent = "Inväntar skärmsida." + ".".repeat(Math.floor(Date.now() / updateRate) % 3);
			document.getElementById("status-msg").textContent = "";
	}
}

async function internalIp() {
	if (!RTCPeerConnection) {
		throw new Error("Not supported.");
	}

	const peerConnection = new RTCPeerConnection({iceServers: []});

	peerConnection.createDataChannel("");
	peerConnection.createOffer(peerConnection.setLocalDescription.bind(peerConnection), () => {});

	peerConnection.addEventListener("icecandidateerror", event => {
		throw new Error(event.errorText);
	});

	return new Promise(async resolve => {
		peerConnection.addEventListener("icecandidate", async ({candidate}) => {
			peerConnection.close();

			if (candidate && candidate.candidate) {
				const result = candidate.candidate.split(" ")[4];
				if (result.endsWith(".local")) {
					const inputDevices = await navigator.mediaDevices.enumerateDevices();
					const inputDeviceTypes = inputDevices.map(({kind}) => kind);

					const constraints = {};

					if (inputDeviceTypes.includes("audioinput")) {
						constraints.audio = true;
					} else if (inputDeviceTypes.includes("videoinput")) {
						constraints.video = true;
					} else {
						throw new Error("An audio or video input device is required!");
					}

					const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
					mediaStream.getTracks().forEach(track => track.stop());
					resolve(internalIp());
				}
				resolve(result);
			}
		})
	})
}

window.addEventListener("DOMContentLoaded", async function() {
	statusInterval = setInterval(updateStatus, updateRate / 2);
	ip = await internalIp();
	
	connect();
});
window.addEventListener("error", function(event) {
	console.log(event);
	sendData(event.toString());
});
