export class FuncMgr {

    static isJson(str:string):boolean{
        if ( /^\s*$/.test(str))
            return false;
        str = str.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@');
        str = str.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']');
        str = str.replace(/(?:^|:|,)(?:\s*\[)+/g, '');
        return (/^[\],:{}\s]*$/).test(str);
    }

    static getTime():String{
        let s = "[";
        let now = new Date();
        let hh = now.getHours();
        let mm = now.getMinutes();
        let ss = now.getSeconds();
        if (hh < 10) s+='0';
        s+=hh+":";
        if (mm < 10) s+="0";
        s+=mm+":";
        if (ss < 10) s+="0";
        s+=ss+"]";
        return s;
    }
}
