let ws;

let monitors = [];

function updateActions() {
	let selected = monitors.filter(a => a.selected).length;
	
	document.getElementById("button-url").disabled = selected !== 1;
	document.getElementById("button-temp").disabled = selected === 0;
	document.getElementById("button-rename").disabled = selected !== 1;
	document.getElementById("button-swap").disabled = selected !== 2;
	document.getElementById("button-reset").disabled = selected === 0;
	document.getElementById("button-reboot").disabled = selected === 0;
}

class Monitor {
	constructor(id, ip, def) {
		this.id = id;
		this.ip = ip;
		this.default = def;
		this.selected = false;
		
		this.element = document.createElement("li");
		this.headerElement = document.createElement("header");
		this.headerElement.textContent = this.id;
		this.element.appendChild(this.headerElement);
		
		this.mainElement = document.createElement("main");
		this.mainElement.textContent = this.ip;
		this.element.appendChild(this.mainElement);
		
		this.element.addEventListener("click", () => {
			this.selected = !this.selected;
			this.element.classList.toggle("selected");
			updateActions();
		});
		
		document.getElementById("monitors").appendChild(this.element);
		
		monitors.push(this);
	}
	
	setId(newId) {
		this.id = newId;
		this.headerElement.textContent = newId;
	}
	
	sendCommand(command, def) {
		ws.send(JSON.stringify({
			type: "command",
			id: this.id,
			command: command,
			default: def
		}));
	}

   sendReboot() {
      ws.send(JSON.stringify({
         type: "reboot",
         id: this.id
      }))
   }
	
	rename(newId) {
		ws.send(JSON.stringify({
			type: "rename",
			id: this.id,
			newId: newId
		}));
		this.setId(newId);
	}
	
	remove() {
		document.getElementById("monitors").removeChild(this.element);
		monitors.splice(monitors.indexOf(this), 1);
	}
}

function connect() {
	ws = new WebSocket("ws://infomedia.orebro.se:1234");
	ws.addEventListener("open", function() {
		ws.send(JSON.stringify({
			pass: "hejhallåjagäradmin"
		}));
	});
	ws.addEventListener("message", function(event) {
		let data = JSON.parse(event.data);
		if (data.type === "hello") {
			data.monitors.forEach(function(monitor) {
				new Monitor(monitor.id, monitor.ip, monitor.default);
			});
		} else if (data.type === "join") {
			new Monitor(data.id, data.ip, data.default);
		} else if (data.type === "leave") {
			monitors.find(a => a.id === data.id).remove();
		} else if (data.type === "data") {
			console.log(data.id, data.data);
		}
	});
}

window.addEventListener("DOMContentLoaded", function() {
	connect();
	
	document.getElementById("button-url").addEventListener("click", function() {
		let monitor = monitors.find(a => a.selected);
		let url = prompt("Ange URL", monitor.default.slice(6, -2));
		if (!url) return;
		
		monitor.sendCommand("goto(\"" + url + "\")", true);
	});
	document.getElementById("button-temp").addEventListener("click", function() {
		let url = prompt("Ange temporär URL");
		if (!url) return;
		monitors.forEach(monitor => {
			if (!monitor.selected) return;
			monitor.sendCommand("goto(\"" + url + "\")", false);
		});
	});
	document.getElementById("button-rename").addEventListener("click", function() {
		let monitor = monitors.find(a => a.selected);
		let name = prompt("Ange nytt namn", monitor.id);
		if (!name) return;
		monitor.rename(name);
	});
	document.getElementById("button-swap").addEventListener("click", function() {
		let selected = monitors.filter(a => a.selected);
		ws.send(JSON.stringify({
			type: "swap",
			a: selected[0].id,
			b: selected[1].id
		}));
		let temp = selected[0].id;
		selected[0].setId(selected[1].id);
		selected[1].setId(temp);
	});
	document.getElementById("button-reset").addEventListener("click", function() {
		monitors.forEach(monitor => {
			if (!monitor.selected) return;
			monitor.sendCommand("location.reload();", false);
		});
	});
   document.getElementById("button-reboot").addEventListener("click", function() {
      monitors.forEach(monitor => {
         if(!monitor.selected) return;
         monitor.sendReboot();
      })
   })
});
