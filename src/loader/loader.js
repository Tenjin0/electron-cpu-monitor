const { ipcRenderer } = require('electron');
setTimeout(() => {
	ipcRenderer.send('loader_finish');
}, 2000)
