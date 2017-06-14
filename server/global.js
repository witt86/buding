import redis from 'redis';
import Promise from 'bluebird';
import wechatAPI from 'wechat-api';
import WXPay from 'weixin-pay';
import request from 'request';
import xml2js from 'xml2js';
import fs from 'fs';
import _config from './../config.js';
import {getValue, setValue} from './model/AppGlobal';
import ext from './wechat/wechat-api-ext.js';
Promise.promisifyAll(request);

global.appsetting = {
    set:async (key, value)=> {
        setValue({uid: -99, key, value: JSON.stringify(value)});
    },
    get:async (key)=> {
        const avalue = await getValue({uid: -99, key});
        if (!avalue)
            return null;
        return JSON.parse(avalue.propValue);
    }
};

const redisClient = global.redisClient = redis.createClient({
    host:_config.redis.host,
    port:_config.redis.port
});

Promise.promisifyAll(redisClient);
global.redisClient.on("error", function (err) {
    console.error("redisClient .. Error ");
    console.error( err );
});

const tokenKey_forappID = _config.wxconfig.appid + "_wechatapitoken";
const tokenKey_jsTicket_forappID = _config.wxconfig.appid + "_wechatapitoken_jsticket";

wechatAPI.mixin( ext );
global.wechat_api=new wechatAPI(_config.wxconfig.appid, _config.wxconfig.secret, async function (callback) {
    // 传入一个获取全局token的方法
    try {
        let token= await global.redisClient.getAsync(tokenKey_forappID);
        if (token) {
            token = JSON.parse(token);
            const diff = token.expireTime - new Date().getTime();
            console.log("-------------- wechat_api 获取全局token ok:有效期还剩" + diff/1000 + "ms");
            callback(null, token);
        } else {
            callback(null, null);
        }
    }catch (e) {
        console.error(e);
        callback(null, null);
    }
},async function (token, callback) {
    try {
        await redisClient.setAsync(tokenKey_forappID, JSON.stringify(token));
        //redis中缓存的值, 提前10秒失效
        const diff = Math.max(1, Math.floor((token.expireTime - new Date().getTime())/1000-1800));
        console.log(`-------------- wechat_api 设置全局token=${JSON.stringify(token)} ---expire Second=${diff}-------`);
        await global.redisClient.expireAsync(tokenKey_forappID, diff);
        callback(null, true);
    }catch (e) {
        console.error(e);
        callback(e);
    }
});

//api.registerTicketHandle(getTicketToken, saveTicketToken);
global.wechat_api.registerTicketHandle(async (type, callback)=>{
    const cacheKey = type+"_"+tokenKey_jsTicket_forappID;
    try{
        let token= await global.redisClient.getAsync(cacheKey);
        if (token) {
            token = JSON.parse(token);
            const diff = token.expireTime - new Date().getTime();
            console.log("-------------- registerTicketHandle token ok:有效期还剩" + diff / 1000 + "ms");
            callback(null, token);
        } else {
            callback(null, null);
        }
    }catch (err) {
        console.error(err);
        callback(null, null);
    }
}, async (type, _ticketToken, callback)=>{
    const cacheKey = type+"_"+tokenKey_jsTicket_forappID;
    try {
        await redisClient.setAsync(cacheKey, JSON.stringify(_ticketToken));
        //redis中缓存的值, 提前10秒失效
        const diff = Math.max(1, Math.floor((_ticketToken.expireTime - new Date().getTime())/1000 -10 ));
        console.log(`-------------- registerTicketHandle saveTicketToken=${JSON.stringify(_ticketToken)} ----expire Second=${diff}--------`);
        await global.redisClient.expireAsync(cacheKey, diff);
        callback(null);
    } catch (err) {
        console.error(err);
        callback(err);
    }
});
Promise.promisifyAll(global.wechat_api);

const clearWeChatData=(data)=>{
    if (!data)return null;
    const copydata=Object.assign({},data);
    delete copydata.title;
    for (let key of Object.keys(copydata)){
        let v=copydata[key];
        delete v.name;
        copydata[key]=v;
    }
    return copydata;
};

global.wechat_api.sendTemplateAsyncCopy=global.wechat_api.sendTemplateAsync;
global.wechat_api.sendTemplateAsync=async (openid,templateId,url,data)=>{
    if (!openid||!templateId||!data)throw '参数不允许为空!';
    const senddata=clearWeChatData(data);//清洗字段

    let result=  await  global.wechat_api.sendTemplateAsyncCopy(openid,templateId,url,senddata); //客户消息推送
    return result;
};

WXPay.mix('EnterprisePay', async (opts,fn)=>{
    try{
        opts.nonce_str = opts.nonce_str || util.generateNonceString();
        opts.mch_appid=_config.wxconfig.pay.appid;
        opts.mchid=_config.wxconfig.pay.mch_id;
        opts.sign = wxpay.sign(opts);
        console.log("------提现参数-------");
        console.log(opts);
        let query= {
            url: "https://api.mch.weixin.qq.com/mmpaymkttransfers/promotion/transfers",
            method: 'POST',
            form: util.buildXML(opts),
            agentOptions: {
                pfx: wxpay.options.pfx,
                passphrase: wxpay.options.mch_id
            }
        };
        let {body}=await request.postAsync(query);
        let parser = new xml2js.Parser({ trim:true, explicitArray:false, explicitRoot:false });
        Promise.promisifyAll(parser);
        let result =await parser.parseStringAsync(body);
        console.log("---------提现结果---------");
        console.log(result);
        return result;
    }catch(e){
        console.log("---------EnterprisePay:e---------");
        console.log(e);
        throw e;
    }
});

export const initWeixinTokens = async ()=> {
    //当pm2运行模式时, 利用NODE_APP_INSTANCE环境变量,让第一个进程实例来清空redis中的token缓存
    const type = "jsapi";
    await redisClient.delAsync(type + "_" + tokenKey_jsTicket_forappID);
    await redisClient.delAsync(tokenKey_forappID);
    global.wechat_api.getLatestTicket(async(err, result)=> {
        console.log(`-------------- global.wechat_api.getTicket=${JSON.stringify(result)} --------------`);
    });
    setTimeout(()=> {
        console.dir('-------------- weixin tokens refreshed! -------------- ');
    }, 10000);
}