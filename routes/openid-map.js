import { Router } from 'express';
import {merge} from 'lodash';
import * as types from './../server/constants';

const router = new Router();

const addNewOpenIDMap = async ({user,openid})=> {
    let openIDsMap = await global.redisClient.getAsync("openid-map");
    if (!openIDsMap)openIDsMap = [];
    else {
        openIDsMap = JSON.parse(openIDsMap);
    }
    if (user && openid) {
        let s = {
            "name": "",
            "dev": user.wx_openID,
            "product": openid
        }
        openIDsMap.push(s);
        // openIDsMap = uniqBy(openIDsMap,"dev")
        await global.redisClient.setAsync("openid-map", JSON.stringify(openIDsMap));
        console.log(`openid-map[] =${await global.redisClient.getAsync("openid-map")}`);
    }
}
router.all('*',async (req,res)=>{
    if(process.env.NODE_ENV == 'development') {
        if(!req.query.releaseopenid){
            console.log(`跳转到正式环境去获取openid。。。。。`);
            let backurl = req.protocol + "://" + req.hostname+":"+process.env.PORT + req.originalUrl;
            console.log(`--backurl:${backurl}--`);
            res.redirect(`http://itravelbuy.twohou.com/openid-map?action=tellme&backurl=${backurl}`);
        }else {
            const queryInfo = {
                user: req.session.user,
                openid: req.query.releaseopenid
            };
            await addNewOpenIDMap(queryInfo);
            let buttons = [
                {url: 'http://test2.itravelbuy.twohou.com/user/userRegister', title: '开始测试'}
            ];
            res.alert(types.ALERT_SUCCESS, "支付环境准备OK", "",buttons);
        }
    }else {
        if (req.query.backurl) {
            res.redirect(`${req.query.backurl}?releaseopenid=${req.session.user.wx_openID}`);
        } else {
            res.alert(types.ALERT_WARN, "却少回跳url参数", "");
        }
    }
});

export default router;