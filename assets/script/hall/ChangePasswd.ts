import { _decorator, Component, EditBox, Node, Label, game } from 'cc';
import { DataMgr } from '../mgr/DataMgr';
const { ccclass, property } = _decorator;

@ccclass('ChangePasswd')
export class ChangePasswd extends Component {
    @property(EditBox)
    editOldPassword: EditBox = null!;

    @property(EditBox)
    editNewPassword: EditBox = null!;

    @property(EditBox)
    editNewPasswordA: EditBox = null!;

    @property(Node)
    ndTips: Node = null!;

    start () {
        // Your initialization goes here.
    }

    // update (deltaTime: number) {
    //     // Your update function goes here.
    // }

    onBack(){
        this.node.active = false;
    }

    onSubmit(){
        if (this.editOldPassword.string == "") return this.showTips("密码不能为空");
        if (this.editOldPassword.string != DataMgr.passwd) return this.showTips("密码错误");
        if (this.editOldPassword.string == this.editNewPassword.string) return this.showTips("新旧密码一致");
        if (!(this.editNewPassword.string.length >= 8 && this.editNewPassword.string.length <= 16 && /^[A-Za-z0-9]+$/.test(this.editNewPassword.string))) 
            return this.showTips("请输入8~16位英文和数字！");
        if (this.editNewPassword.string != this.editNewPasswordA.string) return this.showTips("密码不一致");
        // if (this.editAuth.string == "") return this.showTips("验证码不能为空");
        let data = {
            token: DataMgr.token,
            Phone:  DataMgr.phone,
            OldPasswd: this.editOldPassword.string,
            Passwd: this.editNewPassword.string,
            // yzm: this.editAuth.string,
        };
        // let md5 = window ? window.md5 : global.md5;
        // data.Passwd = md5(data.Passwd);
        let self = this;
        game.emit(DataMgr.CHANGEPASSWD, {cmd: DataMgr.CHANGEPASSWD, data, 
            success: function(params: any) {
                self.showTips(params.msg);
                if (params.code == 200) {
                    localStorage.setItem("Passwd", self.editNewPassword.string);
                    DataMgr.passwd = self.editNewPassword.string;
                }
            },
            error: function (params: any) {
                self.showTips(params);
            }
        });
    }

    showTips(s: string){
        let self = this;
        this.unscheduleAllCallbacks();
        this.ndTips.active = true;
        this.ndTips.children[0].getComponent(Label)!.string = s;
        this.scheduleOnce(function () {
            self.ndTips.active = false;
        }, 2);
    }
}
