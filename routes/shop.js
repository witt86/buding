import {Router} from "express";
import TMSProductAPI from './../server/lib/TMSProductAPI';
import * as DataModel from './../server/model/DataModel';
import * as types from './../server/constants';
import * as Shop from './../server/model/Shop';
import {uniq,unionBy,reduce} from 'lodash';
import moment from "moment";
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
        const shopcode= req.params[0].split('/')[1];
        const user=req.session.user;
        let referrer="";
        if (req.query &&req.query.referrer){
            referrer=req.query.referrer;
        }
        const saleShop=await TMSProductAPI('bd_get_saleshop',{ code:shopcode });
        if (saleShop && saleShop.state==1){
            const query = {
                where: {
                    uid: user.uid,
                    shopcode: shopcode
                },
                defaults: {
                    uid: user.uid,
                    shopcode: shopcode,
                    referrer
                }
            };
            let [User_ShopCode, created] = await DataModel.User_ShopCode.findOrCreate(query);
        }
    }catch (e){
        console.error(e);
    }
    next();
});

router.get('/:shopcode', async(req, res, next) => {
    try {
        let [rs] = [{}];
        const {shopcode}=req.params;

        const mysaleshop=await TMSProductAPI('bd_get_saleshop',{ code:shopcode });

        rs.title = mysaleshop.name;

        //今日秒杀商品
        const shopProduct=await Shop.getShopProducts({ shopcode });
        rs.activityProducts=shopProduct.filter((item)=>{
            return item.tags.indexOf('今日秒杀')>=0 && item.status==1;
        });
        //首页分类商品
        let categorys = await DataModel.ProductCategory.findAll();

        categorys = JSON.parse(JSON.stringify(categorys));
        for (let category of categorys) {
            category.products=shopProduct.filter((item)=>{
                return item.productcategoryId==category.id && item.status==1 && item.tags.indexOf('首页')>=0;
            });
        };
        //首页bannel和大图标
        let bannerAndAD=await TMSProductAPI("get_navilinks",{ scenario:'首页轮播,首页大图标'});
        rs.sections = categorys;
        rs.shopcode = shopcode;
        rs.type = 'shopHome';
        rs.banner=bannerAndAD.filter(item=>item.scenario=='首页轮播');
        rs.nav=bannerAndAD.filter(item=>item.scenario=='首页大图标');

        res.render('shop/shopHome', rs);
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

        let multispec=[];
        if (rs.productInfo.is_multispec){
            multispec= getProductMultispec(rs.productInfo);
        }

        rs.title = rs.productInfo.name;

        rs.shopcode = shopcode;

        rs.multispec = multispec;

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
    const spec_list=productInfo.spec_list;

    const spec_tag_descArr=spec_tag_desc.split(',').splice(0,1);

    let Multispec=[];
    let s={ title:spec_tag_descArr[0],spec_list:[] };
    for (let p of spec_list ){
        s.spec_list.push({ text:p.spec_tag1,value:p.code } );
    }
    s.spec_list= unionBy(s.spec_list,'text');
    Multispec.push(s);
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
        rs.categorys = await DataModel.ProductCategory.findAll();
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

router.get('/:shopcode/couponcenter',async (req,res,next)=>{
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

router.get('/:shopcode/shopManage', async(req, res, next)=> {
    try {
        let rs = {};
        const { shopcode }=req.params;
        const user=req.session.user;
        //获得用户身份
        const bduser=await TMSProductAPI('bd_query_shops',{ uid:user.uid });
        //判断是不是布丁店主，只有店主有权进入店铺管理

        if (bduser && bduser.shops.length>0 && bduser.shops.indexOf(shopcode)<0){
            res.alert(types.ALERT_WARN, "没有权限", " ");
        }else {
            //获得店铺信息
            const mysaleshop=await TMSProductAPI('bd_get_saleshop',{ code:shopcode });
            //获得未发货订单
            const pay_since=moment().format("YYYY-MM-DD");
            let waitShipOrderToday=[];
            const waitShipOrderAll=await TMSProductAPI('query_orders',{ status:1,pos:0,size:100,store_code:shopcode,pay_since });
            if (waitShipOrderAll && waitShipOrderAll.length>0){
                waitShipOrderToday=waitShipOrderAll.filter(item=>{ return item.pay_date.indexOf(pay_since)>=0 });
            }
            rs.title = mysaleshop.name;
            rs.waitShipOrderToday=waitShipOrderToday;
            rs.waitShipOrderAll=waitShipOrderAll;
            rs.todayPayAmount=reduce(waitShipOrderToday, (sum, item)=> {
                return sum + parseFloat(item.pay_amount)
            }, 0);
            rs.pay_since=pay_since;
            rs.shopcode=shopcode;

            res.render('shop/shopManage', rs);
        }
    } catch (e) {
        console.error('-----e:/shopManage-----');
        console.error(e);
        res.alert(types.ALERT_WARN, e, " ");
    }
});

router.get('/:shopcode/shopInfo', async(req, res, next)=> {
    try {
        let rs = {};
        const { shopcode }=req.params;
        const user=req.session.user;
        //获得用户身份
        const bduser=await TMSProductAPI('bd_query_shops',{ uid:user.uid });
        //判断是不是布丁店主，只有店主有权进入店铺管理
        if (bduser && bduser.shops.length>0 && bduser.shops.indexOf(shopcode)<0){
            res.alert(types.ALERT_WARN, "没有权限", " ");
        }else {
            const shopInfo=await TMSProductAPI('bd_get_saleshop',{ code:shopcode });
            rs.shopInfo=shopInfo;
            rs.title=shopInfo.name;
        }
        rs.shopcode=shopcode;
        res.render('shop/shopInfo', rs);
    } catch (e) {
        console.error('-----e:/shopInfo-----');
        console.error(e);
        res.alert(types.ALERT_WARN, e, " ");
    }
});

router.get('/:shopcode/productManage',async (req,res,next)=>{
    try {
        let rs = {};
        const { shopcode }=req.params;
        const user=req.session.user;
        //todo 做权限判断
        res.render('shop/shopInfo', rs);
    }catch (e){

    }
});

router.get('/:shopcode/propertyManage',async (req,res,next)=>{
    try {
        let rs = {};
        const { shopcode }=req.params;
        const user=req.session.user;
        //todo 做权限判断
        rs.title='小店营收';
        rs.shopcode=shopcode;
        const RewardsstatisticInfo=await Shop.GetRewardsstatisticInfo({ uid:user.uid,shopcode });
        rs.RewardsstatisticInfo=RewardsstatisticInfo;
        res.render('shop/shopPropertyManage',rs);
    }catch (e){
        console.error('-----e:/propertyManage-----');
        console.error(e);
        res.alert(types.ALERT_WARN, e, " ");
    }
});

router.get('/:shopcode/rewardlist/:status/:reward_type',async (req,res,next)=>{
    try {
        let rs = {};
        const { shopcode,status,reward_type }=req.params;
        const user=req.session.user;
        //todo 做权限判断
        rs.shopcode=shopcode;
        rs.status=status;
        rs.reward_type=reward_type;

        rs.title='小店营收';
        res.render('shop/rewardlist',rs);
    }catch (e){
        console.error('-----e:/rewardlist-----');
        console.error(e);
        res.alert(types.ALERT_WARN, e, " ");
    }
});

router.get('/:shopcode/accountlist',async (req,res,next)=>{
    try {
        let rs = {};
        const { shopcode}=req.params;
        const user=req.session.user;
        //todo 做权限判断
        rs.shopcode=shopcode;
        rs.title='小店营收';
        res.render('shop/accountlist',rs);
    }catch (e){
        console.error('-----e:/accountlist-----');
        console.error(e);
        res.alert(types.ALERT_WARN, e, " ");
    }
});

router.all("*", async(req, res, next)=> {
    res.render('unknown');
});

export default router;