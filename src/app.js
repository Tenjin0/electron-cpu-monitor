const electron = require('electron')

const ipcRenderer = electron.ipcRenderer;

let closeNotificationButton  = null
let restartNotificationButton  = null
let downloadNotificationButton  = null
let checkUpdateNotificationButton  = null
let notification = null
let message = null
// const restartButton = document.getElementById('restart-button');

ipcRenderer.on('update_available', (event, version) => {
	console.log('update_available', version)
  // ipcRenderer.removeAllListeners('update_available');
	if (message) {
		message.innerText = 'Last update is available. (' + version + ')';
	}
	if (notification) {
		notification.classList.remove('hidden');
	}
	if (downloadNotificationButton) {
		downloadNotificationButton.classList.remove('hidden');
	}
	if (closeNotificationButton) {
		closeNotificationButton.classList.remove('hidden');
	}
});

ipcRenderer.on("app_version", (event, data) => {
	const appVersion = document.getElementById("app-version")
	if (appVersion) {
		document.getElementById("app-version").innerHTML =  data
	}
	setTimeout(() => {
		const appVersion = document.getElementById("app-version")
		console.log(appVersion)
	}, 10)
})

ipcRenderer.on("ready", () => {
})

ipcRenderer.on("cpu", (event, data) => {
  document.getElementById("cpu").innerHTML = data.toFixed(2)
})

ipcRenderer.on("mem", (event, data) => {
  document.getElementById("mem").innerHTML = data.toFixed(2)

})
ipcRenderer.on("total-mem", (event, data) => {
  document.getElementById("total-mem").innerHTML = data.toFixed(2)
})

function closeNotification() {
	if (!notification.classList.contains("hidden")) {
		notification.classList.add('hidden');
	}
	if (!closeNotificationButton.classList.contains("hidden")) {
		closeNotificationButton.classList.add('hidden');
	}
	if (!downloadNotificationButton.classList.contains("hidden")) {
		downloadNotificationButton.classList.add('hidden');
	}
	setTimeout(() => {
		if (message) {
			message.innerText = 'Check update ?';
		}
		if (notification) {
			notification.classList.remove('hidden');
			checkUpdateNotificationButton.classList.remove('hidden');
		}
	}, 1000)
}

function checkUpdate() {
	ipcRenderer.send('check_update');
	notification.classList.add('hidden');
	checkUpdateNotificationButton.classList.add('hidden');
}

function restartApp() {
  ipcRenderer.send('restart_app');
}

function downloadUpdate() {
  ipcRenderer.send('download_update');
	notification.classList.add('hidden');
}

window.onload = function ready() {
  const close = document.getElementById("close-app-button")
	notification = document.getElementById('notification');

  closeNotificationButton  = document.getElementById("close-button")
  restartNotificationButton  = document.getElementById("restart-button")
  downloadNotificationButton  = document.getElementById("download-button")
  checkUpdateNotificationButton  = document.getElementById("check-update-button")
	message = document.getElementById('message')
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
	ipcRenderer.send("app_version")
}
