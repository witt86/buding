import moment from "moment";
import _config from './../../config.js';
import * as DataModel from "./DataModel";
import TMSProductAPI from "../lib/TMSProductAPI";
import {merge,reduce} from "lodash";
import {RenderJSONTemplate,showDayAndTime, delayRun,entitiestoUtf16} from "./../util/util";
const weixin_templateId=require("./../../weixin_template_map.json")[_config.wxconfig.appid];
import * as types from './../constants';

//网站启动事件,限定一台运行
export const  OnWebSiteStartEvent=async ()=> {
    resetWeixinMenu();
};

//重置微信菜单
export const resetWeixinMenu=async ()=> {
    try {
        //移除菜单
        let removeMenu = await global.wechat_api.removeMenuAsync();
        let data = {R_removeMenu: removeMenu};
        console.log("----------移除菜单结果-------------");
        console.log(JSON.stringify(data));
        //创建默认组自定义菜单
        let menuDefault = require("./../../menu_default.json");
        menuDefault = JSON.parse(JSON.stringify(menuDefault).replace(/(\{hostname\})/igm, _config.sitehost));
        const createmenu = await global.wechat_api.createMenuAsync(menuDefault);
        data = merge(data,{ R_createMenu: createmenu });
        console.log("----------创建默认组自定义菜单结果-------------");
        console.log(JSON.stringify(data));
        //获得最终菜单创建结果
        const getMenu = await global.wechat_api.getMenuAsync();
        data = merge(data, {R_getMenu: getMenu});
        console.log("----------最终菜单创建结果-------------");
        console.log(JSON.stringify(data));
        return data;
    } catch (e) {
        console.log("--------resetWeixinMenu:e--------");
        console.log(e);
        throw e;
    }
};

export const onOrderPaySuccess= async (orderID)=>{
    try{
        //1.给供应商发送付款成功通知
        //const templateId1 =weixin_templateId.RemindShiping;
        // URL置空，则在发送后,点击模板消息会进入一个空白页面（ios）, 或无法点击（android）
       // const templateurl = _config.sitehost + "/suppliermanage/ordersummary/" + buyment.orderID ;
        // {{first.DATA}}
        // 订单金额：{{keyword1.DATA}}
        // 商品详情：{{keyword2.DATA}}
        // 收货信息：{{keyword3.DATA}}
        // {{remark.DATA}}
        // const templatedata = {
        //     "title":"发货提醒",
        //     "first": {
        //         "value": user_buyer.userName + " 下单并支付成功，请及时发货",
        //         "color": "#EF4F4F"
        //     },
        //     "keyword1": {
        //         "value": buyment.amount + "元",
        //         "color": "#EF4F4F",
        //         "name":"订单金额"
        //     },
        //     "keyword2": {
        //         "value": product.name +(buyitems.length>1?" -等":""),
        //         "color": "#EF4F4F",
        //         "name":"商品详情"
        //     },
        //     "keyword3": {
        //         "value": "<详见订单>",
        //         "color": "#EF4F4F",
        //         "name":"收货信息"
        //     },
        //     "remark": {
        //         "value": "点击查看订单及快速发货！",
        //         "color": "#EF4F4F"
        //     }
        // };
        // delayRun(async ()=>{
        //     const supplierAcount=await DataModel.SupplierAccount.findAll({ where:{code:{$like:`%${supplier.code}%`}}});
        //     if (supplierAcount&&supplierAcount.length>0) {
        //         for (let  item of supplierAcount){
        //             try {
        //                 await global.wechat_api.sendTemplateAsync(item.wx_openID, templateId1, templateurl, templatedata);
        //             }catch (e){
        //                 console.error(`send weixin msg 给供应商${item.code}-${item.wx_openID}发游客付款成功通知:err${e}`);
        //                 continue;
        //             }
        //         }
        //     }else throw "供货商没有绑定微信账号";
        // },30,e=>{ console.error("send weixin msg 给供应商发游客付款成功通知:err");console.error(e); });
    } catch (err) {
        console.error("onUserCancelPayedOrder...err ");
        console.error(err);
    }
};

export const onUserRegister=async ({ reguser })=>{

};