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
        }
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
        }
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
        }
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

export default global.__config_loaded;