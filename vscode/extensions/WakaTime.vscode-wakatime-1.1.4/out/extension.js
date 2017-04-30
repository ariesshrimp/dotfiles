// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
var fs = require('fs');
var os = require('os');
var path = require('path');
var child_process = require('child_process');
var AdmZip = require('adm-zip');
var ini = require('ini');
var request = require('request');
var rimraf = require('rimraf');
var logger;
var options;
// this method is called when your extension is activated. activation is
// controlled by the activation events defined in package.json
function activate(ctx) {
    options = new Options();
    logger = new Logger('info');
    options.getSetting('settings', 'debug', function (error, debug) {
        if (debug && debug.trim() === 'true')
            logger.setLevel('debug');
        // initialize WakaTime
        var wakatime = new WakaTime();
        ctx.subscriptions.push(vscode.commands.registerCommand('wakatime.apikey', function (args) {
            wakatime.promptForApiKey();
        }));
        ctx.subscriptions.push(vscode.commands.registerCommand('wakatime.proxy', function (args) {
            wakatime.promptForProxy();
        }));
        ctx.subscriptions.push(vscode.commands.registerCommand('wakatime.debug', function (args) {
            wakatime.promptForDebug();
        }));
        // add to a list of disposables which are disposed when this extension
        // is deactivated again.
        ctx.subscriptions.push(wakatime);
    });
}
exports.activate = activate;
var WakaTime = (function () {
    function WakaTime() {
        this.extension = vscode.extensions.getExtension("WakaTime.vscode-wakatime").packageJSON;
        this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        this.lastHeartbeat = 0;
        this.options = new Options();
        logger.debug('Initializing WakaTime v' + this.extension.version);
        this.statusBar.text = '$(clock) WakaTime Initializing...';
        this.statusBar.show();
        this._checkApiKey();
        this.dependencies = new Dependencies(this.options);
        this.dependencies.checkAndInstall(function () {
            this.statusBar.text = '$(clock) WakaTime Initialized';
            this.statusBar.show();
        }.bind(this));
        this._setupEventListeners();
    }
    WakaTime.prototype.promptForApiKey = function () {
        this.options.getSetting('settings', 'api_key', function (err, defaultVal) {
            if (this.validateKey(defaultVal) != null)
                defaultVal = '';
            var promptOptions = {
                prompt: 'WakaTime API Key',
                placeHolder: 'Enter your api key from wakatime.com/settings',
                value: defaultVal,
                ignoreFocusOut: true,
                validateInput: this.validateKey.bind(this),
            };
            vscode.window.showInputBox(promptOptions).then(function (val) {
                if (this.validateKey(val) == null)
                    this.options.setSetting('settings', 'api_key', val);
            }.bind(this));
        }.bind(this));
    };
    WakaTime.prototype.validateKey = function (key) {
        var err = 'Invalid api key... check https://wakatime.com/settings for your key.';
        if (!key)
            return err;
        var re = new RegExp('^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$', 'i');
        if (!re.test(key))
            return err;
        return null;
    };
    WakaTime.prototype.promptForProxy = function () {
        this.options.getSetting('settings', 'proxy', function (err, defaultVal) {
            if (!defaultVal)
                defaultVal = '';
            var promptOptions = {
                prompt: 'WakaTime Proxy',
                placeHolder: 'Proxy format is https://user:pass@host:port',
                value: defaultVal,
                ignoreFocusOut: true,
                validateInput: this.validateProxy.bind(this),
            };
            vscode.window.showInputBox(promptOptions).then(function (val) {
                if (val || val === '')
                    this.options.setSetting('settings', 'proxy', val);
            }.bind(this));
        }.bind(this));
    };
    WakaTime.prototype.validateProxy = function (proxy) {
        var err = 'Invalid proxy. Valid formats are https://user:pass@host:port or socks5://user:pass@host:port or domain\\user:pass.';
        if (!proxy)
            return err;
        var re = new RegExp('^((https?|socks5)://)?([^:@]+(:([^:@])+)?@)?[\\w\\.-]+(:\\d+)?$', 'i');
        if (proxy.indexOf('\\') > -1)
            re = new RegExp('^.*\\\\.+$', 'i');
        if (!re.test(proxy))
            return err;
        return null;
    };
    WakaTime.prototype.promptForDebug = function () {
        this.options.getSetting('settings', 'debug', function (err, defaultVal) {
            if (!defaultVal || defaultVal.trim() !== 'true')
                defaultVal = 'false';
            var items = ['true', 'false'];
            var promptOptions = {
                placeHolder: 'true or false (Currently ' + defaultVal + ')',
                value: defaultVal,
                ignoreFocusOut: true,
            };
            vscode.window.showQuickPick(items, promptOptions).then(function (newVal) {
                if (newVal == null)
                    return;
                this.options.setSetting('settings', 'debug', newVal);
                if (newVal === 'true') {
                    logger.setLevel('debug');
                    logger.debug('Debug enabled');
                }
                else {
                    logger.setLevel('info');
                }
            }.bind(this));
        }.bind(this));
    };
    WakaTime.prototype._checkApiKey = function () {
        this.hasApiKey(function (hasApiKey) {
            if (!hasApiKey)
                this.promptForApiKey();
        }.bind(this));
    };
    WakaTime.prototype.hasApiKey = function (callback) {
        this.options.getSetting('settings', 'api_key', function (error, apiKey) {
            callback(this.validateKey(apiKey) == null);
        }.bind(this));
    };
    WakaTime.prototype._setupEventListeners = function () {
        // subscribe to selection change and editor activation events
        var subscriptions = [];
        vscode.window.onDidChangeTextEditorSelection(this._onChange, this, subscriptions);
        vscode.window.onDidChangeActiveTextEditor(this._onChange, this, subscriptions);
        vscode.workspace.onDidSaveTextDocument(this._onSave, this, subscriptions);
        // create a combined disposable from both event subscriptions
        this.disposable = (_a = vscode.Disposable).from.apply(_a, subscriptions);
        var _a;
    };
    WakaTime.prototype._onChange = function () {
        this._onEvent(false);
    };
    WakaTime.prototype._onSave = function () {
        this._onEvent(true);
    };
    WakaTime.prototype._onEvent = function (isWrite) {
        var editor = vscode.window.activeTextEditor;
        if (editor) {
            var doc = editor.document;
            if (doc) {
                var file = doc.fileName;
                if (file) {
                    var time = Date.now();
                    if (isWrite || this._enoughTimePassed(time) || this.lastFile !== file) {
                        this._sendHeartbeat(file, isWrite);
                        this.lastFile = file;
                        this.lastHeartbeat = time;
                    }
                }
            }
        }
    };
    WakaTime.prototype._sendHeartbeat = function (file, isWrite) {
        this.hasApiKey(function (hasApiKey) {
            if (hasApiKey) {
                this.dependencies.getPythonLocation(function (pythonBinary) {
                    if (pythonBinary) {
                        var core = this.dependencies.getCoreLocation();
                        var user_agent = 'vscode/' + vscode.version + ' vscode-wakatime/' + this.extension.version;
                        var args = [core, '--file', file, '--plugin', user_agent];
                        var project = this._getProjectName();
                        if (project)
                            args.push('--alternate-project', project);
                        if (isWrite)
                            args.push('--write');
                        logger.debug('Sending heartbeat: ' + this.formatArguments(pythonBinary, args));
                        var process_1 = child_process.execFile(pythonBinary, args, function (error, stdout, stderr) {
                            if (error != null) {
                                if (stderr && stderr.toString() != '')
                                    logger.error(stderr);
                                if (stdout && stdout.toString() != '')
                                    logger.error(stdout);
                                logger.error(error);
                            }
                        }.bind(this));
                        process_1.on('close', function (code, signal) {
                            if (code == 0) {
                                this.statusBar.text = '$(clock) WakaTime Active';
                                var today = new Date();
                                this.statusBar.tooltip = 'Last heartbeat sent at ' + this.formatDate(today);
                            }
                            else if (code == 102) {
                                this.statusBar.text = '$(clock) WakaTime Offline, coding activity will sync when online.';
                                logger.warn('API Error (102); Check your ~/.wakatime.log file for more details.');
                            }
                            else if (code == 103) {
                                this.statusBar.text = '$(clock) WakaTime Error';
                                var error_msg = 'Config Parsing Error (103); Check your ~/.wakatime.log file for more details.';
                                this.statusBar.tooltip = error_msg;
                                logger.error(error_msg);
                            }
                            else if (code == 104) {
                                this.statusBar.text = '$(clock) WakaTime Error';
                                var error_msg = 'Invalid API Key (104); Make sure your API Key is correct!';
                                this.statusBar.tooltip = error_msg;
                                logger.error(error_msg);
                            }
                            else {
                                this.statusBar.text = '$(clock) WakaTime Error';
                                var error_msg = 'Unknown Error (' + code + '); Check your ~/.wakatime.log file for more details.';
                                this.statusBar.tooltip = error_msg;
                                logger.error(error_msg);
                            }
                        }.bind(this));
                    }
                }.bind(this));
            }
            else {
                this.promptForApiKey();
            }
        }.bind(this));
    };
    WakaTime.prototype.formatDate = function (date) {
        var months = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
        ];
        var ampm = 'AM';
        var hour = date.getHours();
        if (hour > 11) {
            ampm = 'PM';
            hour = hour - 12;
        }
        if (hour == 0) {
            hour = 12;
        }
        var minute = date.getMinutes();
        if (minute < 10)
            minute = '0' + minute;
        return months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear() + ' ' + hour + ':' + minute + ' ' + ampm;
    };
    WakaTime.prototype._enoughTimePassed = function (time) {
        return this.lastHeartbeat + 120000 < time;
    };
    WakaTime.prototype._getProjectName = function () {
        if (vscode.workspace && vscode.workspace.rootPath)
            try {
                return vscode.workspace.rootPath.match(/([^\/^\\]*)[\/\\]*$/)[1];
            }
            catch (e) { }
        return null;
    };
    WakaTime.prototype.obfuscateKey = function (key) {
        var newKey = '';
        if (key) {
            newKey = key;
            if (key.length > 4)
                newKey = 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXX' + key.substring(key.length - 4);
        }
        return newKey;
    };
    WakaTime.prototype.wrapArg = function (arg) {
        if (arg.indexOf(' ') > -1)
            arg = '"' + arg + '"';
        return arg;
    };
    WakaTime.prototype.formatArguments = function (python, args) {
        var clone = args.slice(0);
        clone.unshift(this.wrapArg(python));
        var newCmds = [];
        var lastCmd = '';
        for (var i = 0; i < clone.length; i++) {
            if (lastCmd == '--key')
                newCmds.push(this.wrapArg(this.obfuscateKey(clone[i])));
            else
                newCmds.push(this.wrapArg(clone[i]));
            lastCmd = clone[i];
        }
        return newCmds.join(' ');
    };
    WakaTime.prototype.dispose = function () {
        this.statusBar.dispose();
        this.disposable.dispose();
    };
    return WakaTime;
})();
exports.WakaTime = WakaTime;
var Dependencies = (function () {
    function Dependencies(options) {
        this.installCore = function (callback) {
            logger.debug('Downloading wakatime-core...');
            var url = 'https://github.com/wakatime/wakatime/archive/master.zip';
            var zipFile = __dirname + path.sep + 'wakatime-master.zip';
            this.downloadFile(url, zipFile, function () {
                this.extractCore(zipFile, callback);
            }.bind(this));
        };
        this.options = options;
    }
    Dependencies.prototype.checkAndInstall = function (callback) {
        this.isPythonInstalled(function (isInstalled) {
            if (!isInstalled) {
                this.installPython(function () {
                    this.checkAndInstallCore(callback);
                }.bind(this));
            }
            else {
                this.checkAndInstallCore(callback);
            }
        }.bind(this));
    };
    Dependencies.prototype.checkAndInstallCore = function (callback) {
        if (!this.isCoreInstalled()) {
            this.installCore(callback);
        }
        else {
            this.isCoreLatest(function (isLatest) {
                if (!isLatest) {
                    this.installCore(callback);
                }
                else {
                    callback();
                }
            }.bind(this));
        }
    };
    Dependencies.prototype.getPythonLocation = function (callback) {
        if (this._cachedPythonLocation)
            return callback(this._cachedPythonLocation);
        var locations = [
            __dirname + path.sep + 'python' + path.sep + 'pythonw',
            "pythonw",
            "python",
            "/usr/local/bin/python",
            "/usr/bin/python",
        ];
        for (var i = 40; i >= 26; i--) {
            locations.push('\\python' + i + '\\pythonw');
            locations.push('\\Python' + i + '\\pythonw');
        }
        var args = ['--version'];
        for (var i = 0; i < locations.length; i++) {
            try {
                var stdout = child_process.execFileSync(locations[i], args);
                this._cachedPythonLocation = locations[i];
                return callback(locations[i]);
            }
            catch (e) { }
        }
        callback(null);
    };
    Dependencies.prototype.getCoreLocation = function () {
        var dir = __dirname + path.sep + 'wakatime-master' + path.sep + 'wakatime' + path.sep + 'cli.py';
        return dir;
    };
    Dependencies.prototype.isCoreInstalled = function () {
        return fs.existsSync(this.getCoreLocation());
    };
    Dependencies.prototype.isCoreLatest = function (callback) {
        this.getPythonLocation(function (pythonBinary) {
            if (pythonBinary) {
                var args = [this.getCoreLocation(), '--version'];
                child_process.execFile(pythonBinary, args, function (error, stdout, stderr) {
                    if (!(error != null)) {
                        var currentVersion = stderr.toString().trim();
                        logger.debug('Current wakatime-core version is ' + currentVersion);
                        logger.debug('Checking for updates to wakatime-core...');
                        this.getLatestCoreVersion(function (latestVersion) {
                            if (currentVersion === latestVersion) {
                                logger.debug('wakatime-core is up to date.');
                                if (callback)
                                    callback(true);
                            }
                            else if (latestVersion) {
                                logger.debug('Found an updated wakatime-core v' + latestVersion);
                                if (callback)
                                    callback(false);
                            }
                            else {
                                logger.debug('Unable to find latest wakatime-core version from GitHub.');
                                if (callback)
                                    callback(false);
                            }
                        });
                    }
                    else {
                        if (callback)
                            callback(false);
                    }
                }.bind(this));
            }
            else {
                if (callback)
                    callback(false);
            }
        }.bind(this));
    };
    Dependencies.prototype.getLatestCoreVersion = function (callback) {
        var url = 'https://raw.githubusercontent.com/wakatime/wakatime/master/wakatime/__about__.py';
        this.options.getSetting('settings', 'proxy', function (err, proxy) {
            var options = { url: url };
            if (proxy && proxy.trim())
                options[proxy] = proxy.trim();
            request.get(options, function (error, response, body) {
                var version = null;
                if (!error && response.statusCode == 200) {
                    var lines = body.split('\n');
                    for (var i = 0; i < lines.length; i++) {
                        var re = /^__version_info__ = \('([0-9]+)', '([0-9]+)', '([0-9]+)'\)/g;
                        var match = re.exec(lines[i]);
                        if (match != null) {
                            version = match[1] + '.' + match[2] + '.' + match[3];
                            if (callback)
                                return callback(version);
                        }
                    }
                }
                if (callback)
                    return callback(version);
            });
        });
    };
    Dependencies.prototype.extractCore = function (zipFile, callback) {
        var _this = this;
        logger.debug('Extracting wakatime-core into "' + __dirname + '"...');
        this.removeCore(function () {
            _this.unzip(zipFile, __dirname, callback);
            logger.debug('Finished extracting wakatime-core.');
        });
    };
    Dependencies.prototype.removeCore = function (callback) {
        if (fs.existsSync(__dirname + path.sep + 'wakatime-master')) {
            try {
                rimraf(__dirname + path.sep + 'wakatime-master', function () {
                    if (callback != null) {
                        return callback();
                    }
                });
            }
            catch (e) {
                logger.warn(e);
            }
        }
        else {
            if (callback != null) {
                return callback();
            }
        }
    };
    Dependencies.prototype.downloadFile = function (url, outputFile, callback) {
        this.options.getSetting('settings', 'proxy', function (err, proxy) {
            var options = { url: url };
            if (proxy && proxy.trim())
                options[proxy] = proxy.trim();
            var r = request.get(options);
            var out = fs.createWriteStream(outputFile);
            r.pipe(out);
            return r.on('end', function () {
                return out.on('finish', function () {
                    if (callback != null) {
                        return callback();
                    }
                });
            });
        });
    };
    Dependencies.prototype.unzip = function (file, outputDir, callback) {
        if (fs.existsSync(file)) {
            try {
                var zip = new AdmZip(file);
                zip.extractAllTo(outputDir, true);
            }
            catch (e) {
                return logger.error(e);
            }
            finally {
                fs.unlink(file);
                if (callback != null) {
                    return callback();
                }
            }
        }
    };
    Dependencies.prototype.isPythonInstalled = function (callback) {
        this.getPythonLocation(function (pythonBinary) {
            callback(!!pythonBinary);
        }.bind(this));
    };
    Dependencies.prototype.installPython = function (callback) {
        if (os.type() === 'Windows_NT') {
            var ver = '3.5.1';
            var arch = 'win32';
            if (os.arch().indexOf('x64') > -1)
                arch = 'amd64';
            var url = 'https://www.python.org/ftp/python/' + ver + '/python-' + ver + '-embed-' + arch + '.zip';
            logger.debug('Downloading python...');
            var zipFile = __dirname + path.sep + 'python.zip';
            this.downloadFile(url, zipFile, function () {
                logger.debug('Extracting python...');
                this.unzip(zipFile, __dirname + path.sep + 'python');
                logger.debug('Finished installing python.');
                callback();
            }.bind(this));
        }
        else {
            logger.error('WakaTime depends on Python. Install it from https://python.org/downloads then restart VSCode.');
        }
    };
    return Dependencies;
})();
var Options = (function () {
    function Options() {
        this._configFile = path.join(this.getUserHomeDir(), '.wakatime.cfg');
    }
    Options.prototype.getSetting = function (section, key, callback) {
        String.prototype.startsWith = function (s) { return this.slice(0, s.length) === s; };
        String.prototype.endsWith = function (s) { return (s === '') || (this.slice(-s.length) === s); };
        fs.readFile(this._configFile, 'utf-8', function (err, content) {
            if (err) {
                if (callback)
                    callback(new Error('could not read ~/.wakatime.cfg'), null);
            }
            else {
                var currentSection = '';
                var lines = content.split('\n');
                for (var i = 0; i < lines.length; i++) {
                    var line = lines[i];
                    if (line.trim().startsWith('[') && line.trim().endsWith(']')) {
                        currentSection = line.trim().substring(1, line.trim().length - 1).toLowerCase();
                    }
                    else if (currentSection === section) {
                        var parts = line.split('=');
                        var currentKey = parts[0].trim();
                        if (currentKey === key && parts.length > 1) {
                            if (callback)
                                callback(null, parts[1].trim());
                            return;
                        }
                    }
                }
                if (callback)
                    callback(null, null);
            }
        });
    };
    Options.prototype.setSetting = function (section, key, val, callback) {
        String.prototype.startsWith = function (s) { return this.slice(0, s.length) === s; };
        String.prototype.endsWith = function (s) { return (s === '') || (this.slice(-s.length) === s); };
        fs.readFile(this._configFile, 'utf-8', function (err, content) {
            // ignore errors because config file might not exist yet
            if (err)
                content = '';
            var contents = [];
            var currentSection = '';
            var found = false;
            var lines = content.split('\n');
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (line.trim().startsWith('[') && line.trim().endsWith(']')) {
                    if ((currentSection === section) && !found) {
                        contents.push(key + ' = ' + val);
                        found = true;
                    }
                    currentSection = line.trim().substring(1, line.trim().length - 1).toLowerCase();
                    contents.push(line);
                }
                else if (currentSection === section) {
                    var parts = line.split('=');
                    var currentKey = parts[0].trim();
                    if (currentKey === key) {
                        if (!found) {
                            contents.push(key + ' = ' + val);
                            found = true;
                        }
                    }
                    else {
                        contents.push(line);
                    }
                }
                else {
                    contents.push(line);
                }
            }
            if (!found) {
                if (currentSection !== section) {
                    contents.push('[' + section + ']');
                }
                contents.push(key + ' = ' + val);
            }
            fs.writeFile(this._configFile, contents.join('\n'), function (err2) {
                if (err) {
                    if (callback)
                        callback(new Error('could not write to ~/.wakatime.cfg'));
                }
                else {
                    if (callback)
                        callback(null);
                }
            });
        }.bind(this));
    };
    Options.prototype.getUserHomeDir = function () {
        return process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'] || '';
    };
    return Options;
})();
var Logger = (function () {
    function Logger(level) {
        this.levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3,
        };
        this.setLevel(level);
    }
    Logger.prototype.setLevel = function (level) {
        if (level in this.levels) {
            this._level = level;
        }
        else {
            throw new TypeError('Invalid level: ' + level);
        }
    };
    Logger.prototype.log = function (level, msg) {
        if (!(level in this.levels))
            throw new TypeError('Invalid level: ' + level);
        var current = this.levels[level];
        var cutoff = this.levels[this._level];
        if (current >= cutoff) {
            msg = '[WakaTime] [' + level.toUpperCase() + '] ' + msg;
            if (level == 'debug')
                console.log(msg);
            if (level == 'info')
                console.info(msg);
            if (level == 'warn')
                console.warn(msg);
            if (level == 'error')
                console.error(msg);
        }
    };
    Logger.prototype.debug = function (msg) {
        this.log('debug', msg);
    };
    Logger.prototype.info = function (msg) {
        this.log('info', msg);
    };
    Logger.prototype.warn = function (msg) {
        this.log('warn', msg);
    };
    Logger.prototype.error = function (msg) {
        this.log('error', msg);
    };
    return Logger;
})();
//# sourceMappingURL=extension.js.map