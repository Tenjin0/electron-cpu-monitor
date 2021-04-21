const electron = require('electron')
console.log(electron)
const ipcRenderer = electron.ipcRenderer;


ipcRenderer.on("app_version", (event, data) => {
  document.getElementById("app-version").innerHTML =  data
})

ipcRenderer.send("app_version")
ipcRenderer.on("cpu", (event, data) => {
  document.getElementById("cpu").innerHTML = data.toFixed(2)
})

ipcRenderer.on("mem", (event, data) => {
  document.getElementById("mem").innerHTML = data.toFixed(2)

})
ipcRenderer.on("total-mem", (event, data) => {
  document.getElementById("total-mem").innerHTML = data.toFixed(2)
})



window.onload = function ready() {
  const close = document.getElementById("close-button")
	if (close) {
		close.addEventListener('click', () => {
			console.log('close')

			if (electron.remote) {
				electron.remote.getCurrentWindow().close()
			} else {
				ipcRenderer.send('close')
			}
		})
	}

}
