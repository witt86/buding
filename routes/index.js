import {Router} from 'express';
import * as types from './../server/constants';
import TMSProductAPI from './../server/lib/TMSProductAPI';
import * as DataModel from './../server/model/DataModel';
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

router.get('/myshop', async(req, res, next)=> {
    try {
        const user = req.session.user;
        //获得用户身份
        const bduser = await TMSProductAPI('bd_get_user', {uid: user.uid});

        //判断是不是布丁员工
        let identity = 0;
        if (bduser && bduser.length > 0) {
            identity = bduser[0];
        };
        let shopcode = _config.officialShopcode;//默认店铺
        if (identity) {
            res.redirect(`/user/shopqrcode?shopcode=${ identity.shopcode }`);
        } else {
            const userShopcodes = await DataModel.User_ShopCode.findAll({
                where: {
                    uid: user.uid
                },
                order: [["createdAt", "DESC"]]
            });
            if (userShopcodes && userShopcodes.length > 0) {
                shopcode = userShopcodes[0].shopcode;
            };
            res.redirect(`/shop/${ shopcode }`); //客人访问
        }
    } catch (e) {
        res.alert(types.ALERT_WARN, e, " ");
    }
});

router.get('/', async(req, res, next)=> {
    try {
        const user = req.session.user;
        //获得用户身份
        const bduser = await TMSProductAPI('bd_get_user', {uid: user.uid});

        //判断是不是布丁员工
        let identity = 0;
        if (bduser && bduser.length > 0) {
            identity = bduser[0];
        }
        ;

        //去哪个店?
        let shopcode = _config.officialShopcode;//默认店铺
        if (identity) {
            shopcode = identity.shopcode;
        } else {
            const userShopcodes = await DataModel.User_ShopCode.findAll({
                where: {
                    uid: user.uid
                },
                order: [["createdAt", "DESC"]]
            });
            if (userShopcodes && userShopcodes.length > 0) {
                shopcode = userShopcodes[0].shopcode;
            }
        }
        res.redirect(`/shop/${ shopcode }`);
    } catch (e) {
        res.alert(types.ALERT_WARN, e, " ");
    }
});

router.all('/error', async(req, res, next) => {
    res.render('/error');
});
module.exports = router;