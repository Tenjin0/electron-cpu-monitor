const { app, BrowserWindow, ipcMain, session, dialog } = require('electron');
const path = require('path');
const os = require('os')
const osUtils = require('os-utils');
const package = require('../package.json')
const { autoUpdater,  } = require('electron-updater');
const log = require("electron-log");
const {inspect} = require('util')
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
//   app.quit();
// }

let cancellationToken = null
const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    fullscreen: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
		show:false,
		icon: path.join(__dirname, 'logo.png'),
		fullscreen: true
  });

	mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.show()

	if (process.env.NODE_ENV && process.env.NODE_ENV === 'development') {
		mainWindow.webContents.openDevTools();
	}

	ipcMain.on("close", () => {
		mainWindow.close()
	})

	ipcMain.on("download_update", () => {
		if (cancellationToken) {
			return autoUpdater.downloadUpdate(cancellationToken).then(() => {
					console.log('try to download')
			})
		.catch((err) => {
				log.error(err)
			})
		}
	})

	ipcMain.on("app_version", () => {
		mainWindow.webContents.send("app_version", app.getVersion())
	})

  osUtils.cpuUsage(function(v) {
    mainWindow.webContents.send("cpu", v * 100)
    mainWindow.webContents.send("mem", osUtils.freememPercentage() *  100)
    mainWindow.webContents.send("total-mem", osUtils.totalmem() / 1024)
    setInterval(() => {
      mainWindow.webContents.send("cpu", v * 100)
      mainWindow.webContents.send("mem", osUtils.freememPercentage() *  100)
      mainWindow.webContents.send("total-mem", osUtils.totalmem() / 1024)
    }, 1000)

  })

	mainWindow.once('ready-to-show', () => {
		mainWindow.show()
		mainWindow.webContents.send("ready")

		autoUpdater.checkForUpdates().then((updatedResult) => {
			cancellationToken = updatedResult.cancellationToken
			console.log(updatedResult)
			mainWindow.webContents.send('update_available', updatedResult.updateInfo.version);
		}).catch((err) => {
			log.error(err)
		})
	});

	autoUpdater.on('download-progress', (progressObj) => {
		console.log(progressObj)
	})

	autoUpdater.on('update-not-available', () => {
		console.log('>>>>>>>update-not-available')
		// mainWindow.webContents.send('update_available');
	});

	autoUpdater.on('update-available', () => {
		console.log('>>>>>>>update-available')
		// mainWindow.webContents.send('update_available');
	});


	autoUpdater.on('error', message => {
		console.error('There was a problem updating the application')
		log.error(message)
	})
	autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
		const dialogOpts = {
			type: 'info',
			buttons: ['Restart', 'Later'],
			title: 'Application Update',
			message: process.platform === 'win32' ? releaseNotes : releaseName,
			detail: "A new version has been downloaded. Restart the application to apply the updates."
		}

		dialog.showMessageBox(dialogOpts).then((returnValue) => {
			if (returnValue.response === 0) autoUpdater.quitAndInstall()
		})
	})

	autoUpdater.allowDowngrade = true
	autoUpdater.autoDownload = false
	autoUpdater.logger = log;
	autoUpdater.logger.transports.file.level = "info";
	autoUpdater.setFeedURL({
		provider: "github", "owner": "tenjin0",	"repo": "electron-cpu-monitor"
	})
};
// const reduxDevToolsPath = path.join(
// 	os.homedir(),
// 	'/.config/google-chrome/Default/Extensions/lmhkpmbekcpmknklioeibfkpmmfibljd/2.17.0_0'
// )
// const reactDevToolsPath = path.join(
// 	os.homedir(),
// 	'/.config/google-chrome/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi/4.12.3_0'
// )
// console.log(reactDevToolsPath)
// console.log(reduxDevToolsPath)
// app.whenReady().then(async () => {
// 	await session.defaultSession.loadExtension(reactDevToolsPath)
// 	await session.defaultSession.loadExtension(reduxDevToolsPath)
// })
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});



// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
