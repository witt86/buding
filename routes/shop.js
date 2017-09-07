import {Router} from "express";
import TMSProductAPI from './../server/lib/TMSProductAPI';
import * as DataModel from './../server/model/DataModel';
import * as types from './../server/constants';
import * as Shop from './../server/model/Shop';
import {uniq, unionBy, reduce} from 'lodash';
import moment from "moment";
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
    try {
        const shopcode = req.params[0].split('/')[1];
        const user = req.session.user;
        let referrer = "";
        if (req.query && req.query.referrer) {
            referrer = req.query.referrer;
        }
        if (referrer) {
            const saleShop = await TMSProductAPI('bd_get_saleshop', {code: shopcode});
            if (saleShop && saleShop.state == 1) {
                const query = {
                    where: {
                        uid: user.uid,
                        shopcode: shopcode,
                        referrer
                    },
                    defaults: {
                        uid: user.uid,
                        shopcode: shopcode,
                        referrer
                    }
                };
                let [User_ShopCode, created] = await DataModel.User_ShopCode.findOrCreate(query);
            }
        }
    } catch (e) {
        console.error(e);
    }
    next();
});

router.get('/:shopcode', async(req, res, next) => {
    try {
        let [rs] = [{}];

        const {shopcode}=req.params;
        const mysaleshop = await TMSProductAPI('bd_get_saleshop', {code: shopcode});
        if (mysaleshop.state == 2) {
            res.alert(types.ALERT_WARN, "店铺休息中", " ");
        } else {
            rs.title = mysaleshop.name;
            //店铺上架商品
            let shopProduct = await Shop.getShopProducts({shopcode});
            shopProduct = shopProduct.filter((item, index)=> {
                ;
                return item.shopfieldObj && item.shopfieldObj.status == 1
            });
            //今日秒杀商品
            rs.activityProducts = shopProduct.filter((item)=> {
                return item.tags.indexOf('今日秒杀') >= 0 && item.status == 1;
            }).sort((s1, s2)=> {
                return s2.list_order - s1.list_order
            });
            //首页分类商品
            let categorys = await DataModel.ProductCategory.findAll({
                where: {is_active: 1},
                order: [["list_order", "DESC"]]
            });
            categorys = JSON.parse(JSON.stringify(categorys));
            for (let category of categorys) {
                category.products = shopProduct.filter((item)=> {
                    return item.productcategoryId == category.id && item.status == 1 && item.tags.indexOf('首页') >= 0;
                }).sort((s1, s2)=> {
                    return s2.list_order - s1.list_order
                });
            }
            ;
            //首页bannel和大图标
            let bannerAndAD = await TMSProductAPI("get_navilinks", {scenario: '首页轮播,首页大图标'});

            const user = req.session.user;
            //获得用户身份
            const bduser = await TMSProductAPI('bd_get_user', {uid: user.uid});
            //判断是否为店里员工
            let temparr = bduser.filter(item=> {
                return item.shopcode == shopcode
            });
            let referrer = "";
            if (temparr && temparr.length > 0) {
                referrer = user.uid;
            }
            rs.sharelink = `${_config.sitehost}/shop/${shopcode}`;
            if (referrer) {
                rs.sharelink = rs.sharelink + `?referrer=${referrer}`;
            }

            //获取热搜和最近搜索
            const searches = await Shop.getSearchs({uid:user.uid});
            rs.hotSearch = searches.hotSearch;
            rs.recentSearch = searches.recentSearch;

            rs.sections = categorys;
            rs.shopcode = shopcode;
            rs.type = 'shopHome';
            rs.banner = bannerAndAD.filter(item=>item.scenario == '首页轮播');
            rs.nav = bannerAndAD.filter(item=>item.scenario == '首页大图标');
            rs.user = req.session.user;
            rs.mysaleshop = mysaleshop;
            res.render('shop/shopHome', rs);
        }
    } catch (e) {
        console.error('-----e:/shopHome-----');
        console.error(e);
        res.alert(types.ALERT_WARN, e, " ");
    }
});

router.get('/:shopcode/productDetail/:code', async(req, res, next) => {
    try {
        let [rs,code,shopcode] = [{}, req.params.code, req.params.shopcode];

        rs.productInfo = await TMSProductAPI('get_product', {code: code,});

        let multispec = [];
        if (rs.productInfo.is_multispec) {
            multispec = getProductMultispec1(rs.productInfo);
            console.log(multispec);
        }

        const user = req.session.user;
        //获得用户身份
        const bduser = await TMSProductAPI('bd_get_user', {uid: user.uid});
        //判断是否为店里员工
        let temparr = bduser.filter(item=> {
            return item.shopcode == shopcode
        });
        let referrer = "";
        if (temparr && temparr.length > 0) {
            referrer = user.uid;
        }
        rs.sharelink = `${_config.sitehost}/shop/${shopcode}/productDetail/${code}`;
        if (referrer) {
            rs.sharelink = rs.sharelink + `?referrer=${referrer}`;
        }

        rs.title = rs.productInfo.name;

        rs.shopcode = shopcode;

        rs.multispec = multispec;

        rs.user = req.session.user;

        res.render('shop/productDetail', rs);
    } catch (e) {
        console.error('-----e:/productDetail-----');
        console.error(e);
        res.alert(types.ALERT_WARN, e, " ");
    }
});

const getProductMultispec = (productInfo)=> {
    const spec = productInfo.spec;
    if (!spec)return [];
    const spec_tag_desc = productInfo.spec_tag_desc;
    const spec_list = productInfo.spec_list;

    const spec_tag_descArr = spec_tag_desc.split(',').splice(0, 1);

    let Multispec = [];

    let s = {title: spec_tag_descArr[0], spec_list: []};
    for (let p of spec_list) {
        s.spec_list.push({text: p.spec_tag1, value: p.code});
    }
    s.spec_list = unionBy(s.spec_list, 'text');
    Multispec.push(s);
    return Multispec;
};

const getProductMultispec1 = (productInfo)=> {
    const spec = productInfo.spec;
    if (!spec)return [];
    const spec_tag_desc = productInfo.spec_tag_desc;
    const spec_list = productInfo.spec_list;

    const spec_tag_descArr = spec_tag_desc.split(',');
    let Multispec = [];

    spec_tag_descArr.forEach((item, index)=> {
        let s = {title: item, spec_list: []};
        s.spec_list = spec_list.map(item=> {
            let t = item["spec_tag" + (index + 1)];
            if (t && t.length > 0) {
                return t;
            } else {
                return "";
            }
        });
        s.spec_list = unionBy(s.spec_list);
        Multispec.push(s);
    });
    return Multispec;
};


router.get('/:shopcode/ordersettle', async(req, res, next) => {
    try {
        let [rs,shopcode] = [{}, req.params.shopcode];
        const user = req.session.user;
        rs.title = "填写订单";
        rs.shopcode = shopcode;
        let shopCartItems = await Shop.GetShopCart({uid: user.uid, select: 1, shopcode});
        rs.shopCartItems = shopCartItems;
        rs.user = user;
        res.render('shop/orderSettle', rs);
    } catch (e) {
        console.error('-----e:/ordersettle-----');
        console.error(e);
        res.alert(types.ALERT_WARN, e, " ");
    }
});

router.get('/:shopcode/productCategory', async(req, res, next) => {
    try {
        let [rs,shopcode] = [{}, req.params.shopcode];
        let categorys = await DataModel.ProductCategory.findAll({
            order: [["list_order", "DESC"]]
        });
        let shopProduct = await Shop.getShopProducts({shopcode});

        //筛选出店铺上架的商品
        shopProduct = shopProduct.filter(item=>item.shopfieldObj.status == 1);

        categorys = categorys.filter((item)=> {
            let catProducts = shopProduct.filter((product)=> {
                return product.productcategoryId == item.id && product.status == 1;
            });
            return catProducts.length > 0;
        });

        const user = await DataModel.RegUser.findOne({
            where:{
                uid:req.session.user.uid
            }
        });
        if(!user) throw '未知的用户信息';
        //获取热搜和最近搜索
        const searches = await Shop.getSearchs({uid:user.uid});
        rs.hotSearch = searches.hotSearch;
        rs.recentSearch = searches.recentSearch;

        rs.categorys=categorys;
        rs.title = '分类';

        rs.shopcode = shopcode;
        rs.type = 'shopCategory';
        res.render('shop/shopCategory', rs);
    } catch (e) {
        console.error('-----e:/productCategory-----');
        console.error(e);
        res.alert(types.ALERT_WARN, e, " ");
    }
});

router.get('/:shopcode/productSearch', async(req, res, next)=> {
    try {
        let [rs,shopcode,key_word] = [{}, req.params.shopcode, req.query.key_word];
        let shopProduct = await Shop.getShopProducts({shopcode});
        shopProduct = shopProduct.filter((item)=> {
            return item.shopfieldObj &&
                item.shopfieldObj.status == 1
        });
        let SearchResult = [];
        if (key_word) {
            SearchResult = shopProduct.filter((item, index)=> {
                return item.name.indexOf(key_word) >= 0 || (item.key_word && item.key_word.indexOf(key_word) >= 0);
            });
        }

        const user = await DataModel.RegUser.findOne({
            where:{
                uid:req.session.user.uid
            }
        });
        if(!user) throw '未知的用户信息';

        //更新热搜和最近搜索
        const [oldHot, hotCreated] = await DataModel.HotSearch.findOrCreate({
            where:{
                name:key_word
            }
        });
        if(!hotCreated) await oldHot.update({count:(oldHot.count + 1)});
        const [oldRecent, recentCreated] = await DataModel.RecentSearch.findOrCreate({
            where:{
                reguserId:user.id,
                keyword:key_word
            }
        });
        if(!recentCreated) await oldRecent.update({timestamp:new Date().getTime()});

        //获取热搜和最近搜索
        const searches = await Shop.getSearchs({uid:user.uid});
        rs.hotSearch = searches.hotSearch;
        rs.recentSearch = searches.recentSearch;

        rs.SearchResult=SearchResult;
        rs.title="商品搜索";
        rs.key_word=key_word;
        rs.shopcode=shopcode;
        res.render('shop/shopProductSearch', rs);
    } catch (e) {
        console.error('-----e:/shopProductSearch-----');
        console.error(e);
        res.alert(types.ALERT_WARN, e, " ");
    }
});

router.get('/:shopcode/shopCar', async(req, res, next) => {
    try {
        let [rs,shopcode] = [{}, req.params.shopcode];
        const uid = req.session.user.uid;

        rs.shopCar = await TMSProductAPI('get_shopcart', {
            uid: uid,
            agent_code: shopcode
        });

        rs.title = '购物车';
        rs.shopcode = shopcode;
        rs.type = 'shopCar';
        rs.isAll = await Shop.checkAll({shopCar: rs.shopCar});
        res.render('shop/shopCar', rs);
    } catch (e) {
        console.error('-----e:/shopCar-----');
        console.error(e);
        res.alert(types.ALERT_WARN, e, " ");
    }
});

router.get('/:shopcode/orderpayresult', async(req, res, next) => {
    try {
        let [rs,shopcode] = [{}, req.params.shopcode];
        const user = req.session.user;
        rs.title = "支付结果";
        rs.shopcode = shopcode;
        res.render('shop/orderPayResult', rs);
    } catch (e) {
        console.error('-----e:/orderpayresult-----');
        console.error(e);
        res.alert(types.ALERT_WARN, e, " ");
    }
});

router.get('/:shopcode/couponcenter', async(req, res, next)=> {
    try {
        let [rs,shopcode] = [{}, req.params.shopcode];
        const user = req.session.user;
        rs.title = "领券中心";
        rs.shopcode = shopcode;
        res.render('shop/couponCenter', rs);
    } catch (e) {
        console.error('-----e:/couponCenter-----');
        console.error(e);
        res.alert(types.ALERT_WARN, e, " ");
    }
});

//判断是否人员身份
const getUserShopManageLimits = async(uid, shopcode)=> {
    //获得用户身份
    const bduser = await TMSProductAPI('bd_get_user', {uid: uid});

    //判断是否有权限进入店铺管理,默认只有店主和店长有权进入店铺管理
    let temparr = bduser.filter(item=> {
        return item.shopcode == shopcode && [1, 2].indexOf(item.role) >= 0
    });

    return temparr && temparr.length > 0
};

router.get('/:shopcode/shopManage', async(req, res, next)=> {
    try {
        let rs = {};
        const {shopcode}=req.params;
        const user = req.session.user;

        //是否有权限进入店铺管理
        const userlimits = await getUserShopManageLimits(user.uid, shopcode);
        if (!userlimits) {
            res.alert(types.ALERT_WARN, "没有权限", " ");
            return;
        }

        //获得店铺信息
        const mysaleshop = await TMSProductAPI('bd_get_saleshop', {code: shopcode});
        //获得未发货订单
        const pay_since = moment().format("YYYY-MM-DD");
        let waitShipOrderToday = [], ShipPayOrderToday = [];
        const ShopShipOrderAll = await TMSProductAPI('query_orders', {pos: 0, size: 100, store_code: shopcode});

        const waitShipOrderAll = ShopShipOrderAll.filter(item=> {
            return item.order_state == 1
        });//获得未发货订单
        if (ShopShipOrderAll && ShopShipOrderAll.length > 0) {
            //今日未发货订单
            waitShipOrderToday = ShopShipOrderAll.filter(item=> {
                return item.pay_date && item.pay_date.indexOf(pay_since) >= 0 && item.order_state == 1
            });
            //今日付款订单
            ShipPayOrderToday = ShopShipOrderAll.filter(item=> {
                return item.pay_date && item.pay_date.indexOf(pay_since) >= 0
            });
        }
        rs.title = mysaleshop.name;
        rs.waitShipOrderToday = waitShipOrderToday;
        rs.waitShipOrderAll = waitShipOrderAll;
        //今日付款金额
        rs.todayPayAmount = reduce(ShipPayOrderToday, (sum, item)=> {
            return sum + parseFloat(item.pay_amount)
        }, 0);
        rs.pay_since = pay_since;
        rs.shopcode = shopcode;
        rs.ShipPayOrderToday = ShipPayOrderToday;
        res.render('shop/shopManage', rs);
    } catch (e) {
        console.error('-----e:/shopManage-----');
        console.error(e);
        res.alert(types.ALERT_WARN, e, " ");
    }
});

router.get('/:shopcode/shopInfo', async(req, res, next)=> {
    try {
        let rs = {};
        const {shopcode}=req.params;
        const user = req.session.user;

        //是否有权限进入店铺管理
        const userlimits = await getUserShopManageLimits(user.uid, shopcode);
        if (!userlimits) {
            res.alert(types.ALERT_WARN, "没有权限", " ");
            return;
        }

        const shopInfo = await TMSProductAPI('bd_get_saleshop', {code: shopcode});
        rs.shopInfo = shopInfo;
        rs.title = shopInfo.name;
        rs.shopcode = shopcode;
        res.render('shop/shopInfo', rs);
    } catch (e) {
        console.error('-----e:/shopInfo-----');
        console.error(e);
        res.alert(types.ALERT_WARN, e, " ");
    }
});

router.get('/:shopcode/productManage', async(req, res, next)=> {
    try {
        let rs = {};
        const {shopcode}=req.params;
        const user = req.session.user;

        //获得用户身份
        const bduser = await TMSProductAPI('bd_get_user', {uid: user.uid});
        //获得店铺信息
        const shopInfo = await TMSProductAPI('bd_get_saleshop', {code: shopcode});
        //获得TMS系统参数
        const TmsParams = await TMSProductAPI('get_appsettings', {});
        //判断是否为店里员工
        let temparr = bduser.filter(item=> {
            return item.shopcode == shopcode
        });
        if (!temparr || temparr.length == 0) {
            res.alert(types.ALERT_WARN, "没有权限", " ");
            return;
        }

        let categorys = await DataModel.ProductCategory.findAll({
            order: [["list_order", "DESC"]]
        });
        const shopProduct = await Shop.getShopProducts({shopcode});
        categorys = categorys.filter((item)=> {
            let catProducts = shopProduct.filter((product)=> {
                return product.productcategoryId == item.id && product.status == 1;
            });
            return catProducts.length > 0;
        });

        rs.categorys = categorys;
        rs.title = '商品管理';
        rs.shopcode = shopcode;
        rs.role = temparr[0].role;
        rs.shopInfo = shopInfo;
        rs.reward_zhiyingdian = TmsParams.filter((item)=> {
            return item.name == 'reward_zhiyingdian'
        })[0].value;
        rs.reward_jiamengdian = TmsParams.filter((item)=> {
            return item.name == 'reward_jiamengdian'
        })[0].value;
        res.render('shop/shopProductManeage', rs);
    } catch (e) {
        console.error('-----e:/productCategory-----');
        console.error(e);
        res.alert(types.ALERT_WARN, e, " ");
    }
});

router.get('/:shopcode/shopStaffInfo', async(req, res, next)=> { //员工管理
    try {
        let rs = {};
        const {shopcode}=req.params;
        const user = req.session.user;
        //权限判断
        //获得用户身份
        const bduser = await TMSProductAPI('bd_get_user', {uid: user.uid});
        console.log(bduser);
        //判断是否为店长或者店主
        let temparr = bduser.filter(item=> {
            return item.shopcode == shopcode && item.role != 0
        });
        if (!temparr || temparr.length == 0) {
            res.alert(types.ALERT_WARN, "没有权限", " ");
            return;
        };
        let staffList = await TMSProductAPI('bd_getusersfromshop', {uid: user.uid, shopcode: shopcode});
        if (staffList && staffList.length > 0) {
            for (let item of staffList) {
                const userInfo = await DataModel.RegUser.findOne({
                    where: {uid: item.uid},
                    attributes: ['uid', 'headimgurl']
                });
                item.headimgurl=userInfo? userInfo.headimgurl:"";
            }
        }
        rs.title = '我的员工';
        rs.ShopStore_owner = staffList.filter(item=>item.role==2);
        rs.ShopStore_manager=staffList.filter(item=>item.role==1);
        rs.ShopStore_staff=staffList.filter(item=>item.role==0);
        rs.shopcode=shopcode;
        res.render('shop/shopStaffInfo', rs);
    } catch (e) {
        console.error('-----e:/productCategory-----');
        console.error(e);
        res.alert(types.ALERT_WARN, e, " ");
    }
});

router.get('/:shopcode/propertyManage', async(req, res, next)=> {
    try {
        let rs = {};
        const {shopcode}=req.params;
        const user = req.session.user;
        //获得店铺信息
        const shopInfo = await TMSProductAPI('bd_get_saleshop', {code: shopcode});
        //获得用户身份
        const bduser = await TMSProductAPI('bd_get_user', {uid: user.uid});
        if (!bduser || bduser.length == 0) {
            res.alert(types.ALERT_WARN, "没有权限", " ");
            return;
        }
        ;
        //判断是否为店里员工
        let temparr = bduser.filter(item=> {
            return item.shopcode == shopcode
        });
        console.log(temparr);
        rs.title = '我的收益';
        rs.shopcode = shopcode;
        rs.shopInfo = shopInfo;
        const RewardsstatisticInfo = await Shop.GetRewardsstatisticInfo({uid: user.uid, shopcode});
        rs.RewardsstatisticInfo = RewardsstatisticInfo;
        rs.role = temparr.length > 0 ? temparr[0].role : 1;

        res.render('shop/shopPropertyManage', rs);
    } catch (e) {
        console.error('-----e:/propertyManage-----');
        console.error(e);
        res.alert(types.ALERT_WARN, e, " ");
    }
});

router.get('/:shopcode/rewardlist/:status/:reward_type', async(req, res, next)=> {
    try {
        let rs = {};
        const {shopcode, status, reward_type}=req.params;
        const user = req.session.user;
        //获得用户身份
        const bduser = await TMSProductAPI('bd_get_user', {uid: user.uid});
        if (!bduser || bduser.length == 0) {
            res.alert(types.ALERT_WARN, "没有权限", " ");
            return;
        }

        rs.shopcode = shopcode;
        rs.status = status;
        rs.reward_type = reward_type;

        rs.title = '我的收益';
        res.render('shop/rewardlist', rs);
    } catch (e) {
        console.error('-----e:/rewardlist-----');
        console.error(e);
        res.alert(types.ALERT_WARN, e, " ");
    }
});

router.get('/:shopcode/accountlist', async(req, res, next)=> {
    try {
        let rs = {};
        const {shopcode}=req.params;
        const user = req.session.user;
        //获得用户身份
        const bduser = await TMSProductAPI('bd_get_user', {uid: user.uid});
        if (!bduser || bduser.length == 0) {
            res.alert(types.ALERT_WARN, "没有权限", " ");
            return;
        }

        rs.shopcode = shopcode;
        rs.title = '我的收益';
        res.render('shop/accountlist', rs);
    } catch (e) {
        console.error('-----e:/accountlist-----');
        console.error(e);
        res.alert(types.ALERT_WARN, e, " ");
    }
});

router.get('/:shopcode/withDrawManage', async(req, res, next)=> {
    try {
        let rs = {};
        const {shopcode}=req.params;
        const user = req.session.user;

        //获得用户身份
        const bduser = await TMSProductAPI('bd_get_user', {uid: user.uid});
        if (!bduser || bduser.length == 0) {
            res.alert(types.ALERT_WARN, "没有权限", " ");
            return;
        }

        let accounts_summary = await TMSProductAPI('get_accounts_summary', {uid: user.uid});//获取用户资金账户总额
        rs.accounts_summary = accounts_summary;
        rs.shopcode = shopcode;
        rs.title = '提现';
        res.render('shop/withDrawManage', rs);
    } catch (e) {
        console.error('-----e:/withDrawManage-----');
        console.error(e);
        res.alert(types.ALERT_WARN, e, " ");
    }
});

router.all("*", async(req, res, next)=> {
    res.render('unknown');
});

export default router;