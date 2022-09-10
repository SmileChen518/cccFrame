import fs from 'fs-extra';
import path, { join } from 'path';
import { createApp } from 'vue';
let Electron = require('electron');
let CfgUtil = require('./CfgUtil.js');
let chokidar = require('chokidar');
let nodeXlsx = require('node-xlsx');
let jsonBeautifully = require('json-beautifully');
let uglifyJs = require('uglify-js');

let dirClientName = "client";
let dirServerName = "server";
let projectPath = Editor.Project.path;
let excelOutPutPath = 'plugins-excel/excel-output';
let clientJsPath = join(projectPath, "assets/script/data/config");

module.exports = Editor.Panel.define({
    listeners: {
        show() { console.log('show'); },
        hide() { console.log('hide'); },
    },
    template: fs.readFileSync(join(__dirname, '../../../../static/template/default/index.html'), 'utf-8')+"",
    style: fs.readFileSync(join(__dirname, '../../../../static/style/default/index.css'), 'utf-8')+"",
    $: {
        app: '#app',
        text: '#text',
        logTextArea: '#logTextArea',
    },
    methods: {
        // hello() {
        //     if (this.$.text) {
        //         this.$.text.innerHTML = 'hello';
        //         console.log('[cocos-panel-html.default]: hello');
        //     }
        // },
    },
    ready() {
        if (this.$.text) {
            this.$.text.innerHTML = 'Hello Cocos.';
        }
        
        if (this.$.app) {
            const app = createApp({});
            app.config.compilerOptions.isCustomElement = tag => tag.startsWith('ui-');
            app.component('my-counter', {
                template: fs.readFileSync(join(__dirname, '../../../../static/template/vue/counter.html'), 'utf-8'),
                created() {
                    this._initPluginCfg();
                },
                data() {
                    return {
                        counter: 0,
                        logView: "",
                        excelRootPath: null,

                        isMergeJson: false,
                        isMergeJavaScript: false,
                        isExportJson: false,// 是否导出Json
                        isExportJs: false,// 是否导出Js
                        isFormatJson: false,// 是否格式化Json
                        isExportClient: false,// 是否导出客户端
                        isExportServer: false,// 是否导出服务端
                        isJsonAllCfgFileExist: false,// 是否单一配置文件存在
                        jsonSavePath: null,// json保存文件夹路径
                        jsonAllCfgFileName: null,// json配置文件名

                        jsSavePath: null,// 插件资源目录
                        jsFileName: null,//js配置合并为一个文件的文件名
                        isJsFileExist: false,
                        isFormatJsCode: false,
                        excelArray: [],
                        excelFileArr: [],


                        importProjectCfgPath: null,
                    };
                }, methods: {
                    logListScrollToBottom() {
                        console.log("this.$.logTextArea=", this.$.logTextArea);
                        if (this.$.logTextArea){
                            let logCtrl = this.$.logTextArea;
                            setTimeout(function () {
                                console.log(123);
                                logCtrl.scrollTop = logCtrl.scrollHeight;
                            }, 10);
                        }
                    },
                    addition() {
                        this.counter += 1;
                    },
                    subtraction() {
                        this.counter -= 1;
                    },
                    onStopTouchEvent(event: { preventDefault: () => void; stopPropagation: () => void; }) {
                        event.preventDefault();
                        event.stopPropagation();
                    },
                    onBtnClickHelpDoc() {
                        let url = "http://baidu.com";
                        Electron.shell.openExternal(url);
                    },
                    onBtnClickTellMe() {
                        let url = "https://github.com/SmileChen518";
                        Electron.shell.openExternal(url);
                    },
                    checkJsFileExist() {
                        let saveFileFullPath1 = join(this.jsSavePath, dirClientName, this.jsFileName + ".js");
                        let saveFileFullPath2 = join(this.jsSavePath, dirServerName, this.jsFileName + ".js");
                        if (fs.existsSync(saveFileFullPath1) || fs.existsSync(saveFileFullPath2)) {
                            this.isJsFileExist = true;
                        } else {
                            this.isJsFileExist = false;
                        }
                    },
                    checkJsonAllCfgFileExist() {
                        let saveFileFullPath1 = join(this.jsonSavePath, dirClientName, this.jsonAllCfgFileName + ".json");
                        let saveFileFullPath2 = join(this.jsonSavePath, dirServerName, this.jsonAllCfgFileName + ".json");
                        if (fs.existsSync(saveFileFullPath1) || fs.existsSync(saveFileFullPath2)) {
                            this.isJsonAllCfgFileExist = true;
                        } else {
                            this.isJsonAllCfgFileExist = false;
                        }
                    },
                    _initPluginCfg() {
                        CfgUtil.initCfg( (data: any) => {
                            if (data) {
                                this.excelRootPath = data.excelRootPath || "";
                                if (fs.existsSync(this.excelRootPath)) {
                                    this._onAnalyzeExcelDirPath(this.excelRootPath);
                                    chokidar.watch(this.excelRootPath, {
                                        usePolling: true,
                                        // interval: 1000,
                                        // awaitWriteFinish: {
                                        //     stabilityThreshold: 2000,
                                        //     pollInterval: 100
                                        // },
                                    }).on('all', this._watchDir.bind(this));
                                } else {
    
                                }
                                this.jsFileName = data.jsFileName || "GameJsCfg";
                                this.jsonAllCfgFileName = data.jsonAllFileName || "GameJsonCfg";
                                this.isMergeJson = data.isMergeJson || false;
                                this.isMergeJavaScript = data.isMergeJavaScript || false;
                                this.isFormatJsCode = data.isFormatJsCode || false;
                                this.isFormatJson = data.isFormatJson || false;
                                this.isExportJson = data.isExportJson || false;
                                this.isExportJs = data.isExportJs || false;
                                this.isExportClient = data.isExportClient || false;
                                this.isExportServer = data.isExportServer || false;
                                this.importProjectCfgPath = data.importProjectCfgPath || null;
                                this.checkJsFileExist();
                                this.checkJsonAllCfgFileExist();
                            } else {
                                this.jsFileName = "GameJsCfg";
                                this.jsonAllCfgFileName = "GameJsonCfg";
                            }
                        });
                        this._initCfgSavePath();// 默认json路径
                    },
                    _initCfgSavePath() {
                        let pluginResPath = join(projectPath, excelOutPutPath);
                        if (!fs.existsSync(pluginResPath)) {
                            fs.mkdirSync(pluginResPath);
                        }
    
                        let pluginResPath1 = join(pluginResPath, "json");
                        if (!fs.existsSync(pluginResPath1)) {
                            fs.mkdirSync(pluginResPath1);
                        }
                        this.jsonSavePath = pluginResPath1;
                        this._initCSDir(this.jsonSavePath);
    
                        let pluginResPath2 = join(pluginResPath, "js");
                        if (!fs.existsSync(pluginResPath2)) {
                            fs.mkdirSync(pluginResPath2);
                        }
                        this.jsSavePath = pluginResPath2;
                        this._initCSDir(this.jsSavePath);
                    },
                    _initCSDir(saveDir: any) {
                        let clientDir = join(saveDir, dirClientName);
                        if (!fs.existsSync(clientDir)) {
                            fs.mkdirSync(clientDir);
                        }
                        let serverDir = join(saveDir, dirServerName);
                        if (!fs.existsSync(serverDir)) {
                            fs.mkdirSync(serverDir);
                        }
                    },
                    _saveConfig() {
                        let data = {
                            excelRootPath: this.excelRootPath,
                            jsFileName: this.jsFileName,
                            jsonAllFileName: this.jsonAllCfgFileName,
                            isMergeJson: this.isMergeJson,
                            isMergeJavaScript: this.isMergeJavaScript,
                            isFormatJsCode: this.isFormatJsCode,
                            isFormatJson: this.isFormatJson,
                            isExportJson: this.isExportJson,
                            isExportJs: this.isExportJs,
                            isExportClient: this.isExportClient,
                            isExportServer: this.isExportServer,
                            importProjectCfgPath: this.importProjectCfgPath,
                        };
                        CfgUtil.saveCfgByData(data);
                        Editor.Dialog.info("save ok!");
                    },
                    onBtnClickFormatJson() {
                        this.isFormatJson = !this.isFormatJson;
                        this._saveConfig();
                    },
                    onBtnClickMergeJson() {
                        this.isMergeJson = !this.isMergeJson;
                        this._saveConfig();
                    },
                    onJsonAllCfgFileChanged() {
                        this._saveConfig();
                    },
                    onBtnClickJsonAllCfgFile() {
                        let saveFileFullPath1 = join(this.jsonSavePath, dirClientName, this.jsonAllCfgFileName + ".json");
                        let saveFileFullPath2 = join(this.jsonSavePath, dirServerName, this.jsonAllCfgFileName + ".json");
                        if (fs.existsSync(saveFileFullPath1)) {
                            Electron.shell.openPath(saveFileFullPath1);
                            Electron.shell.beep();
                        } else if (fs.existsSync(saveFileFullPath2)) {
                            Electron.shell.openPath(saveFileFullPath2);
                            Electron.shell.beep();
                        } else {
                            // this._addLog("目录不存在：" + this.resourceRootDir);
                            this._addLog("目录不存在:" + saveFileFullPath1 + ' or:' + saveFileFullPath2);
                            return;
                        }
                    },
                    onBtnClickOpenJsonSavePath() {
                        let saveFileFullPath1 = join(this.jsonSavePath, dirClientName);
                        let saveFileFullPath2 = join(this.jsonSavePath, dirServerName);
                        if (fs.existsSync(saveFileFullPath1)) {
                            Electron.shell.openPath(saveFileFullPath1);
                            Electron.shell.beep();
                        } else if (fs.existsSync(saveFileFullPath2)) {
                            Electron.shell.openPath(saveFileFullPath2);
                            Electron.shell.beep();
                        } else {
                            // this._addLog("目录不存在：" + this.resourceRootDir);
                            this._addLog("目录不存在:" + saveFileFullPath1 + ' or:' + saveFileFullPath2);
                            return;
                        }
                    },
                    onBtnClickSelectProjectJsonCfgPath() {
                        // let res = Editor.Dialog.openFile({
                        //     title: "选择项目配置存放目录",
                        //     defaultPath: join(projectPath, "assets"),
                        //     properties: ['openDirectory'],
                        // });
                        // if (res !== -1) {
                        //     let dir = res[0];
                        //     if (dir !== this.importProjectCfgPath) {
                        //         this.importProjectCfgPath = dir;
                        //         this._saveConfig();
                        //     }
                        // }
                    },
                    onBtnClickImportProjectJsonCfg_Server() {
                        this._importJsonCfg("server");
                    },
                    onBtnClickImportProjectJsonCfg_Client() {
                        this._importJsonCfg("client");
                    },
                    _importJsonCfg(typeDir: any) {
                        if (!fs.existsSync(this.importProjectCfgPath)) {
                            this._addLog("导入项目路径不存在:" + this.importProjectCfgPath);
                            return;
                        }
    
                        if (!this.isExportJson) {
                            this._addLog("[Warning] 您未勾选导出Json配置,可能导入的配置时上个版本的!");
                        }
                        // let importPath = Editor.assetdb.remote.fspathToUrl(this.importProjectCfgPath);
                        // if (importPath.indexOf("db://assets") >= 0) {
    
                        //     // 检索所有的json配置
                        //     let clientDir = path.join(this.jsonSavePath, typeDir);
                        //     if (!fs.existsSync(clientDir)) {
                        //         this._addLog("配置目录不存在:" + clientDir);
                        //         return;
                        //     }
                        //     let pattern = path.join(clientDir, '**/*.json');
                        //     let files = Globby.sync(pattern)
                        //     this._addLog("一共导入文件数量: " + files.length);
                        //     for (let i = 0; i < files.length; i++) {
    
                        //     }
                        //     Editor.assetdb.import(files, importPath,
                        //         function (err, results) {
                        //             results.forEach(function (result) {
                        //                 console.log(result.path);
                        //                 // result.uuid
                        //                 // result.parentUuid
                        //                 // result.url
                        //                 // result.path
                        //                 // result.type
                        //             });
                        //         }.bind(this));
                        // } else {
                        //     this._addLog("非项目路径,无法导入 : " + this.importProjectCfgPath);
                        // }
                    },
                    _getJsonSaveData(excelData: string | any[], itemSheet: { name: any; sheet: any; }, isClient: any) {
                        let title = excelData[0];
                        let desc = excelData[1];
                        let target = excelData[2];
                        let ret = null;
                        let useFormat1 = false;
                        if (useFormat1) {
                            let saveData1 = [];// 格式1:对应的为数组
                            for (let i = 3; i < excelData.length; i++) {
                                let lineData = excelData[i];
                                if (lineData.length < title.length) {
                                    continue;
                                } else if (lineData.length > title.length) {
                                    continue;
                                }
    
                                let saveLineData:{[key: string]: string;}= {};
                                let canExport = false;
                                for (let j = 0; j < title.length; j++) {
                                    if (!title[j]) {
                                        // 遇到空列直接break，后续的数据不处理
                                        break;
                                    }
                                    canExport = false;
                                    if (isClient && target[j].indexOf('c') !== -1) {
                                        canExport = true;
                                    } else if (!isClient && target[j].indexOf('s') !== -1) {
                                        canExport = true;
                                    }
                                    if (canExport) {
                                        let key = title[j];
                                        let value = lineData[j];
                                        if (value === undefined) {
                                            value = "";
                                        }
                                        // this._addLog("" + value);
                                        saveLineData[key] = value;
                                    }
                                }
    
                                canExport = false;
                                if (isClient && target[0].indexOf('c') !== -1) {
                                    canExport = true;
                                } else if (!isClient && target[0].indexOf('s') !== -1) {
                                    canExport = true;
                                }
                                if (canExport) {
                                    saveData1.push(saveLineData);
                                }
                            }
                            ret = saveData1;
                        } else {
                            let saveData2:{[key: string]: any;} = {};// 格式2:id作为索引
                            for (let i = 3; i < excelData.length; i++) {
                                let lineData = excelData[i];
                                if (lineData.length !== title.length) {
                                    this._addLog(`配置表头和配置数据不匹配:${itemSheet.name} - ${itemSheet.sheet} : 第${i + 1}行`);
                                    this._addLog("跳过该行数据");
                                    continue;
                                }
    
                                let saveLineData:{[key: string]: string;} = {};
                                let canExport = false;
    
                                // todo 将ID字段也加入到data中
                                for (let j = 0; j < title.length; j++) {
                                    if (!title[j]) {
                                        // 遇到空列直接break，后续的数据不处理
                                        break;
                                    }
                                    canExport = false;
                                    if (isClient && target[j] && target[j].indexOf('c') !== -1) {
                                        canExport = true;
                                    } else if (!isClient && target[j] && target[j].indexOf('s') !== -1) {
                                        canExport = true;
                                    }
                                    if (canExport) {
                                        let key = title[j];
                                        let value = lineData[j];
                                        if (value === undefined) {
                                            value = "";
                                        }
                                        // this._addLog("" + value);
                                        saveLineData[key] = value;
                                    }
                                }
    
                                canExport = false;
                                if (isClient && target[0] && target[0].indexOf('c') !== -1) {
                                    canExport = true;
                                } else if (!isClient && target[0] && target[0].indexOf('s') !== -1) {
                                    canExport = true;
                                }
                                if (canExport) {
                                    saveData2[lineData[0].toString()] = saveLineData;
                                }
                            }
                            ret = saveData2;
                        }
                        return ret;
                    },
                    // 生成配置
                    onBtnClickGen() {
                        console.log("onBtnClickGen");
                        // 参数校验
                        if (this.excelArray.length <= 0) {
                            this._addLog("未发现要生成的配置!");
                            return;
                        }
    
                        if (this.isMergeJson) {
                            if (!this.jsonAllCfgFileName || this.jsonAllCfgFileName.length <= 0) {
                                this._addLog("请输入要保存的json文件名!");
                                return;
                            }
                        }
                        if (this.isMergeJavaScript) {
                            if (!this.jsFileName || this.jsFileName.length <= 0) {
                                this._addLog("请输入要保存的js文件名!");
                                return;
                            }
                        }
                        // TODO
                        if (this.isExportServer === false && this.isExportClient === false) {
                            this._addLog("请选择要导出的目标!");
                            return;
                        }
    
                        if (this.isExportJson === false && this.isExportJs === false) {
                            this._addLog("请选择要导出的类型!");
                            return;
                        }
    
    
                        this.logView = "";
                        // 删除老的配置
                        let jsonSavePath1 = join(this.jsonSavePath, dirClientName);
                        let jsonSavePath2 = join(this.jsonSavePath, dirServerName);
                        fs.emptyDirSync(jsonSavePath1);
                        fs.emptyDirSync(jsonSavePath2);
    
                        let jsSavePath1 = join(this.jsSavePath, dirClientName);
                        let jsSavePath2 = join(this.jsSavePath, dirServerName);
                        fs.emptyDirSync(jsSavePath1);
                        fs.emptyDirSync(jsSavePath2);
    
                        let jsonAllSaveDataClient:{[key: string]: any;} = {};// 保存客户端的json数据
                        let jsonAllSaveDataServer:{[key: string]: any;} = {};// 保存服务端的json数据
    
                        let jsAllSaveDataClient:{[key: string]: any;} = {};// 保存客户端的js数据
                        let jsAllSaveDataServer:{[key: string]: any;} = {};// 保存服务端的js数据
    
                        for (let k in this.excelArray) {
                            let itemSheet = this.excelArray[k];
                            if (itemSheet.isUse) {
                                let excelData = nodeXlsx.parse(itemSheet.fullPath);
    
                                let sheetData: string | any[] | null = null;
                                for (let j in excelData) {
                                    if (excelData[j].name === itemSheet.sheet) {
                                        sheetData = excelData[j].data;
                                    }
                                }
                                if (sheetData) {
                                    if (sheetData.length > 3) {
                                        if (this.isExportJson) {
                                            // 保存为json
                                            let writeFileJson =  (pathSave: any, isClient: any) => {
                                                let jsonSaveData = this._getJsonSaveData(sheetData, itemSheet, isClient);
                                                if (Object.keys(jsonSaveData).length > 0) {
                                                    if (this.isMergeJson) {
                                                        if (isClient) {
                                                            // 检测重复问题
                                                            if (jsonAllSaveDataClient[itemSheet.sheet] === undefined) {
                                                                jsonAllSaveDataClient[itemSheet.sheet] = jsonSaveData;
                                                            } else {
                                                                this._addLog("发现重名sheet:" + itemSheet.name + "(" + itemSheet.sheet + ")");
                                                            }
                                                        } else {
                                                            // 检测重复问题
                                                            if (jsonAllSaveDataServer[itemSheet.sheet] === undefined) {
                                                                jsonAllSaveDataServer[itemSheet.sheet] = jsonSaveData;
                                                            } else {
                                                                this._addLog("发现重名sheet:" + itemSheet.name + "(" + itemSheet.sheet + ")");
                                                            }
                                                        }
                                                    } else {
                                                        let saveFileFullPath = join(pathSave, itemSheet.sheet + ".json");
                                                        this._onSaveJsonCfgFile(jsonSaveData, saveFileFullPath);
                                                    }
                                                }
                                            };
                                            if (this.isExportClient) writeFileJson(jsonSavePath1, true);
                                            if (this.isExportServer) writeFileJson(jsonSavePath2, false);
                                        }
                                        if (this.isExportJs) {
                                            // 保存为js
                                            let writeFileJs =  (savePath: any, isClient: any) => {
                                                console.log("this = ", this);
                                                console.log(this._getJavaScriptSaveData);
                                                let sheetJsData = this._getJavaScriptSaveData(sheetData, itemSheet, isClient);
                                                if (Object.keys(sheetJsData).length > 0) {
                                                    if (this.isMergeJavaScript) {
                                                        if (isClient) {
                                                            // 检测重复问题
                                                            if (jsAllSaveDataClient[itemSheet.sheet] === undefined) {
                                                                jsAllSaveDataClient[itemSheet.sheet] = sheetJsData;
                                                            } else {
                                                                this._addLog("发现重名sheet:" + itemSheet.name + "(" + itemSheet.sheet + ")");
                                                            }
                                                        } else {
                                                            // 检测重复问题
                                                            if (jsAllSaveDataServer[itemSheet.sheet] === undefined) {
                                                                jsAllSaveDataServer[itemSheet.sheet] = sheetJsData;
                                                            } else {
                                                                this._addLog("发现重名sheet:" + itemSheet.name + "(" + itemSheet.sheet + ")");
                                                            }
                                                        }
                                                    } else {
                                                        // 保存js配置
                                                        let fileNameFullPath = join(savePath, itemSheet.sheet + ".js");
                                                        this._onSaveJavaScriptCfgFile(fileNameFullPath, sheetJsData, itemSheet.sheet);
                                                    }
                                                }
                                            };
                                            if (this.isExportClient) writeFileJs(jsSavePath1, true);
                                            if (this.isExportServer) writeFileJs(jsSavePath2, false);
                                        }
                                    } else {
                                        this._addLog("行数低于3行,无效sheet:" + itemSheet.sheet);
                                    }
                                } else {
                                    this._addLog("未发现数据");
                                }
    
                            } else {
                                console.log("忽略配置: " + itemSheet.fullPath + ' - ' + itemSheet.sheet);
                            }
                        }
                        // =====================>>>>  合并json文件   <<<=================================
                        if (this.isExportJson && this.isMergeJson) {
                            if (this.isExportClient) {
                                let saveFileFullPath = join(jsonSavePath1, this.jsonAllCfgFileName + ".json");
                                this._onSaveJsonCfgFile(jsonAllSaveDataClient, saveFileFullPath);
                            }
                            if (this.isExportServer) {
                                let saveFileFullPath = join(jsonSavePath2, this.jsonAllCfgFileName + ".json");
                                this._onSaveJsonCfgFile(jsonAllSaveDataServer, saveFileFullPath);
                            }
                            this.checkJsonAllCfgFileExist();
                        }
                        // =====================>>>>  合并js文件   <<<=================================
                        if (this.isExportJs && this.isMergeJavaScript) {
                            if (this.isExportClient) {
                                this._onSaveJavaScriptCfgFile(join(jsSavePath1, this.jsFileName + ".js"), jsAllSaveDataClient, this.jsFileName);
                            }
                            if (this.isExportServer) {
                                this._onSaveJavaScriptCfgFile(join(jsSavePath2, this.jsFileName + ".js"), jsAllSaveDataServer, this.jsFileName);
                            }
    
                            this.checkJsFileExist();
                        }
    
                        this._addLog("全部转换完成!");
                    },
                    _addLog(str: string) {
                        let time = new Date();
                        // this.logView = "[" + time.toLocaleString() + "]: " + str + "\n" + this.logView;
                        this.logView += "[" + time.toLocaleString() + "]: " + str + "\n";
                        this.logListScrollToBottom();
                    },
                    _watchDir(event: any, filePath: string) {
                        return;
                        console.log("监控文件....");
                        console.log(event, filePath);
                        let ext = path.extname(filePath);
                        if (ext === ".xlsx" || ext === ".xls") {
                            this._onAnalyzeExcelDirPath(this.excelRootPath);
                        }
                    },
                    onBtnClickSelectExcelRootPath() {
                        Editor.Dialog.select({
                            title: "选择Excel的根目录",
                            path: projectPath,
                            type: 'directory',
                        }).then(res=>{
                            let dir = res.filePaths[0];
                            if (dir !== this.excelRootPath) {
                                this.excelRootPath = dir;
                                chokidar.watch(this.excelRootPath).on('all', this._watchDir.bind(this));
                                this._onAnalyzeExcelDirPath(dir);
                                this._saveConfig();
                            }
                        }).catch(err=>{
                            console.log(err)
                        })
                    },
                    onBtnClickOpenExcelRootPath() {
                        if (fs.existsSync(this.excelRootPath)) {
                            Electron.shell.showItemInFolder(this.excelRootPath);
                            Electron.shell.beep();
                        } else {
                            this._addLog("目录不存在：" + this.excelRootPath);
                        }
                    },
                    onBtnClickFreshExcel() {
                        this._onAnalyzeExcelDirPath(this.excelRootPath);
                    },
                    // 查找出目录下的所有excel文件
                    _onAnalyzeExcelDirPath(dir: string) {
                        let self = this;
    
                        // let dir = path.normalize("D:\\proj\\CocosCreatorPlugins\\doc\\excel-killer");
                        if (dir) {
                            // 查找json文件
                            let allFileArr: string[] = [];
                            let excelFileArr = [];
                            // 获取目录下所有的文件
                            readDirSync(dir);
                            // 过滤出来.xlsx的文件
                            for (let k in allFileArr) {
                                let file = allFileArr[k];
                                let extName = path.extname(file);
                                if (extName === ".xlsx" || extName === ".xls") {
                                    excelFileArr.push(file);
                                } else {
                                    this._addLog("不支持的文件类型: " + file);
                                }
                            }
    
                            this.excelFileArr = excelFileArr;
                            // 组装显示的数据
                            let excelSheetArray = [];
                            let sheetDuplicationChecker:{[key: string]: any;} = {};//表单重名检测
                            for (let k in excelFileArr) {
                                let itemFullPath = excelFileArr[k];
                                // this._addLog("excel : " + itemFullPath);
    
                                let excelData = nodeXlsx.parse(itemFullPath);
                                //todo 检测重名的sheet
                                for (let j in excelData) {
                                    let itemData = {
                                        isUse: true,
                                        fullPath: itemFullPath,
                                        name: "name",
                                        sheet: excelData[j].name
                                    };
                                    itemData.name = itemFullPath.substr(dir.length + 1, itemFullPath.length - dir.length);
    
                                    if (excelData[j].data.length === 0) {
                                        this._addLog("[Error] 空Sheet: " + itemData.name + " - " + itemData.sheet);
                                        continue;
                                    }
    
                                    if (sheetDuplicationChecker[itemData.sheet]) {
                                        //  重名sheet问题
                                        this._addLog("[Error ] 出现了重名sheet: " + itemData.sheet);
                                        this._addLog("[Sheet1] " + sheetDuplicationChecker[itemData.sheet].fullPath);
                                        this._addLog("[Sheet2] " + itemFullPath);
                                        this._addLog("请仔细检查Excel-Sheet!");
                                    } else {
                                        sheetDuplicationChecker[itemData.sheet] = itemData;
                                        excelSheetArray.push(itemData);
                                    }
                                }
                            }
                            this.excelArray = excelSheetArray;
                            function readDirSync(dirPath: any) {
                                let dirInfo = fs.readdirSync(dirPath);
                                for (let i = 0; i < dirInfo.length; i++) {
                                    let item = dirInfo[i];
                                    let itemFullPath = join(dirPath, item);
                                    let info = fs.statSync(itemFullPath);
                                    if (info.isDirectory()) {
                                        // this._addLog('dir: ' + itemFullPath);
                                        readDirSync(itemFullPath);
                                    } else if (info.isFile()) {
                                        let headStr = item.substr(0, 2);
                                        if (headStr === "~$") {
                                            self._addLog("检索到excel产生的临时文件:" + itemFullPath);
                                        } else {
                                            allFileArr.push(itemFullPath);
                                        }
                                        // this._addLog('file: ' + itemFullPath);
                                    }
                                }
                            }
                        }
                    },
                    onBtnClickSelectSheet(event: any) {
                        let b = event.currentTarget.value;
                        console.log(event);
                        for (let k in this.excelArray) {
                            this.excelArray[k].isUse = b;
                        }
                    },
                    onBtnClickIsExportJson() {
                        this.isExportJson = !this.isExportJson;
                        this._saveConfig();
                    },
                    onBtnClickIsExportJs() {
                        this.isExportJs = !this.isExportJs;
                        this._saveConfig();
                    },
                    onBtnClickExportClient() {
                        this.isExportClient = !this.isExportClient;
                        this._saveConfig();
                    },
                    onBtnClickExportServer() {
                        this.isExportServer = !this.isExportServer;
                        this._saveConfig();
                    },
                    _onSaveJsonCfgFile(data: any, saveFileFullPath: fs.PathOrFileDescriptor) {
                        let str = this._dealArrayAndMap(data);
                        if (this.isFormatJson) {
                            str = jsonBeautifully(str);
                        }
                        fs.writeFileSync(saveFileFullPath, str);
                        this._addLog("[Json]:" + saveFileFullPath);
                    },
                    _dealArrayAndMap(data: any) {
                        let s = JSON.stringify(data);
                        s = s.replace(/\:\"\[/g, ":[");
                        s = s.replace(/\]\"/g, "]");
                        s = s.replace(/\:\"\{/g, ":{");
                        s = s.replace(/\}\"/g, "}");
                        return s;
                    },
                    _getJavaScriptSaveData(excelData: string | any[], itemSheet: { name: string; sheet: string; }, isClient: any) {
                        let title = excelData[0];
                        let desc = excelData[1];
                        let target = excelData[2];
                        let sheetFormatData:{[key: string]: any;}= {};
                        for (let i = 3; i < excelData.length; i++) {
                            let lineData = excelData[i];
                            if (lineData.length === 0) {
                                // 空行直接跳过
                                continue;
                            } else {
                                if (lineData.length < title.length) {
                                    this._addLog("[Error] 发现第" + i + "行缺少字段,跳过该行数据配置.");
                                    continue;
                                } else if (lineData.length > title.length) {
                                    this._addLog("[Error] 发现第" + i + "行多余字段,跳过该行数据配置.");
                                    continue;
                                }
                            }
                            let saveLineData:{[key: string]: string;}= {};
                            let canExport = false;
                            for (let j = 1; j < title.length; j++) {
                                if (!title[j]) {
                                    // 遇到空列直接break，后续的数据不处理
                                    break;
                                }
                                canExport = false;
                                if (isClient && target[j].indexOf('c') !== -1) {
                                    canExport = true;
                                } else if (!isClient && target[j].indexOf('s') !== -1) {
                                    canExport = true;
                                }
                                if (canExport) {
                                    let key = title[j];
                                    let value = lineData[j];
                                    if (value === undefined) {
                                        value = "";
                                        this._addLog("[Error] 发现空单元格:" + itemSheet.name + "*" + itemSheet.sheet + " => (" + key + "," + (i + 1) + ")");
                                    }
                                    saveLineData[key] = value;
                                }
                            }
    
                            canExport = false;
                            if (isClient && target[0].indexOf('c') !== -1) {
                                canExport = true;
                            } else if (!isClient && target[0].indexOf('s') !== -1) {
                                canExport = true;
                            }
                            if (canExport) {
                                sheetFormatData[lineData[0].toString()] = saveLineData;
                            }
                        }
                        return sheetFormatData;
                    },
                    _onSaveJavaScriptCfgFile(saveFileFullPath: fs.PathOrFileDescriptor, jsSaveData: any, jsFileName: string) {
                        let str = this._dealArrayAndMap(jsSaveData);
                        // TODO 保证key的顺序一致性
                        let saveStr = "module.exports = " + str + ";";
                        if (this.isFormatJsCode) {// 保存为格式化代码
                            let ast = uglifyJs.parse(saveStr);
                            let ret = uglifyJs.minify(ast, {
                                output: {
                                    beautify: true,//如果希望得到格式化的输出，传入true
                                    indent_start: 0,//（仅当beautify为true时有效） - 初始缩进空格
                                    indent_level: 4,//（仅当beautify为true时有效） - 缩进级别，空格数量
                                }
                            });
                            if (ret.error) {
                                this._addLog('error: ' + ret.error.message);
                            } else if (ret.code) {
                                fs.writeFileSync(saveFileFullPath, ret.code);
                                this._addLog("[JavaScript]" + saveFileFullPath);
                            } else {
                                this._addLog(JSON.stringify(ret));
                            }
                        } else {// 保存为单行代码
                            fs.writeFileSync(saveFileFullPath, saveStr);
                            this._addLog("[JavaScript]" + saveFileFullPath);
                        }
                        // 移动到客户端目录
                        if (!fs.existsSync(clientJsPath)) {
                            fs.mkdirSync(clientJsPath);
                        }
                        this.copyFileSync(saveFileFullPath, path.join(clientJsPath, jsFileName + '.js'));
                    },
                    copyFileSync(srcFile: fs.PathLike, destFile: fs.PathLike) {
                        var BUF_LENGTH = 64 * 1024
                        var buff = new Buffer(BUF_LENGTH)
                        var fdr = fs.openSync(srcFile, 'r')
                        var fdw = fs.openSync(destFile, 'w')
                        var bytesRead = 1
                        var pos = 0
    
                        while (bytesRead > 0) {
                            bytesRead = fs.readSync(fdr, buff, 0, BUF_LENGTH, pos)
                            fs.writeSync(fdw, buff, 0, bytesRead)
                            pos += bytesRead
                        }
                        fs.closeSync(fdr);
                        fs.closeSync(fdw);
                    },
                    onBtnClickOpenJsSavePath() {
                        let saveFileFullPath1 = path.join(this.jsSavePath, dirClientName);
                        let saveFileFullPath2 = path.join(this.jsSavePath, dirServerName);
                        if (fs.existsSync(saveFileFullPath1)) {
                            Electron.shell.openPath(saveFileFullPath1);
                            Electron.shell.beep();
                        } else if (fs.existsSync(saveFileFullPath2)) {
                            Electron.shell.openPath(saveFileFullPath2);
                            Electron.shell.beep();
                        } else {
                            // this._addLog("目录不存在：" + this.resourceRootDir);
                            this._addLog("目录不存在:" + saveFileFullPath1 + ' or:' + saveFileFullPath2);
                            return;
                        }
                    },
                    onBtnClickMergeJavaScript() {
                        this.isMergeJavaScript = !this.isMergeJavaScript;
                        this._saveConfig();
                    },
                    onJsFileNameChanged() {
                        this._saveConfig();
                    },
                    onBtnClickOpenJsFile() {
                        let saveFileFullPath1 = path.join(this.jsSavePath, dirClientName, this.jsFileName + ".js");
                        let saveFileFullPath2 = path.join(this.jsSavePath, dirServerName, this.jsFileName + ".js");
                        if (fs.existsSync(saveFileFullPath1)) {
                            Electron.shell.openPath(saveFileFullPath1);
                            Electron.shell.beep();
                        } else if (fs.existsSync(saveFileFullPath2)) {
                            Electron.shell.openPath(saveFileFullPath2);
                            Electron.shell.beep();
                        } else {
                            // this._addLog("目录不存在：" + this.resourceRootDir);
                            this._addLog("目录不存在:" + saveFileFullPath1 + ' or:' + saveFileFullPath2);
                        }
                    },
                },
            });
            app.mount(this.$.app);
        }
    },
    beforeClose() { },
    close() { },
});
