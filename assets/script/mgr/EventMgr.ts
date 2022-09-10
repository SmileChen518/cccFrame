
import { _decorator, Component, Node } from 'cc';
import { DataMgr } from './DataMgr';
import { FuncMgr } from './FuncMgr';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = NetMgr
 * DateTime = Sun Oct 24 2021 18:47:35 GMT+0800 (中国标准时间)
 * Author = 洞房不败
 * FileBasename = NetMgr.ts
 * FileBasenameNoExtension = NetMgr
 * URL = db://assets/script/mgr/NetMgr.ts
 * ManualUrl = https://docs.cocos.com/creator/3.3/manual/en/
 *
 */

let url = "http://192.168.50.67:8000";
 
@ccclass('NetMgr')
export class NetMgr extends Component {
    // [1]
    // dummy = '';

    // [2]
    // @property
    // serializableDummy = 0;

    start () {
        // [3]
    }

    onEnable () {
        this.node.on(DataMgr.LOGIN, this.httpGetRequest, this);
        // game.on(DataMgr.LOGIN, httpGetRequest, this);
        // game.on(DataMgr.REGISTER, httpGetRequest);
        // game.on(DataMgr.CHANGEPASSWD, httpGetRequest);
        // game.on(DataMgr.YZM, getYZM);
        // game.on(DataMgr.NODEINFO, httpGetRequest);
    }

    onDisable () {
        this.node.off(DataMgr.LOGIN, this.httpGetRequest, this);
    }

    httpGetRequest = (option: any)=>{
        console.log("httpGetRequest ", option);
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                let response = xhr.responseText;
                console.log(option.cmd+":Getresponse = ", response);
                if (FuncMgr.isJson(xhr.responseText)) {
                    response = JSON.parse(response);
                }
                if (xhr.status === 200) {
                    option.success && option.success(response);
                } else {
                    option.error && option.error(response);
                }
            }
        }
    
        //超时时间，如果没有默认为8秒
        xhr.timeout = option.timeout || 8*1000;
        //超时的回调函数，如果没有默认走error
        xhr.ontimeout = () => {
            console.log("请求超时:" + JSON.stringify(option));
            option.error && option.error('网络连接超时');
        }
    
        //拦截错误，默认走error
        xhr.onerror = () => {
            console.log('拦截错误', JSON.stringify(option));
            option.error && option.error("请检查网络");
        }
        var requestUrl = (option.url || url)  + option.cmd;
        option.data = option.data || {};
        let formData = [];
        for (let key in option.data) {
            formData.push(''.concat(key, '=', encodeURIComponent(option.data[key])));
        }
        requestUrl += '?' + formData.join('&');
        xhr.open("GET", requestUrl , true);
        // if (sys.os == sys.OS_IOS) {
        //     xhr.setRequestHeader('User-Agent', 'Mozilla/5.0 (NATIVE_ios_v)(iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1');
        // } else if (sys.os == sys.OS_ANDROID) {
        //     xhr.setRequestHeader('User-Agent', 'Mozilla/5.0 (NATIVE_Android_v)(Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Mobile Safari/537.36');
        // }
        xhr.send();
        
        console.log('[GET]url', requestUrl, 'data', JSON.stringify(option.data));
    }

    // update (deltaTime: number) {
    //     // [4]
    // }
}
