import DataModel from './DataModel';
import TMSProductAPI from './../util/TMSProductAPI';
import {keys,groupBy} from "lodash";
import md5 from 'md5';

export const findAndCreateUserFromWeixinAuthor=async (accessTokenInfo)=>{
    try {
        if (!accessTokenInfo)throw "微信accessTokenInfo不允许为空";
        const weixin=accessTokenInfo;
        //包含管理员属性
        let olduser= await DataModel.WxUser.findOne({
            where: {"wx_openID": weixin.openid }
        });
        if (!olduser){
            console.log("准备创建新用户，openid："+weixin.openid);
            let userRegInfo={
                ex_id: weixin.openid,
                ex_id_type: 0,
                ex_nick_name: weixin.nickname,
                ex_avatar: weixin.headimgurl
            };
            let regResult=await TMSProductAPI("get_user",userRegInfo);
            console.log("TMS注册结果："+JSON.stringify(regResult));
            let newUser= await DataModel.WxUser.create({
                uid: regResult.uid,
                wx_openID: weixin.openid,
                nickname: weixin.nickname||"",
                headimgurl: weixin.headimgurl||"",
                unionid: weixin.openid||""
            });
            return newUser;
        }else {
            if (!olduser.uid){ //如果这里olduser的uid不存在，表示是用户关注公众号时生成的用户记录，在他浏览我们网页时，补全用户信息即可
                console.log("准备补全关注的用户信息，openid："+weixin.openid);
                let userRegInfo={
                    ex_id: weixin.openid,
                    ex_id_type: 0,
                    ex_nick_name: weixin.nickname,
                    ex_avatar: weixin.headimgurl
                };
                let regResult=await TMSProductAPI("get_user",userRegInfo);
                console.log("TMS注册结果："+JSON.stringify(regResult));
                olduser= await olduser.update({
                    uid: regResult.uid,
                    wx_openID: weixin.openid,
                    nickname: weixin.nickname||"",
                    headimgurl: weixin.headimgurl||"",
                    unionid: weixin.unionid||""
                });
            }
            else if (olduser.uid && olduser.userName==""){//补全昵称为空的用户信息
                olduser= await olduser.update({
                    wx_openID: weixin.openid,
                    nickname: weixin.nickname||"",
                    headimgurl: weixin.headimgurl||""
                });
            }
            return olduser;
        }
    }catch(e) {
        console.log("findAndCreateUserFromWeixinAuthor:e");
        console.log(e);
        throw e.toString();
    }
};

export const findAndCreateUserFromWeixinOpnId=async (accessTokenInfo)=>{
    try {
        if (!accessTokenInfo)throw "微信accessTokenInfo不允许为空";
        const weixin=accessTokenInfo;
        //包含管理员属性
        let olduser= await DataModel.WxUser.findOne({
            where: {"wx_openID": weixin.openid }
        });
        if (!olduser){
            console.log("准备创建新用户，openid："+weixin.openid);
            let newUser= await DataModel.WxUser.create({
                wx_openID: weixin.openid
            });
            return newUser;
        }else return olduser;
    }catch(e) {
        console.log("findAndCreateUserFromWeixinOpnId:e");
        console.log(e);
        throw e.toString();
    }
};