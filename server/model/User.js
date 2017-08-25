import * as DataModel from './DataModel';
import TMSProductAPI from '../lib/TMSProductAPI';
import {keys, groupBy} from "lodash";
import md5 from 'md5';
import {delayRun} from "./../util/util";
import * as BusinessEvent from './BusinessEvent';
import _config from './../../config.js';
import crypto from 'crypto';

export const findAndCreateUserFromWeixinAuthor = async(accessTokenInfo)=> {
    try {
        if (!accessTokenInfo)throw "微信accessTokenInfo不允许为空";
        let weixin = accessTokenInfo;
        weixin.nickname=weixin.nickname.replace(/\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]/g, "");////去掉表情字符
        //包含管理员属性
        let olduser = await DataModel.RegUser.findOne({
            where: {"wx_openID": weixin.openid}
        });
        if (!olduser) {
            console.log("准备创建新用户，openid：" + weixin.openid);
            let userRegInfo = {
                ex_id: weixin.openid,
                ex_id_type: 0,
                ex_nick_name: weixin.nickname,
                ex_avatar: weixin.headimgurl
            };
            let regResult = await TMSProductAPI("get_user", userRegInfo);
            console.log("TMS注册结果：" + JSON.stringify(regResult));
            let newUser = await DataModel.RegUser.create({
                uid: regResult.uid,
                wx_openID: weixin.openid,
                userName: weixin.nickname || "",
                headimgurl: weixin.headimgurl || "",
                unionid: weixin.openid || ""
            });
            return newUser;
        } else {
            if (!olduser.uid) { //如果这里olduser的uid不存在，表示是用户关注公众号时生成的用户记录，在他浏览我们网页时，补全用户信息即可
                console.log("准备补全关注的用户信息，openid：" + weixin.openid);
                let userRegInfo = {
                    ex_id: weixin.openid,
                    ex_id_type: 0,
                    ex_nick_name: weixin.nickname,
                    ex_avatar: weixin.headimgurl
                };
                let regResult = await TMSProductAPI("get_user", userRegInfo);
                console.log("TMS注册结果：" + JSON.stringify(regResult));
                olduser = await olduser.update({
                    uid: regResult.uid,
                    wx_openID: weixin.openid,
                    userName: weixin.nickname || "",
                    headimgurl: weixin.headimgurl || "",
                    unionid: weixin.unionid || ""
                });
            }
            else if (olduser.uid && olduser.userName == "") {//补全昵称为空的用户信息
                olduser = await olduser.update({
                    wx_openID: weixin.openid,
                    userName: weixin.nickname || "",
                    headimgurl: weixin.headimgurl || ""
                });
            }
            return olduser;
        }
    } catch (e) {
        console.log("findAndCreateUserFromWeixinAuthor:e");
        console.log(e);
        throw e.toString();
    }
};
export const findAndCreateUserFromWeixinOpnId = async(accessTokenInfo)=> {
    try {
        if (!accessTokenInfo)throw "微信accessTokenInfo不允许为空";
        const weixin = accessTokenInfo;
        //包含管理员属性
        let olduser = await DataModel.RegUser.findOne({
            where: {"wx_openID": weixin.openid}
        });
        if (!olduser) {
            console.log("准备创建新用户，openid：" + weixin.openid);
            let newUser = await DataModel.RegUser.create({
                wx_openID: weixin.openid
            });
            return newUser;
        } else return olduser;
    } catch (e) {
        console.log("findAndCreateUserFromWeixinOpnId:e");
        console.log(e);
        throw e.toString();
    }
};
//店主注册
export const ShopkeeperRegister = async({uid, mobile, truename, photo, photoReverse, id_card})=> {
    const reguser = await DataModel.RegUser.findOne({where:{ uid }});
    if (!reguser) throw '指定用户不存在!';
    const wx_openid = reguser.wx_openID;

    if (!truename) throw '姓名不允许为空!';
    if (!mobile) throw '手机号不允许为空!';
    if (!photo || !photoReverse || !id_card) throw '身份证不允许为空!';

    const regResult = await TMSProductAPI("bd_register_shopkeeper", {
        mobile,
        wx_openid,
        truename,
        photo,
        photoReverse,
        id_card,
        uid
    });
    //发送微信通知
    delayRun(async()=> {
        await BusinessEvent.onUserRegister({reguser});
    }, 200, err=> {
        console.error('-----onUserRegister:err----');
        console.error(err);
    });
    return regResult;
};
//店铺注册
export const ShopRegister = async({uid, name, province, city, district, address})=> {
    const reguser = await DataModel.RegUser.findOne({where: {uid}});
    if (!reguser) throw '指定用户不存在!';
    if (!name) throw '店铺名称不允许为空!';
    if (!province) throw '省份不允许为空!';
    if (!city) throw '城市不允许为空';
    if (!district) throw '区县不允许为空';

    //生成随机的店铺号
    const shopcode = Math.random().toFixed(6).replace(".", "") + reguser.id;
    //邀请二维码
    let inviteqrcode;
    try {
        const url=_config.sitehost+`/user/staffInfo?shopcode=${shopcode}&id=${reguser.id}`;
        inviteqrcode = await global.getqrcode(url);
    } catch (err) {
        inviteqrcode = "error";
    }
    let qrcode;
    try {
        const url=_config.sitehost+'/shop/'+shopcode;
        qrcode = await global.getqrcode(url);
    } catch (err) {
        qrcode = "error";
    }
    const regResult = await TMSProductAPI("bd_register_shop", {
        uid,
        name,
        qrcode,
        code:shopcode,
        keeperqrcode:inviteqrcode,
        shopicon:reguser.headimgurl,
        province,
        city,
        district,
        address
    });
    return regResult;
};
//上传身份证件
export const UploadIDCard=async ({ uid,serverId })=>{
    const buffer=await global.wechat_api.getMediaAsync(serverId);
    const url= await global.saveBufferToFile(buffer,"cert");
    return url;
};
//员工注册
export const StaffRegister=async ({ uid,TrueName,mobile,shopcode,pid,role })=>{
     if (!TrueName) throw '真实姓名不允许为空!';
     if (!mobile) throw '手机号不允许为空!';
     if (!shopcode) throw '店铺不允许为空!';
     if (!pid) throw '推荐人允许为空!';

     const reguser=await DataModel.RegUser.findOne({ where:{ uid } });
     if (!reguser) throw '指定用户不存在';

     const result=await TMSProductAPI("bd_register_employee",
         {
             uid,
             mobile,
             wx_openid:reguser.wx_openID,
             truename:TrueName,
             shopcode,
             role,
             pid
         });
     return result;
};
//生成店铺推广码
export const createShopQrcode=async ({ uid,shopcode })=>{
    if (!uid || !shopcode ) throw '指定参数不允许为空!';
    const url=_config.sitehost+'/shop/'+shopcode+`?referrer=${ uid }`;
    let qrcode = await global.getqrcode(url,"base64");
    return qrcode;
};
//生成店铺员工邀请码
export const createShopInviteQrcode=async ({ uid,shopcode })=>{
    if (!uid || !shopcode ) throw '指定参数不允许为空!';
    const reguser=await DataModel.RegUser.findOne({ where:{ uid } });
    if (!reguser) throw '指定用户不存在!';
    const url=_config.sitehost+`/user/staffInfo?shopcode=${shopcode}&id=${reguser.id}`;
    let qrcode = await global.getqrcode(url,"base64");
    return qrcode;
};

