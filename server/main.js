const ws = require("ws");
const https = require("https");
const fs = require("fs");

const adminpass = "hejhallåjagäradmin";
const monitorpass = "monitor";

//const httpsServer = new https.createServer({
//	cert: fs.readFileSync("/etc/letsencrypt/live/daydun.com/fullchain.pem"),
//	key: fs.readFileSync("/etc/letsencrypt/live/daydun.com/privkey.pem")
//});
let server = new ws.Server({
//	server: httpsServer
	port: 1234
});

let defaults = JSON.parse(fs.readFileSync("defaults.json"));

let monitors = [];
let admins = [];

class Client {
	constructor(socket, ip) {
		this.type = "none";
		//this.ip = ip;
		this.ip = "N/A";
		
		this.socket = socket;
		socket.on("message", (data) => {
			this.onMessage(data);
		});
		socket.on("close", () => {
			this.onClose(socket);
		});
	}
	
	onMessage(data) {
		data = JSON.parse(data);
		if (this.type === "none") {
			if (data.pass === monitorpass) {
				this.setMonitor(data.id, data.ip);
			} else if (data.pass === adminpass) {
				this.setAdmin();
			} else {
				this.socket.close();
			}
			return;
		} else if (this.type === "monitor") {
			if (data.type === "data") {
				admins.forEach(admin => {
					admin.socket.send(JSON.stringify({
						type: "data",
						id: this.id,
						data: data.data
					}));
				});
			}
		} else if (this.type === "admin") {
			if (data.type === "command") {
				monitors.find(a => a.id === data.id).socket.send(JSON.stringify({
					type: "command",
					command: data.command
				}));
				if (data.default === true) {
					defaults.monitors[data.id] = data.command;
					fs.writeFileSync("defaults.json", JSON.stringify(defaults));
				}
			} else if (data.type === "rename") {
				let monitor = monitors.find(a => a.id === data.id);
				monitor.id = data.newId;
				monitor.socket.send(JSON.stringify({
					type: "rename",
					id: data.newId
				}));
				if (data.id in defaults.monitors) {
					let cmd = defaults.monitors[data.id];
					delete defaults.monitors[data.id];
					defaults.monitors[data.newId] = cmd;
					fs.writeFileSync("defaults.json", JSON.stringify(defaults));
				}
			} else if (data.type === "swap") {
				let a = monitors.find(a => a.id === data.a);
				let b = monitors.find(a => a.id === data.b);
				
				a.id = data.b;
				b.id = data.a;
				
				a.socket.send(JSON.stringify({
					type: "rename",
					id: data.b
				}));
				a.socket.send(JSON.stringify({
					type: "command",
					command: defaults.monitors[data.b]
				}));
				b.socket.send(JSON.stringify({
					type: "rename",
					id: data.a
				}));
				b.socket.send(JSON.stringify({
					type: "command",
					command: defaults.monitors[data.a]
				}));
			}
		}
	}
	
	setMonitor(id, ip) {
		this.type = "monitor";
		this.id = id || "monitor-" + (Object.keys(defaults.monitors).length + 1);
		this.ip = ip;
		this.socket.send(JSON.stringify({
			type: "hello",
			id: this.id,
			default: defaults.monitors[this.id]
		}));
		monitors.push(this);
		
		admins.forEach(admin => {
			admin.socket.send(JSON.stringify({
				type: "join",
				id: this.id,
				ip: this.ip,
				default: defaults.monitors[this.id]
			}));
		});
	}
	
	setAdmin() {
		this.type = "admin";
		this.socket.send(JSON.stringify({
			type: "hello",
			monitors: monitors.map(monitor => {
				return {
					id: monitor.id,
					ip: monitor.ip,
					default: defaults.monitors[monitor.id]
				};
			})
		}));
		admins.push(this);
	}
	
	onClose() {
		if (this.type === "monitor") {
			monitors.splice(monitors.indexOf(this), 1);
			admins.forEach(admin => {
				admin.socket.send(JSON.stringify({
					type: "leave",
					id: this.id
				}));
			});
		} else if (this.type === "admin") {
			admins.splice(admins.indexOf(this), 1);
		}
	}
}

server.on("connection", function(socket, request) {
	socket.isAlive = true;
	socket.on("pong", function() {
		socket.isAlive = true;
	});
	
	let ip = request.socket.remoteAddress;
	
	let client = new Client(socket, ip);
});

setInterval(function() {
	server.clients.forEach(function each(socket) {
		if (socket.isAlive === false) return socket.terminate();
		if (socket.readyState !== ws.OPEN) return;

		socket.isAlive = false;
		socket.ping();
	});
}, 30000);

//httpsServer.listen(42069);
server.on("listening", () => console.log("start"));