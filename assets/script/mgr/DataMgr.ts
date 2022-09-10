/* 存放全局变量 */
var DataMgr = {
    ip: "localhost:8080",
    token: "",
    phone: "",
    passwd: "",
    tNdInfo: [
        {title:"认证全时主节点", desc: "利用云端全时在线挖矿和提供 服务，全程参与账本记录。PoS共识分配对象，提供对网络提供混币交易和快捷交易服务，可以参与投票表决、要求DApp开发、申请服务项目开发，享受发展福利。需要认证，可开设商铺，提供代理资格。"},
        {title:"认证主节点", desc: "利用个人终端在线挖矿和提供服务，记录保存全账本。PoS共识分配对象，提供对网络提供混币交易和快捷交易服务，可以参与投票表决、要求DApp开发、申请服务项目开发，享受发展福利。需要认证，可开设商铺，提供代理资格。"},
        {title:"一般主节点", desc: "利用个人终端在线挖矿和提供服务，记录保存全账本。PoS共识分配对象，提供对网络提供混币交易和快捷交易服务，可以参与投票表决。需要一定数量的数币担保认证，可升级为认证主节点"},
        {title:"次节点", desc: "利用个人终端在线参与挖矿，记录相关账本信息，PoW共识机制分配奖励。需要认证，可开设商铺，可以升级为一般主节点。"},
    ],
    
    //event
    // GUEST_LOGIN: "/guestLogin", //游客登录
    LOGIN: "/login", //手机号登录
    REGISTER: "/register", //注册
    CHANGEPASSWD: "/api/hall/user/changepasswd", //修改密码
    YZM: "/api/yzm", //验证码
    NODEINFO: "/api/hall/home/nodeinfo", //节点信息 
};
export {DataMgr};