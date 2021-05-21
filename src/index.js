const { app, BrowserWindow, ipcMain, globalShortcut, screen } = require('electron');
const path = require('path');
const os = require('os')
const osUtils = require('os-utils');
const { autoUpdater,  } = require('electron-updater');
const log = require("electron-log");

// log.transports.file.resolvePath = () => path.join(APP_DATA, 'logs/main.log');
// log.transports.console.level = false;
let cancellationToken = null
let first = true;

const createWindow = () => {
	const screens = screen.getAllDisplays()
	const choosenScreen = screens[0]
  // Create the browser window.
	let mainWindow = null
	mainWindow = new BrowserWindow({
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		},
		x: choosenScreen.bounds.x + choosenScreen.size.width / 2 - 150,
		y: choosenScreen.bounds.y + choosenScreen.size.height / 2 - 30,
		width: 300,
		height: 120,
		show:false,
		frame: false,
		icon: path.join(__dirname, 'logo.png'),
	});
	mainWindow.hide()
	globalShortcut.register('Control+Shift+I', () => {
		// When the user presses Ctrl + Shift + I, this function will get called
		// You can modify this function to do other things, but if you just want
		// to disable the shortcut, you can just return false
		if (mainWindow) {
			mainWindow.webContents.openDevTools();
		}
		if (!loaderWindow.isDestroyed() && process.env.NODE_ENV === 'development') {
			loaderWindow.setFullScreen(true)
			loaderWindow.webContents.openDevTools()
		}

		return first;
	});
	const loaderWindow = new BrowserWindow({
		center: true,
		closable: false,
		hasShadow: true,
		show: false,
		closable: false,
		width: 300,
		height: 120,
		hasShadow: true,
		x: choosenScreen.bounds.x + choosenScreen.size.width / 2 - 150,
		y: choosenScreen.bounds.y + choosenScreen.size.height / 2 - 30,
		frame: false,
		enableLargerThanScreen: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },

	})

	loaderWindow.loadFile(path.join(__dirname, "loader", "index.html"))

	loaderWindow.once('ready-to-show', () => {
		loaderWindow.show()
	})

	ipcMain.on('loader_finish', () => {


		mainWindow.once('ready-to-show', () => {
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
			mainWindow.webContents.send("ready")

			autoUpdater.checkForUpdates().then((updatedResult) => {
				cancellationToken = updatedResult.cancellationToken
				// console.log(updatedResult)
				// mainWindow.webContents.send('update_available', updatedResult.updateInfo.version);
			}).catch((err) => {
				log.error(err)
			})
		});
		mainWindow.loadFile(path.join(__dirname, "app", 'index.html'));
		loaderWindow.hide()
		setTimeout(() => {
			mainWindow.setFullScreen(true)
			mainWindow.show()
			loaderWindow.close()
		}, 200)

	})

	ipcMain.on("close", () => {
		if (mainWindow) {
			mainWindow.close()
		}

		if (!loaderWindow.isDestroyed()) {
			loaderWindow.close()
		}
	})

	ipcMain.on("download_update", () => {
		if (cancellationToken) {
			return autoUpdater.downloadUpdate(cancellationToken)
			.catch((err) => {
				err.app_code = 'DOWNLOAD_UPDATE'
				mainWindow.webContents.send("error", {message: err.message, code: err.app_code})
				log.error(err)
			})
		}
	})

	ipcMain.on('restart_app', () => {
		autoUpdater.quitAndInstall()
	})

	ipcMain.on("app_version", () => {
		mainWindow.webContents.send("app_version", app.getVersion())
	})

	ipcMain.on("check_update", () => {
		autoUpdater.checkForUpdates().then((updatedResult) => {
			cancellationToken = updatedResult.cancellationToken
			// console.log(updatedResult)
			// mainWindow.webContents.send('update_available', updatedResult.updateInfo.version);
		}).catch((err) => {
			log.error(err)
		})
	})

	autoUpdater.on('download-progress', (progressObj) => {
		mainWindow.setProgressBar(progressObj.percent / 100)
		mainWindow.webContents.send('download_progress', Math.round(progressObj.percent))
	})

	autoUpdater.on('update-not-available', () => {
		mainWindow.webContents.send('update_not_available');
	});

	autoUpdater.on('update-available', (data) => {
		mainWindow.webContents.send('update_available', data.version);
	});

	autoUpdater.on('update-downloaded', (updateInfo) => {
		mainWindow.webContents.send('update_downloaded', updateInfo);
	})

	autoUpdater.on('error', message => {
		log.error(message)
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
