let ws;

let monitors = [];

function updateActions() {
   let selected = monitors.filter(a => a.selected).length;

   document.getElementById("button-url").disabled = selected !== 1;
   document.getElementById("button-temp").disabled = selected === 0;
   document.getElementById("button-rename").disabled = selected !== 1;
   document.getElementById("button-swap").disabled = selected !== 2;
   document.getElementById("button-reset").disabled = selected === 0;
   document.getElementById("button-reboot").disabled = selected !== 1;
}

// SLIDES

let slides = ['']
let timings = [10]
let url;

function c(elementName, options) {
   let element = document.createElement(elementName);
   if (options) {
      if (options.text) {element.innerText = options.text}
      if (options.class) {element.classList.add(options.class)}
      if (options.id) {element.id = options.id}
      if (options.type) {element.type = options.type}
      if (options.placeholder) {element.placeholder = options.placeholder}
      if (options.href) {element.href = options.href}
      if (options.value) {element.value = options.value}
      if (options.elements) {
         for (let i = 0; i < options.elements.length; i++) {
            element.append(options.elements[i])
         }
      }
   }
   return element
}

function u(query, els) {
	document.querySelector(query).innerHTML = ''
	for(let i = 0; i < els.length; i++) {
		document.querySelector(query).append(els[i])
	}
}

function randomUrl() {
	let rand = Math.floor(Math.random()*4)
	if(rand == 0) {
		return "https://github.com/memer-s/"
	}
	else if(rand == 1) {
		return "https://github.com/SolaceMotion/"
	}
	else if(rand == 2) {
		return "https://memer.eu/"	
	}
	else if(rand == 3) {
		return "https://solacemotion.com/"
	}
}

function updateSlideInputs() {

	let inputs = [];

   for(let i = 0; i < slides.length; i++) {

		let inputHref = c('input', { value: slides[i], id: 'url'+(i+1), placeholder: randomUrl(), class: 'slide'})
		inputHref.addEventListener('input', () => {
			slides[i] = inputHref.value
			changeSlidesURL()
		})
		inputHref.addEventListener('keydown', (e) => {
			if(e.keyCode == 13) {
				addSlide()
				let newest = document.getElementsByClassName('slide')
				newest[newest.length-1].select()
			}
		})

		let inputTiming = c('input', { value: timings[i], id: 'tid'+(i+1), type: 'number', placeholder: "tid"})
		inputTiming.addEventListener('input', () => {
			timings[i] = inputTiming.value
			changeSlidesURL()
		})
		inputTiming.addEventListener('keydown', (e) => {
			if(e.keyCode == 13) {
				addSlide()
				let newest = document.getElementsByClassName('slide')
				newest[newest.length-1].select()
			}
		})

		let el = c('div', {
			elements: [
				c('label', {text: 'URL '+(i+1)+': '}),
				inputHref,
				inputTiming
			]
		})

		inputs.push(el)
	}

	u('#urls', inputs)
}

function changeSlidesURL() {
	let string = 'https://memer.eu/slide?'
	let breaked = false

	for(let i = 0; i < slides.length; i++) {
		if(i==0 && slides[i]=='') {breaked = true; break}
		if(i != 0) {string += ','}
		string += slides[i]		
	}
	string += ';'
	for(let i = 0; i < timings.length; i++) {
		if(breaked) {string = 'https://memer.eu/slide?'; break}
		if(i != 0) {string += ','}
		string += timings[i]
	}

	document.querySelector('#slides-url').innerText = string
	url = string;
}

function addSlide() {
	slides.push('')
	timings.push(10)
	updateSlideInputs()
}

// SLIDES EOF

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
      console.log("sending reboot to " + this.id)
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
   ws.addEventListener("open", function () {
      ws.send(JSON.stringify({
         pass: "hejhallåjagäradmin"
      }));
   });
   ws.addEventListener("message", function (event) {
      let data = JSON.parse(event.data);
      if (data.type === "hello") {
         data.monitors.forEach(function (monitor) {
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

window.addEventListener("DOMContentLoaded", function () {
   connect();

   // Test monitor, cant actually interract with it.
   // new Monitor("gränden", "192.168.0.12", true)

   document.getElementById("button-url").addEventListener("click", function () {
      let monitor = monitors.find(a => a.selected);
      let url = prompt("Ange URL", monitor.default.slice(6, -2));
      if (!url) return;

      monitor.sendCommand("goto(\"" + url + "\")", true);
   });
   document.getElementById("button-temp").addEventListener("click", function () {
      let url = prompt("Ange temporär URL");
      if (!url) return;
      monitors.forEach(monitor => {
         if (!monitor.selected) return;
         monitor.sendCommand("goto(\"" + url + "\")", false);
      });
   });
   document.getElementById("button-rename").addEventListener("click", function () {
      let monitor = monitors.find(a => a.selected);
      let name = prompt("Ange nytt namn", monitor.id);
      if (!name) return;
      monitor.rename(name);
   });
   document.getElementById("button-swap").addEventListener("click", function () {
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
   document.getElementById("button-reset").addEventListener("click", function () {
      monitors.forEach(monitor => {
         if (!monitor.selected) return;
         monitor.sendCommand("location.reload();", f/alerse);
      });
   });
   document.getElementById("button-reboot").addEventListener("click", function () {
      monitors.forEach(monitor => {
         if (!monitor.selected) return;
         monitor.sendReboot();
      })
   })
});
