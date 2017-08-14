const config = {
    "development":{
        version: "1.0",
        cookieSecret:'buding',
        redis: {
            host: "127.0.0.1",
            port: 6379
        },
        mysql: {
            host: "127.0.0.1",
            port: "3306",
            user: "root",
            password: "1q2w3e",
            charset: "utf8m64_general_ci",
            database: "buding"
        },
        siteIP: "114.55.87.183",
        sitehost: "http://abuhome.podinns.com/",
        officialShopcode:"01442494",
        thmall: {
            apiURL: "http://test.tmonkey.cn:8001/tms-api/",
            secret: "......",
            resourceRoot: "http://test.tmonkey.cn:8001"
        },
        wxconfig: {
            appid: "wx3e37a71515f5b412",
            secret: "aa9816351b7606a584178f547a2113d5",
            token: "lkjsadoiuqwr87zvcnkljhqwr8asd",
            encodingAESKey: "KOnGAMW692QXW5e6SjyRuiXFBtuJjMUKIXlJ3HskZq7",
            isProductionAppID: false,
            pay: {
                appid: "wx27cc67276705db51",
                mch_id: "1316943601",
                partner_key: "u2Cd8d7040Ee6e1e5a8EDe43e765f5Z6",
                notify_url: "{sitehost}/wxpay_notify/pay"
            }
        },
        jsApiList: ["checkJsApi", "openAddress" ,'chooseImage','uploadImage','downloadImage',"onMenuShareTimeline", "onMenuShareAppMessage", "onMenuShareQQ", "onMenuShareWeibo", "hideMenuItems", "showMenuItems","scanQRCode"]
    },
    "test":{
        version: "1.0",
        cookieSecret:'buding',
        redis: {
            host: "127.0.0.1",
            port: 6379
        },
        mysql: {
            host: "127.0.0.1",
            port: "3306",
            user: "root",
            password: "1q2w3e",
            charset: "utf8m64_general_ci",
            database: "buding"
        },
        siteIP: "114.55.87.183",
        sitehost: "http://test2.itravelbuy.twohou.com",
        officialShopcode:"01442494",
        thmall: {
            apiURL: "http://test.tmonkey.cn:8001/tms-api/",
            secret: "......",
            resourceRoot: "http://test.tmonkey.cn:8001"
        },
        wxconfig: {
            appid: "wx3e37a71515f5b412",
            secret: "aa9816351b7606a584178f547a2113d5",
            token: "lkjsadoiuqwr87zvcnkljhqwr8asd",
            encodingAESKey: "KOnGAMW692QXW5e6SjyRuiXFBtuJjMUKIXlJ3HskZq7",
            isProductionAppID: false,
            pay: {
                appid: "wx27cc67276705db51",
                mch_id: "1316943601",
                partner_key: "u2Cd8d7040Ee6e1e5a8EDe43e765f5Z6",
                notify_url: "{sitehost}/wxpay_notify/pay"
            }
        },
        jsApiList: ["checkJsApi", "openAddress" ,'chooseImage','uploadImage','downloadImage',"onMenuShareTimeline", "onMenuShareAppMessage", "onMenuShareQQ", "onMenuShareWeibo", "hideMenuItems", "showMenuItems","scanQRCode"]
    },
    "production":{
        version: "1.0",
        cookieSecret:'buding',
        redis: {
            host: "127.0.0.1",
            port: 6379
        },
        mysql: {
            host: "127.0.0.1",
            port: "3306",
            user: "root",
            password: "1q2w3e",
            charset: "utf8m64_general_ci",
            database: "buding"
        },
        siteIP: "114.55.87.183",
        sitehost: "http://itravelbuy.twohou.com",
        officialShopcode:"01442494",
        thmall: {
            apiURL: "http://tms.twohou.com:8001/tms-api/",
            secret: "......",
            resourceRoot: "http://static.itravelbuy.twohou.com"
        },
        wxconfig: {
            appid: "wx3e37a71515f5b412",
            secret: "aa9816351b7606a584178f547a2113d5",
            token: "lkjsadoiuqwr87zvcnkljhqwr8asd",
            encodingAESKey: "KOnGAMW692QXW5e6SjyRuiXFBtuJjMUKIXlJ3HskZq7",
            isProductionAppID: false,
            pay: {
                appid: "wx27cc67276705db51",
                mch_id: "1316943601",
                partner_key: "u2Cd8d7040Ee6e1e5a8EDe43e765f5Z6",
                notify_url: "{sitehost}/wxpay_notify/pay"
            }
        },
        jsApiList: ["checkJsApi", "openAddress" ,'chooseImage','uploadImage','downloadImage',"onMenuShareTimeline", "onMenuShareAppMessage", "onMenuShareQQ", "onMenuShareWeibo", "hideMenuItems", "showMenuItems","scanQRCode"]
    }
};

const env_name = process.env.NODE_ENV||"development";
console.warn("loading config for  ..... " + env_name);

if(typeof window =="object"){
    throw "警告：服务器端config配置无法被引入在客户端脚本中";
}

if(typeof global.__config_loaded == "undefined") {
    global.__config_loaded = config[env_name];
}

module.exports =  global.__config_loaded;