import * as DataModel from "./DataModel";
import _config from "./../../config.js";
import {delayRun} from "./../util/util";
import moment from "moment";
import  * as types  from './../constants';
import TMSProductAPI from "../lib/TMSProductAPI";
const weixin_templateId=require("./../../weixin_template_map.json")[_config.wxconfig.appid];

export const onInformCheckShopkeeper=async ({ uid })=>{
   if (!uid) throw '指定参数不允许为空!';
   const reguser=await DataModel.RegUser.findOne({ where:{ uid } });
   if (!reguser) throw '无效的用户账户!';

   const CheckShopkeeper=weixin_templateId.CheckShopkeeper;
   const shopkeeper=await TMSProductAPI("bd_get_shopkeeper",{ uid });

   const wx_openId=shopkeeper.wx_openid;
   const checkstatus=shopkeeper.state;

   let checkText="";
   if (checkstatus==0){
       checkText='您好，您的审核请求状态为待审核，请耐心等待审核结果!';
   }else if (checkstatus==1){
       checkText='您好，您的审核请求已通过，欢迎使用!';
   }else {
       checkText=`您好，您的审核请求未通过-${ shopkeeper.rejectmessage?shopkeeper.rejectmessage:'' }`;
   }
   const templatedata = {
        "title":"注册审核通知",
        "first": {
            "value":checkText,
            "color": "#EF4F4F"
        },
        "keyword1": {
            "value": shopkeeper.truename,
            "name":"用户名",
            "color": "#EF4F4F"
        },
        "keyword2": {
            "value": shopkeeper.mobile,
            "name":"手机号",
            "color": "#EF4F4F"
        },
        "keyword3": {
            "value": moment().format("MM-DD hh:mm"),
            "name":"时间",
            "color": "#EF4F4F"
        },
        "remark": {
            "value": "点击查看详情！",
            "color": "#EF4F4F"
        }
    };
    const url=_config.sitehost+'/user/requestAwaiting';
    delayRun(async ()=>{
        let result2 = await global.wechat_api.sendTemplateAsync(wx_openId, CheckShopkeeper, url, templatedata);
        console.log(result2);
    },30,e=>{
        console.error("给店主发送审核结果通知:err");
        console.error(e);
    });
    return 'ok';
};

export const onInformTmsDelProduct=async ({ productcode })=>{
    await DataModel.ProductSource.destroy({ where:{ sourceCode:productcode },force: true });
    return 'ok';
};
