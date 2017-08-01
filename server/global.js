import _config from './../config.js';
import * as util from './util/util';
import redis from 'redis';
import fs from 'fs';
import wechatAPI from 'wechat-api';
import WXPay from 'weixin-pay';
import Promise from 'bluebird';
import ext from './wechat/wechat-api-ext.js';
import request from 'request';
import xml2js from 'xml2js';
import path from "path";
import qiniu from 'qiniu';

import qrcode from 'yaqrcode';

Promise.promisifyAll(request);


const _redisClient = global.redisClient = redis.createClient({
    host: _config.redis.host,
    port: _config.redis.port
});

Promise.promisifyAll(_redisClient);
global.redisClient.on("error", function (err) {
    console.error("redisClient .. Error ");
    console.error(err);
});

const tokenKey_forappID = _config.wxconfig.appid + "_wechatapitoken";
const tokenKey_jsTicket_forappID = _config.wxconfig.appid + "_wechatapitoken_jsticket";


wechatAPI.mixin(ext);
global.wechat_api = new wechatAPI(_config.wxconfig.appid, _config.wxconfig.secret, async function (callback) {
    // 传入一个获取全局token的方法
    try {
        let token = await global.redisClient.getAsync(tokenKey_forappID);
        if (token) {
            token = JSON.parse(token);
            const diff = token.expireTime - new Date().getTime();
            console.log("-------------- wechat_api 获取全局token ok:有效期还剩" + diff / 1000 + "ms");
            callback(null, token);
        } else {
            callback(null, null);
        }
    } catch (e) {
        console.error(e);
        callback(null, null);
    }
}, async function (token, callback) {
    try {
        await _redisClient.setAsync(tokenKey_forappID, JSON.stringify(token));
        //redis中缓存的值, 提前10秒失效
        const diff = Math.max(1, Math.floor((token.expireTime - new Date().getTime()) / 1000 - 10));
        console.log(`-------------- wechat_api 设置全局token=${JSON.stringify(token)} ---expire Second=${diff}-------`);
        await global.redisClient.expireAsync(tokenKey_forappID, diff);
        callback(null, true);
    } catch (e) {
        console.error(e);
        callback(e);
    }
});

//api.registerTicketHandle(getTicketToken, saveTicketToken);
global.wechat_api.registerTicketHandle(async(type, callback)=> {
    const cacheKey = type + "_" + tokenKey_jsTicket_forappID;
    try {
        let token = await global.redisClient.getAsync(cacheKey);
        if (token) {
            token = JSON.parse(token);
            const diff = token.expireTime - new Date().getTime();
            console.log("-------------- registerTicketHandle token ok:有效期还剩" + diff / 1000 + "ms");
            callback(null, token);
        } else {
            callback(null, null);
        }
    } catch (err) {
        console.error(err);
        callback(null, null);
    }
}, async(type, _ticketToken, callback)=> {
    const cacheKey = type + "_" + tokenKey_jsTicket_forappID;
    try {
        await _redisClient.setAsync(cacheKey, JSON.stringify(_ticketToken));
        //redis中缓存的值, 提前10秒失效
        const diff = Math.max(1, Math.floor((_ticketToken.expireTime - new Date().getTime()) / 1000 - 10));
        console.log(`-------------- registerTicketHandle saveTicketToken=${JSON.stringify(_ticketToken)} ----expire Second=${diff}--------`);
        await global.redisClient.expireAsync(cacheKey, diff);
        callback(null);
    } catch (err) {
        console.error(err);
        callback(err);
    }
});
Promise.promisifyAll(global.wechat_api);

const clearWeChatData = (data)=> {
    if (!data)return null;
    const copydata = Object.assign({}, data);
    delete copydata.title;
    for (let key of Object.keys(copydata)) {
        let v = copydata[key];
        delete v.name;
        copydata[key] = v;
    }
    return copydata;
}

WXPay.mix('EnterprisePay', async(opts, fn)=> {
    try {
        opts.nonce_str = opts.nonce_str || util.generateNonceString();
        opts.mch_appid = _config.wxconfig.pay.appid;
        opts.mchid = _config.wxconfig.pay.mch_id;
        opts.sign = wxpay.sign(opts);
        console.log("------提现参数-------");
        console.log(opts);
        let query = {
            url: "https://api.mch.weixin.qq.com/mmpaymkttransfers/promotion/transfers",
            method: 'POST',
            form: util.buildXML(opts),
            agentOptions: {
                pfx: wxpay.options.pfx,
                passphrase: wxpay.options.mch_id
            }
        }
        let {body}=await request.postAsync(query);
        let parser = new xml2js.Parser({trim: true, explicitArray: false, explicitRoot: false});
        Promise.promisifyAll(parser);
        let result = await parser.parseStringAsync(body);
        console.log("---------提现结果---------");
        console.log(result);
        return result;
    } catch (e) {
        console.log("---------EnterprisePay:e---------");
        console.log(e);
        throw e;
    }
});

const wxpay = global.wxpay = WXPay({
    appid: _config.wxconfig.pay.appid,
    mch_id: _config.wxconfig.pay.mch_id,
    partner_key: _config.wxconfig.pay.partner_key, //微信商户平台API密钥
    pfx: fs.readFileSync('./apiclient_cert.p12')//微信商户平台证书
});
Promise.promisifyAll(global.wxpay);

global.EnterprisePay = async(partner_trade_no, wx_openID, money)=> {
    let PayParams = {
        partner_trade_no: partner_trade_no,
        openid: wx_openID,
        check_name: 'NO_CHECK',
        amount: money * 100,
        desc: '员工收益提现',
        spbill_create_ip: _config.siteIP
    }
    let PayResult = await global.wxpay.EnterprisePay(PayParams);
    return PayResult;
};

export const initWeixinTokens = async()=> {
    //当pm2运行模式时, 利用NODE_APP_INSTANCE环境变量,让第一个进程实例来清空redis中的token缓存
    const type = "jsapi";
    await _redisClient.delAsync(type + "_" + tokenKey_jsTicket_forappID);
    await _redisClient.delAsync(tokenKey_forappID);
    global.wechat_api.getLatestTicket(async(err, result)=> {
        console.log(`-------------- global.wechat_api.getTicket=${JSON.stringify(result)} --------------`);
    });
    setTimeout(()=> {
        console.dir('-------------- weixin tokens refreshed! -------------- ');
    }, 10000);
};

const saveBufferTo7liu = global.saveBufferTo7liu = (buffer, bucketname, siteurl, key)=> {
    return new Promise((resolve, reject)=> {
        qiniu.conf.ACCESS_KEY = _config.qiniu.ACCESS_KEY;
        qiniu.conf.SECRET_KEY = _config.qiniu.SECRET_KEY;
        const putPolicy = new qiniu.rs.PutPolicy(bucketname);
        const token = putPolicy.token();

        const fileName = "data/" + new Date().getTime() + ".jpg";

        fs.writeFile(fileName, buffer, function (err) {
            if (err) {
                console.error(`保存图片到本地发生错误:${err}`);
                reject(err);
                return;
            }
            console.log(`__dirname:${__dirname}`);
            const filepath = path.join(__dirname, `./../../${fileName}`);
            uploadFile2Qiniu(token, key, filepath, function (err, rethash, retkey, retpersistentId) {
                if (err) {
                    reject(err);
                } else {
                    // fs.unlinkSync(filepath);
                    resolve(siteurl + "/" + key);
                }
            });
        });
    });
};
function uploadFile2Qiniu(token, key, filepath, callback) {
    var extra = new qiniu.io.PutExtra();
    qiniu.io.putFile(token, key, filepath, extra, function (err, ret) {
        if (!err) {
            // 上传成功， 处理返回值
            callback(err, ret.hash, ret.key, ret.persistentId);
        } else {
            // 上传失败， 处理返回代码
            callback(err, null);
        }
    });
};
function createQiniuToken() {
    var bucketname = _config.qiniu.SITE_bucket;
    var putPolicy = new qiniu.rs.PutPolicy(bucketname);
    return putPolicy.token();
};

const saveBufferToFile = global.saveBufferToFile = (buffer,type)=> {
    return new Promise((resolve, reject)=> {
        const fileName = `${ new Date().getTime() }_${type}.jpg`;
        const filePath = `./data/images/${fileName}`;
        fs.writeFile(filePath, buffer, function (err) {
            if (err) {
                console.error(`保存图片到本地发生错误:${err}`);
                reject(err);
                return;
            }
            const url = _config.sitehost + "/" + fileName;
            resolve(url);
        });
    });
};

const getqrcode = global.getqrcode =async (content,type)=> {
    let xqbase64 = qrcode(content, {
        size: 200
    });
    if (type && type=='base64'){
        return xqbase64;
    }
    const url=await base64savetoFile(xqbase64);
    return url;
};
const base64savetoFile = async(base64data)=> {
    const fileName = `${ new Date().getTime() }_qrcode.jpg`;
    const filePath = `./data/images/${fileName}`;
    return new Promise((resolve, reject)=> {
        base64data = base64data.replace(/^data:image\/\w+;base64,/, "");//去掉图片base64码前面部分data:image/png;base64
        let dataBuffer = new Buffer(base64data, 'base64'); //把base64码转成buffer对象，
        fs.writeFile(filePath, dataBuffer, (err)=> {//用fs写入文件
            if (err) {
                console.error('-----err----');
                console.error(err);
                reject(err)
            } else {
                const url = _config.sitehost + "/" + fileName;
                resolve(url);
            }
        })
    });
};


global.fileisExit = (filepath)=> {
    return new Promise((resolve, reject)=> {
        try {
            fs.accessSync(filepath, fs.F_OK);
        } catch (e) {
            resolve(false);
        }
        resolve(true);
    });
};

const errorObj = (code, msg, error)=> {
    const errObj = {code, msg, error};
    console.dir(errObj);
    return errObj;
};
global.errobj = function () {
    if (arguments.length <= 0)return;
    else if (arguments.length == 1) {

        return arguments[0];
    } else if (arguments.length == 2) {
        return errorObj(arguments[0], arguments[1]);
    } else {
        return errorObj(arguments[0], arguments[1], arguments[2]);
    }
}



