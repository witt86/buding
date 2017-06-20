import {indexOf} from 'lodash';

let scriptLoaded = [];

const withjQuery = (callback) => {
    if (!(window.jQuery)) {
        var js = document.createElement('script');
        js.setAttribute('src', 'http://apps.bdimg.com/libs/jquery/2.1.4/jquery.min.js');
        js.setAttribute('type', 'text/javascript');
        js.onload = js.onreadystatechange = function() {
            if (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete') {
                if (callback && typeof callback === "function") {
                    callback();
                }
                js.onload = js.onreadystatechange = null;
            }
        };
        document.getElementsByTagName('head')[0].appendChild(js);
    }else {
        if (callback && typeof callback === "function") {
            callback();
        }
    }
}

const withScriptURL = (fileurl, callback) => {
    if(indexOf(scriptLoaded, fileurl)!=-1){
        callback();
        return;
    }

    var js = document.createElement('script');
    js.setAttribute('src', fileurl);
    js.setAttribute('type', 'text/javascript');
    js.onload = js.onreadystatechange = function () {
        if (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete') {
            if (callback && typeof callback === "function") {
                scriptLoaded.push(fileurl);
                callback();
            }
            js.onload = js.onreadystatechange = null;
        }
    };
    document.getElementsByTagName('head')[0].appendChild(js);
};

export const showQrCode = (callback)=> {
    withjQuery(() => {
            withScriptURL("/javascripts/jquery-weui.min.js", ()=> {
                withScriptURL("/javascripts/qrcode.min.js", ()=> {
                    callback();
                });
            });
        }
    );
};