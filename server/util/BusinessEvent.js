import _config from "./../../config.js";
import {merge} from "lodash";

//网站启动事件,限定一台运行
export  const  OnWebSiteStartEvent=async (app)=> {
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
        data = merge(data, {R_createMenu: createmenu});
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