import {Router} from "express";
import TMSProductAPI from './../server/lib/TMSProductAPI';
import * as DataModel from './../server/model/DataModel';
import * as types from './../server/constants';
const router = new Router();

router.all("*", async(req, res, next)=> {
    if (!req.session.user) {
        const msg = "请先登录!";
        if (req.xhr) {
            res.json({err: msg, result: ""});
        } else {
            res.alert(types.ALERT_WARN, msg, " ");
        }
        return;
    }
    next();
});

router.get('/mine', async(req, res, next) => {
    try {
        let rs = {};
        const user = req.session.user;
        const {shopcode}=req.query;
        const reguser = await DataModel.RegUser.findOne({where: {uid: user.uid}});
        const orderListWaitPay = await TMSProductAPI("query_orders", {uid: user.uid, status: 0});

        rs.title = '我的布丁';
        rs.shopcode = shopcode;
        rs.reguser = reguser;
        rs.orderListWaitPay = orderListWaitPay;

        res.render('user/mine', rs);
    } catch (e) {
        console.error('-----e:/shopHome-----');
        console.error(e);
    }
});

router.get('/userRegister', async(req, res, next) => {
    try {
        let rs = {};
        rs.title = '布丁商城';
        const user = req.session.user;

        res.render('user/userRegister', rs);
    } catch (e) {
        console.error('-----e:/userRegister-----');
        console.error(e);
    }
});

router.get('/ownerInfo', async(req, res, next) => {
    let rs = {};
    try {
        rs.title = '店主注册';
        const user = req.session.user;
        const shopkeeper = await TMSProductAPI("bd_get_shopkeeper", {uid: user.uid});
        if (shopkeeper) {
            let stateText = "";
            if (shopkeeper.state == 0) {
                stateText = "待审核";
            } else if (shopkeeper.state == 1) {
                stateText = "审核通过";
            } else {
                stateText = "审核不通过";
            }

            let buttons = shopkeeper.state == 1 ? [
                {
                    url: "/user/shopRegister",
                    title: "去开店"
                }
            ] : [];

            let msg = `已注册店主,状态:${ stateText }`;
            res.alert(types.ALERT_WARN, msg, " ", buttons);
        } else {
            res.render('user/ownerInfo', rs);
        }
    } catch (e) {
        console.error('-----e:/ownerInfo-----');
        console.error(e);
        res.render('user/ownerInfo', rs);
    }
});

router.get('/staffInfo', async(req, res, next) => {
    try {
        let {shopcode, id}=req.query;
        let rs = {};
        const shopInfo = await TMSProductAPI('bd_get_saleshop', {code: shopcode});
        rs.shopInfo = shopInfo;
        const reguser = await DataModel.RegUser.findOne({where: {id}});
        rs.reguser = reguser;
        rs.title = '员工注册';
        res.render('user/staffInfo', rs);
    } catch (e) {
        console.error('-----e:/staffInfo-----');
        console.error(e);
    }
});

router.get('/shopmanage', async(req, res, next)=> {
    try {
        res.render('/user/shopmanage', rs);
    } catch (e) {

    }
});

router.get('/requestAwaiting', async(req, res, next) => {
    try {
        let rs = {};
        rs.title = '店主注册';
        const user = req.session.user;
        const shopkeeper = await TMSProductAPI("bd_get_shopkeeper", {uid: user.uid});
        rs.shopkeeper = shopkeeper;
        if (shopkeeper.state == 0) {
            res.render('user/requestAwaiting', rs);
        } else if (shopkeeper.state == 1) {
            res.render('user/requestReceived', rs);
        } else {
            res.alert(types.ALERT_WARN, "您的店主身份审核不通过!", " ");
        }
    } catch (e) {
        console.error('-----e:/requestAwaiting-----');
        console.error(e);
        res.alert(types.ALERT_WARN, e, " ");
    }
});

router.get('/requestReceived', async(req, res, next) => {
    try {
        let rs = {};

        rs.title = '布丁商城';

        res.render('user/requestReceived', rs);
    } catch (e) {
        console.error('-----e:/requestReceived-----');
        console.error(e);
        res.alert(types.ALERT_WARN, e, " ");
    }
});

router.get('/shopRegister', async(req, res, next)=> {
    try {
        let rs = {};
        rs.title = '店铺注册';
        res.render('user/shopRegister', rs);
    } catch (e) {
        console.error('-----e:/requestReceived-----');
        console.error(e);
        res.alert(types.ALERT_WARN, e, " ");
    }
});

router.get('/shopRegisterSuccess', async(req, res, next)=> {
    try {
        let rs = {};
        rs.title = '店铺注册成功!';
        res.render('user/shopRegisterSuccess', rs);
    } catch (e) {
        console.error('-----e:/requestReceived-----');
        console.error(e);
        res.alert(types.ALERT_WARN, e, " ");
    }
});

router.get('/staffRegisterSuccess',async (req,res,next)=>{
    try {
        let { shopcode }=req.query;
        let rs = {};
        const shopInfo=await TMSProductAPI("bd_get_saleshop",{ code:shopcode });
        rs.shopInfo=shopInfo;
        rs.title = '加入成功!';
        res.render('user/staffRegisterSuccess', rs);
    } catch (e) {
        console.error('-----e:/requestReceived-----');
        console.error(e);
        res.alert(types.ALERT_WARN, e, " ");
    }
});

router.all("*", async(req, res, next)=> {
    res.render('unknown');
});

export default router;