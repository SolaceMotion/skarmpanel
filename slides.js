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
			console.log(e)
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
			console.log(e)
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