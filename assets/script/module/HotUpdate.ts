import { Component, Label, ProgressBar, sys, _decorator } from 'cc';
const { ccclass, property } = _decorator;

//本地manifest文件内容
let uirlFile = "http://127.0.0.1/QPFrame/"
let customManifestStr = JSON.stringify({
    "packageUrl":uirlFile,
    "remoteManifestUrl":uirlFile + "project.manifest",
    "remoteVersionUrl":uirlFile + "version.manifest",
    "version":"1.0.0",
    "assets":{},
    "searchPaths":[]
});

@ccclass('HotUpdate')
export class HotUpdate extends Component {

    @property(Node)
    retryBtn: Node = null;

    @property(Label)
    info: Label = null;

    @property(Label)
    fileLabel: Label = null;

    @property(Label)
    byteLabel: Label = null;

    @property(ProgressBar)
    fileProgress: ProgressBar = null;

    @property(ProgressBar)
    byteProgress: ProgressBar = null;

    _am: any;
    cnt: number = 0;

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        // Hot update is only available in Native build
        if (!sys.isNative) {
            // this.node.active = false;
            return;
        }
        let storagePath = ((jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + 'blackjack-remote-asset');
        console.log('Storage path for remote asset : ' + storagePath);

        // Setup your own version compare handler, versionA and B is versions in string
        // if the return value greater than 0, versionA is greater than B,
        // if the return value equals 0, versionA equals to B,
        // if the return value smaller than 0, versionA is smaller than B.
        let versionCompareHandle = function (versionA, versionB) {
            console.log("JS Custom Version Compare: version A is " + versionA + ', version B is ' + versionB);
            var vA = versionA.split('.');
            var vB = versionB.split('.');
            for (var i = 0; i < vA.length; ++i) {
                var a = parseInt(vA[i]);
                var b = parseInt(vB[i] || 0);
                if (a === b) {
                    continue;
                }
                else {
                    return a - b;
                }
            }
            if (vB.length > vA.length) {
                return -1;
            }
            else {
                return 0;
            }
        };

        // Init with empty manifest url for testing custom manifest
        this._am = new jsb.AssetsManager('', storagePath, versionCompareHandle);

        // Setup the verification callback, but we don't have md5 check function yet, so only print some message
        // Return true if the verification passed, otherwise return false
        let self = this;
        this._am.setVerifyCallback(function (path, asset) {
            // When asset is compressed, we don't need to check its md5, because zip file have been deleted.
            var compressed = asset.compressed;
            // Retrieve the correct md5 value.
            var expectedMD5 = asset.md5;
            // asset.path is relative path and path is absolute.
            var relativePath = asset.path;
            // The size of asset file, but this value could be absent.
            var size = asset.size;
            if (compressed) {
                // self.info.string = "Verification passed : " + relativePath;
                return true;
            }
            else {
                // self.info.string = "Verification passed : " + relativePath + ' (' + expectedMD5 + ')';
                return true;
            }
        });

        this.info.string = 'Hot update is ready, please check or directly update.';

        // if (sys.os === sys.OS_ANDROID) {
        //     // Some Android device may slow down the download process when concurrent tasks is too much.
        //     // The value may not be accurate, please do more test and find what's most suitable for your game.
        //     this._am.setMaxConcurrentTask(2);
        //     this.info.string = "Max concurrent tasks count have been limited to 2";
        // }
        
        this.fileProgress.progress = 0;
        this.byteProgress.progress = 0;

        //自动检测更新
        if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
            this._am.loadLocalManifest(new jsb.Manifest(customManifestStr, storagePath), storagePath);
        }
        if (!this._am.getLocalManifest() || !this._am.getLocalManifest().isLoaded()) {
            this.info.string = 'Failed to load local manifest ...';
            return;
        }
        this._am.setEventCallback(this.checkCb.bind(this));
        this._am.checkUpdate();
    }

    start () {
        // this.retryBtn.on("click", function (argument) {
        //     this.retryBtn.active = false;
            
        //     this.info.string = 'Retry failed Assets...';
        //     this._am.downloadFailedAssets();
        // }, this);
        // cc.find("close", this.node).on("click", function (argument) {
        //     this.node.active = false;
        // }, this);
    }

    // update (dt) {}

    checkCb =(event)=> {
        console.log('checkCb Code: ' + event.getEventCode());
        switch (event.getEventCode())
        {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST://0
                this.info.string = "No local manifest file found, hot update skipped.";
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST://1
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST://2
                this.info.string = "Fail to download manifest file, hot update skipped.";
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE://4
                this.info.string = "Already up to date with the latest remote version.";
                this.node.active = false;
                break;
            case jsb.EventAssetsManager.NEW_VERSION_FOUND://3
                this.info.string = 'New version found, please try to update.';
                this.fileProgress.progress = 0;
                this.byteProgress.progress = 0;
                //自动更新
                this._am.setEventCallback(this.updateCb.bind(this));
                this._am.update();
                return;
            default:
                return;
        }
        
        this._am.setEventCallback(null);
    }

    updateCb =(event)=> {
        console.log('updateCb Code: ' + event.getEventCode());
        var needRestart = false;
        var failed = false;
        switch (event.getEventCode())
        {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST: //0
                this.info.string = 'No local manifest file found, hot update skipped.';
                failed = true;
                break;
            case jsb.EventAssetsManager.UPDATE_PROGRESSION://5
                this.byteProgress.progress = event.getPercent();
                this.fileProgress.progress = event.getPercentByFile();

                this.fileLabel.string = event.getDownloadedFiles() + ' / ' + event.getTotalFiles();
                this.byteLabel.string = event.getDownloadedBytes() + ' / ' + event.getTotalBytes();

                var msg = event.getMessage();
                if (msg) {
                    this.info.string = 'Updated file: ' + msg;
                }
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST://1
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST://2
                this.info.string = 'Fail to download manifest file, hot update skipped.';
                failed = true;
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE://4
                this.info.string = 'Already up to date with the latest remote version.';
                failed = true;
                break;
            case jsb.EventAssetsManager.UPDATE_FINISHED://8
                this.info.string = 'Update finished. ' + event.getMessage();
                needRestart = true;
                break;
            case jsb.EventAssetsManager.UPDATE_FAILED://9
                this.info.string = 'Update failed. ' + event.getMessage();
                // this.retryBtn.active = true;
                break;
            case jsb.EventAssetsManager.ERROR_UPDATING://7
                this.info.string = 'Asset update error: ' + event.getAssetId() + ', ' + event.getMessage();
                break;
            case jsb.EventAssetsManager.ERROR_DECOMPRESS://10
                this.info.string = event.getMessage();
                break;
            default:
                break;
        }

        if (failed) {
            this._am.setEventCallback(null);
            console.log("failed");
        }

        if (needRestart) {
            console.log("needRestart");
            this._am.setEventCallback(null);
            // Prepend the manifest's search path
            var searchPaths = jsb.fileUtils.getSearchPaths();
            var newPaths = this._am.getLocalManifest().getSearchPaths();
            console.log("a:"+JSON.stringify(newPaths));
            Array.prototype.unshift.apply(searchPaths, newPaths);
            console.log(JSON.stringify(searchPaths));
            // This value will be retrieved and appended to the default search path during game startup,
            // please refer to samples/js-tests/main.js for detailed usage.
            // !!! Re-add the search paths in main.js is very important, otherwise, new scripts won't take effect.
            // cc.sys.localStorage.setItem('HotUpdateSearchPaths', JSON.stringify(searchPaths));
            jsb.fileUtils.setSearchPaths(searchPaths);

            console.log(222);
            // cc.audioEngine.stopAll();
            // cc.game.restart();
            //不重启测试可行
            this.node.active = false;
        }
    }
}
