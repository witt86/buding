import  _config from './../../config.js';
import * as DataModel from './../model/DataModel';

export const  resetWeixinMenu= async ()=>{
    let result=await global.wechat_api.getGroupsAsync();
    return result;
}

export const  createLimitQRCode= async (scene_id)=>{
    try{
        let createQRCode=await global.wechat_api.createLimitQRCodeAsync(scene_id);
        let url="";
        if (createQRCode){
            url=await global.wechat_api.showQRCodeURL(createQRCode.ticket);
        }
        console.info(url);
        return url;
    }catch(e){
        console.log('--------createLimitQRCode:e--------');
        console.log(e);
        throw e;
    }
}

export const createTmpQRCode=async (scene_id)=>{
    try{
        let createQRCode=await global.wechat_api.createTmpQRCodeAsync(scene_id,604700);
        let url="";
        if (createQRCode){
            url=await global.wechat_api.showQRCodeURL(createQRCode.ticket);
        }
        console.info(url);
        return url;
    }catch(e){
        console.log('--------createLimitQRCode:e--------');
        console.log(e);
        throw e;
    }
};

export const  SendInviteMsgLink= async (openid,inviteid)=>{
    try{
        const url=_config.sitehost+`/guest/sellerregister?inviteid=${ inviteid }`;
        const seller=await DataModel.Seller.findOne({ where:{ reguserId:inviteid }});
        const msg= "<a href='" + url + "'>您接受" + seller.TrueName + "的邀请加入爱游购,点击加入吧</a>";
        const sendResult= await  global.wechat_api.sendTextAsync(openid,msg);
        console.log('send weixin msg on SendInviteMsgLink ...result:');
        console.log(sendResult);
    }catch(e){
        console.log('--------SendInviteMsgLink:e--------');
        console.log(e);
        throw e;
    }
}

export const  SendAttentionShopMsg= async (openid,shopcode)=>{
    try{
        const url=_config.sitehost;
        const saleshop=await DataModel.SaleShop.findOne({ where:{ code:shopcode },include:DataModel.Seller });
        const msg= "<a href='" + url + "'>您扫描了" + saleshop.seller.TrueName + "向导的二维码, 来观摩一下他的店铺吧</a>";
        const sendResult= await  global.wechat_api.sendTextAsync(openid,msg);
        console.log('send weixin msg on SendAttentionShopMsg ...result:');
        console.log(sendResult);
    }catch(e) {
        console.log(`--------SendAttentionShopMsg:e (openid=${openid},shopcode=${shopcode})--------`);
        console.log(e);
        throw e;
    }
}
