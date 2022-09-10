
import { _decorator, Component, Node, EditBox, Label, director, game } from 'cc';
import { DataMgr } from '../mgr/DataMgr';
import { Http } from '../net/Http';
// import {hex_md5} from "md5";
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = NewComponent
 * DateTime = Sat Oct 16 2021 15:17:57 GMT+0800 (中国标准时间)
 * Author = 洞房不败
 * FileBasename = NewComponent.ts
 * FileBasenameNoExtension = NewComponent
 * URL = db://assets/script/NewComponent.ts
 * ManualUrl = https://docs.cocos.com/creator/3.3/manual/en/
 *
 */
 
@ccclass('Login')
export class Login extends Component {
    @property(Node)
    ndLogin: Node = null;

    @property(Node)
    ndRegister: Node = null;

    @property(Node)
    ndDown: Node = null;

    @property(Node)
    ndProto: Node = null;

    @property(Node)
    ndBack: Node = null;

    @property(Node)
    ndTips: Node = null;

    @property(Label)
    labTitle: Label = null;

    @property(EditBox)
    editPhone: EditBox = null;

    @property(EditBox)
    editPassword: EditBox = null;

    @property(EditBox)
    editPhone2: EditBox = null;

    @property(EditBox)
    editPassword2: EditBox = null;

    @property(EditBox)
    editYZM: EditBox = null;

    
    start () {
        this.initCanvas();
        this.initParas();
        this.initEvent();
        this.initShow();

        let phone = localStorage.getItem("Phone");
        let passwd = localStorage.getItem("Passwd");
        if (phone && passwd) {
            this.editPhone.string = phone;
            this.editPassword.string = passwd;
            console.log("login = ", phone, passwd);
        }
    }

    initCanvas(){
        // let canvas = this.node.getComponent(cc.Canvas);
        // let size = canvas.designResolution;
        // let cSize = cc.view.getFrameSize();
        // let bSpView = false;
        // if (cc.sys.os == cc.sys.OS_IOS){ //刘海屏判断
        //     bSpView = (cSize.width == 414 && cSize.height == 896)||(cSize.width == 375 && cSize.height == 812);
        // }
        // if (bSpView){
        //     canvas.fitWidth = true;
        //     canvas.fitHeight = true;
        // }else if (cSize.width/cSize.height >= size.width/size.height){
        //     canvas.fitWidth = false;
        //     canvas.fitHeight = true;
        // }else{
        //     canvas.fitWidth = true;
        //     canvas.fitHeight = false;
        // }
    }

    initParas(){

    }

    initEvent(){

    }

    initShow(){
        
    }

    showTips(s){
        let self = this;
        this.unscheduleAllCallbacks();
        this.ndTips.active = true;
        this.ndTips.children[0].getComponent(Label)!.string = s;
        this.scheduleOnce(function () {
            self.ndTips.active = false;
        }, 2);
    }

    onLogin(){
        if (/^1[3456789]\d{9}$/.test(this.editPhone.string)) {
            if (this.editPhone.string == "") return this.showTips("手机号不能为空");
            // if (this.editAuth.string == "") return this.showTips("验证码不能为空");
            if (this.editPassword.string == "") return this.showTips("密码不能为空");
            if (!(this.editPassword.string.length >= 8 && this.editPassword.string.length <= 16 && /^[A-Za-z0-9]+$/.test(this.editPassword.string))) 
                return this.showTips("请输入8~16位英文和数字！");
            let data = {
                Phone: this.editPhone.string,
                Passwd: this.editPassword.string,
            };
            // let md5 = window ? window.md5 : global.md5;s
            // data.Passwd = md5(data.Passwd);
            // cc.sys.localStorage.setItem(key, value);
            let self = this;
            Http.httpGetRequest({cmd: DataMgr.LOGIN, data,
                success: function(params: any) {
                    self.showTips(params.msg);
                    if (params.code == 200) {
                        localStorage.setItem("Phone", self.editPhone.string);
                        localStorage.setItem("Passwd", self.editPassword.string);
                        DataMgr.phone = self.editPhone.string;
                        DataMgr.passwd = self.editPassword.string;
                        if (params.data && params.data.token) DataMgr.token = params.data.token;
                        director.loadScene("Hall");
                    }
                },
                error: function (params: any) {
                    self.showTips(params);
                }
            });
            console.log(123);
        }else this.showTips("请输入正确的手机号");
    }

    onTextRegister(){
        this.changeTo("注册账号");
    }
    
    onForgetPass(){
        game.emit(DataMgr.LOGIN, {cmd: DataMgr.LOGIN});
    }

    onBack(){
        this.changeTo("登陆");
    }

    onRegister(){
        if (/^1[3456789]\d{9}$/.test(this.editPhone2.string)) {
            if (this.editPhone2.string == "") return this.showTips("手机号不能为空");
            // if (this.editYZM.string == "") return this.showTips("验证码不能为空");
            if (this.editPassword2.string == "") return this.showTips("密码不能为空");
            if (!(this.editPassword2.string.length >= 8 && this.editPassword2.string.length <= 16 && /^[A-Za-z0-9]+$/.test(this.editPassword2.string))) 
                return this.showTips("请输入8~16位英文和数字！");
            let data = {
                Phone:this.editPhone2.string,
                Passwd:this.editPassword2.string,
                // yzm: this.editAuth.string,
            };
            // let md5 = window ? window.md5 : global.md5;
            // data.Passwd = md5(data.Passwd);
            let self = this;
            Http.httpGetRequest({cmd: DataMgr.REGISTER, data, 
                success: function(params: any) {
                    self.showTips(params.msg);
                    if (params.code == 200) {
                        localStorage.setItem("Phone", self.editPhone.string);
                        localStorage.setItem("Passwd", self.editPassword.string);
                        DataMgr.phone = self.editPhone.string;
                        DataMgr.passwd = self.editPassword.string;
                        if (params.data && params.data.token) DataMgr.token = params.data.token;
                        director.loadScene("Hall");
                    }
                },
                error: function (params: any) {
                    self.showTips(params);
                }
            });
        }else this.showTips("请输入正确的手机号");
    }

    onYZM(){
        game.emit(DataMgr.YZM, {params:123});
        // let timeLine = 60;
        // lab.node.active = true;
        // lab.string = '60秒后获取';
        // img.active = false;
        // lab.node.runAction(cc.repeat(cc.sequence(
        //     cc.callFunc(function () {
        //         timeLine--;
        //         if (timeLine <= 0) {
        //             lab.string = '';
        //             this._bAuthable = true;
        //             img.active = true;
        //         } else {
        //             lab.string = timeLine + '秒后获取';
        //         }
        //     }.bind(this)),
        //     cc.delayTime(1)
        // ), 60))
    }

    changeTo(str){
        let b = str == "注册账号" ? false : true;
        this.ndLogin.active = b;
        this.ndDown.active = b;
        this.ndRegister.active = !b;
        this.ndProto.active = !b;
        this.labTitle.string = str;
        this.ndBack.active = !b;
    }

    // initAccountList(){
    //     let jsonStr = cc.sys.localStorage.getItem('account_array');
    //     if (!jsonStr) return;
    //     let tObj = JSON.parse(jsonStr);
    //     console.log('查看obj',JSON.stringify(tObj));
    //     let item = this.ndItem;
    //     for (let i = 0; i < tObj.length; i++) {
    //         const obj = tObj[i];
    //         if (i > 0){
    //             item = cc.instantiate(this.ndItem);
    //             item.parent = this.ndItem.parent;
    //         }
    //         item.active = true;
    //         item.getChildByName("phone").getComponent(cc.Label).string = obj.account;
    //         // this.input.addBtn(this.node, item.getComponent("login"), "Login2", "onLoginOK", obj);
    //     }
    // }

    // update (deltaTime: number) {
    //     // [4]
    // }
}

/**
 * [1] Class member could be defined like this.
 * [2] Use `property` decorator if your want the member to be serializable.
 * [3] Your initialization goes here.
 * [4] Your update function goes here.
 *
 * Learn more about scripting: https://docs.cocos.com/creator/3.3/manual/en/scripting/
 * Learn more about CCClass: https://docs.cocos.com/creator/3.3/manual/en/scripting/ccclass.html
 * Learn more about life-cycle callbacks: https://docs.cocos.com/creator/3.3/manual/en/scripting/life-cycle-callbacks.html
 */
