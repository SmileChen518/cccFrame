
import { _decorator, Component, Node, director, instantiate, assetManager } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = NewComponent
 * DateTime = Sat Oct 16 2021 16:38:22 GMT+0800 (中国标准时间)
 * Author = 洞房不败
 * FileBasename = NewComponent.ts
 * FileBasenameNoExtension = NewComponent
 * URL = db://assets/script/scene/NewComponent.ts
 * ManualUrl = https://docs.cocos.com/creator/3.3/manual/en/
 *
 */
 
@ccclass('Hall')
export class Hall extends Component {
    @property(Node)
    ndRecharge: Node = null;

    @property(Node)
    ndChangePass: Node = null;

    start () {
        // [3]
    }

    onBack(){
        director.loadScene("Login");
    }

    onRecharge(){
        this.ndRecharge.active = true;
        // assetManager.loadRes("prefab/Recharge", (err:Error, res:any) => {
        //     if(err) {
        //         console.error("load recharge error: ", res);
        //         return;
        //     }
        //     this.node.addChild(instantiate(res));
        // });
    }

    onChangePass(){
        this.ndChangePass.active = true;
    }

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
