import {Router} from "express";
import TMSProductAPI from './../server/lib/TMSProductAPI';
import * as DataModel from './../server/model/DataModel';
import * as types from './../server/constants';
import * as User from './../server/model/User';
import _config from './../config.js' ;

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
        const user=req.session.user;
        const {shopcode}=req.query;

        //获得用户身份
        const bduser=await TMSProductAPI('bd_get_user',{ uid:user.uid });
        if (!shopcode){
            //去哪个店?  这里的逻辑是，如果是店里的店员店主店长，则直接去到自己的店，否则是游客则去到最后一次进过的店
            //逻辑优先级是 自己的店->最后一次进过的店->默认店铺
            let shopcode=_config.officialShopcode;//默认店铺
            //看是否是店里的店员
            if (bduser&&bduser.length>0){
                shopcode=bduser[0].shopcode;
            }else {
                const userShopcodes=await DataModel.User_ShopCode.findAll({
                    where:{
                        uid:user.uid
                    },
                    order: [["createdAt", "DESC"]]
                });

                if (userShopcodes && userShopcodes.length>0){ //去最后一次进过的店铺
                    shopcode=userShopcodes[0].shopcode;
                }
            }
            res.redirect(`/user/mine?shopcode=${ shopcode }`);
        }else {
            const reguser = await DataModel.RegUser.findOne({where: {uid: user.uid}});
            const orderListWaitPay = await TMSProductAPI("query_orders", {uid: user.uid, status: 0});

            //判断是否有权限进入店铺管理,默认只有店主和店长有权进入店铺管理
            let temparr=bduser.filter(item=>{ return [1,2].indexOf(item.role)>=0});
            let userManageShops=[];
            if (temparr && temparr.length>0){
                for (let item of temparr){
                    let shopInfo=await TMSProductAPI('bd_get_saleshop',{ code:item.shopcode });
                    userManageShops.push(shopInfo);
                }
            }

            rs.title = '我的布丁';
            rs.userManageShops=userManageShops; //用户管理的店铺
            rs.identity=bduser.length>0; //是否是布丁员工
            rs.shopcode = shopcode;
            rs.reguser = reguser;
            rs.orderListWaitPay = orderListWaitPay;
            res.render('user/mine', rs);
        }
    } catch (e) {
        console.error('-----e:/shopHome-----');
        console.error(e);
        res.alert(types.ALERT_WARN, e, " ");
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
        res.alert(types.ALERT_WARN, e, " ");
    }
});

router.get('/ownerInfo', async(req, res, next) => {
    let rs = {};
    try {
        rs.title = '店主注册';
        const user = req.session.user;
        const shopkeeper = await TMSProductAPI("bd_get_shopkeeper", {uid: user.uid});
        const myshops=await TMSProductAPI("bd_query_shops",{ uid:user.uid });
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


            if (myshops && myshops.shops){
                for(let item of myshops.shops){
                    let shopInfo=await TMSProductAPI("bd_get_saleshop",{ code:item });
                    buttons.push({ url:`/shop/${item}`,title:shopInfo.name });
                }
            }

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

        //获得用户身份
        const bduser=await TMSProductAPI('bd_get_user',{ uid:reguser.uid });
        //判断邀请人是否合法，即是否是店铺店长或者店主
        let temparr=bduser.filter(item=>{ return item.shopcode==shopcode&&[1,2].indexOf(item.role)>=0});
        if (!temparr || temparr.length==0){
            res.alert(types.ALERT_WARN, "该用户没有邀请权限", " ");
            return
        }
        //判断依据:一个人在一家店里只可能是店主、店长、店员一种角色，即temparr中最多出现一条记录
        const shopmanager=temparr[0];

        rs.shopmanager=shopmanager;
        rs.reguser = reguser;
        rs.title = '员工注册';
        res.render('user/staffInfo', rs);
    } catch (e) {
        console.error('-----e:/staffInfo-----');
        console.error(e);
        res.alert(types.ALERT_WARN, e, " ");
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
        const { shopcode }=req.query;
        rs.shopcode=shopcode;
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

router.get('/shopqrcode',async (req,res,next)=>{
      try {
          let { shopcode }=req.query;
          let rs={};

          const user=req.session.user;
          const shopInfo = await TMSProductAPI('bd_get_saleshop', {code: shopcode});

          const qrcode=await User.createShopQrcode({ uid:user.uid,shopcode:shopcode });
          rs.shopInfo = shopInfo;
          rs.qrcode=qrcode;
          rs.title = '店铺推广码';
          res.render('user/shopqrcode', rs);
      }catch (e){
          console.error('-----e:/shopqrcode-----');
          console.error(e);
          res.alert(types.ALERT_WARN, e, " ");
      }
});

router.get('/shopinviteqrcode',async (req,res,next)=>{
    try {
        let { shopcode }=req.query;
        let rs={};
        const user=req.session.user;
        const shopInfo = await TMSProductAPI('bd_get_saleshop', {code: shopcode});

        const qrcode=await User.createShopInviteQrcode({ uid:user.uid,shopcode:shopcode });
        rs.shopInfo = shopInfo;
        rs.qrcode=qrcode;
        rs.title = '店铺员工邀请码';
        res.render('user/shopInviteQrcode', rs);
    }catch (e){
        console.error('-----e:/shopqrcode-----');
        console.error(e);
        res.alert(types.ALERT_WARN, e, " ");
    }
});

router.all("*", async(req, res, next)=> {
    res.render('unknown');
});

export default router;