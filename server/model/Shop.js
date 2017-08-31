import * as DataModel from './DataModel';
import TMSProductAPI from '../lib/TMSProductAPI';
import _config from './../../config.js' ;
import {filter} from 'lodash';
import {delayRun} from '../util/util';
import * as Payment from './../model_inner/Payment';

//添加购物车
export const AddToCart = async({uid, prd_code, prd_pcs = 1, shopcode = _config.officialShopcode})=> {
    try {
        if (!prd_code) throw '缺少参数';

        const query = {
            uid: uid,
            prd_code: prd_code,
            prd_pcs: prd_pcs,
            agent_code: shopcode
        };
        const res = await TMSProductAPI('add_to_cart', query);
        return res;
    } catch (e) {
        console.log("--------AddToCart:e--------");
        console.log(e);
        throw e;
    }
};
//修改购物车商品
export const UpdateCartItem = async({uid, item_id, pcs, shopcode})=> {
    try {
        if (!item_id || !pcs) throw '缺少参数';
        const res = await TMSProductAPI('update_cartitem', {
            uid: uid,
            item_id: item_id,
            pcs: pcs,
            agent_code: shopcode
        });

        res.isAll = await checkAll({shopCar: res});

        return res;
    } catch (e) {
        console.log("--------UpdateCartItem:e--------");
        console.log(e);
        throw e;
    }
};
//移除购物车项
export const RemoveCartItem = async({uid, item_id, shopcode})=> {
    try {
        if (!item_id) throw '缺少参数';
        const res = await TMSProductAPI('remove_cartitem', {
            uid: uid,
            item_id: item_id,
            agent_code: shopcode
        });

        res.isAll = await checkAll({shopCar: res});

        return res;
    } catch (e) {
        console.log("--------RemoveCartItem:e--------");
        console.log(e);
        throw e;
    }
};
//获得购物车信息
export const GetShopCart = async({uid, select, shopcode})=> {
    let query = {uid, agent_code: shopcode};
    if (select != undefined) {
        query.is_selected = select;
    }
    const ShopCartInfo = await TMSProductAPI("get_shopcart", query);
    return ShopCartInfo;
};
//下单并支付
export const makeOrder = async({uid, shopcode, buyInfo})=> {
    //检查用户是否存在
    const reguser = await DataModel.RegUser.findOne({where: {uid}});
    if (!reguser) throw global.errobj('指定用户不存在!');

   // let guider_uid = uid;
    //获得选中的购物车项
    const allSelectCartItem = await GetShopCart({uid, shopcode, select: 1});
    let carItems = [];
    if (allSelectCartItem && allSelectCartItem.items && allSelectCartItem.items.length > 0) {
        carItems = allSelectCartItem.items;
    } else throw global.errobj('您还没选择商品哦!');

    let shop_data = [];
    shop_data = carItems.map(item=> {
        return {item_id: item.id}
    });

    let orderInfo = {
        uid,
        shop_data: JSON.stringify(shop_data),
        buyer_note: buyInfo.buyer_note || "",
        note_to_receiver: buyInfo.note_to_receiver || "",
        referrer_id: "",
        activity_code: "buding",
        coupon: buyInfo.coupon || "",
        store_code: shopcode,
        ship_type: buyInfo.ship_type,

        //配送地址
        receiver: buyInfo.local_address.receiver,
        receiver_mobile: buyInfo.local_address.receiver_mobile,
        ship_address: buyInfo.local_address.ship_address,
        //省/市/行政区
        ship_city: buyInfo.local_address.ship_city,
        ship_province: buyInfo.local_address.ship_province,
        ship_district: buyInfo.local_address.ship_district
    };

    //看一下下单人是谁推荐过来的
    const usershopcode = await DataModel.User_ShopCode.findAll({
        where: {uid, shopcode},
        order: [["createdAt","DESC"]]
    });
    if (usershopcode && usershopcode.length>0 && usershopcode[0].referrer) {
        orderInfo.referrer_id = usershopcode[0].referrer;
    }

    console.log("make_order.............");
    console.log(orderInfo);

    //下单
    let orderId = "";
    try {
        let createdOrderInfo = await TMSProductAPI("make_order", orderInfo);
        orderId = createdOrderInfo.order_no;
        console.log(orderId);
    } catch (e) {
        throw global.errobj("makeOrderErr", e, e);
    }
    return {orderId};
    // //生成支付密匙
    // try {
    //     const requestSign = await payOrder({uid, orderId});
    //     return {requestSign, orderId};
    // } catch (e) {
    //     throw global.errobj("paySignErr", `生成支付密钥失败`, e);
    // }
};
//预下单
export const preOrders = async({uid, shopcode,  buyInfo})=> {
    //检查用户是否存在
    const reguser = await DataModel.RegUser.findOne({where: {uid}});
    if (!reguser) throw global.errobj('指定用户不存在!');

    // let guider_uid = uid;
    //获得选中的购物车项
    const allSelectCartItem = await GetShopCart({uid, shopcode, select: 1});
    let carItems = [];
    if (allSelectCartItem && allSelectCartItem.items && allSelectCartItem.items.length > 0) {
        carItems = allSelectCartItem.items;
    } else throw global.errobj('您还没选择商品哦!');

    let shop_data = [];
    shop_data = carItems.map(item=> {
        return {item_id: item.id}
    });

    let orderInfo = {
        uid,
        shop_data: JSON.stringify(shop_data),
        buyer_note: buyInfo.buyer_note || "",
        note_to_receiver: buyInfo.note_to_receiver || "",
        referrer_id: "",
        activity_code: "buding",
        coupon: buyInfo.coupon || "",
        store_code: shopcode,
        ship_type: buyInfo.ship_type,

        //配送地址
        receiver: buyInfo.local_address.receiver,
        receiver_mobile: buyInfo.local_address.receiver_mobile,
        ship_address: buyInfo.local_address.ship_address,
        //省/市/行政区
        ship_city: buyInfo.local_address.ship_city,
        ship_province: buyInfo.local_address.ship_province,
        ship_district: buyInfo.local_address.ship_district
    };

    //看一下下单人是谁推荐过来的
    const usershopcode = await DataModel.User_ShopCode.findAll({
        where: {uid, shopcode},
        order: [["createdAt","DESC"]]
    });
    if (usershopcode && usershopcode.length>0 && usershopcode[0].referrer) {
        orderInfo.referrer_id = usershopcode[0].referrer;
    }

    console.log("pre_order.............");
    console.log(orderInfo);

    //下单
    let orderId = "";
    try {
        let createdOrderInfo = await TMSProductAPI("pre_order", orderInfo);
        return createdOrderInfo;
    } catch (e) {
        throw global.errobj("pre_orderErr", e, e);
    }
};
//支付订单
export const payOrder = async({uid, orderId})=> {
    //检查用户是否存在
    const reguser = await DataModel.RegUser.findOne({where: {uid}});
    if (!reguser)  throw '指定用户不存在!';
    //检查订单是否存在
    const orderInfo = await TMSProductAPI("get_order", {order_no: orderId});
    if (!orderInfo) throw global.errobj('指定订单不存在');
    //检查订单状态
    if (orderInfo.order_state != 0) throw global.errobj('订单非待支付状态!');
    //检查支付记录是否存在，不存在则创建一条
    const query = {
        where: {
            orderID: orderId,
            trantype: "pay",
            payerID: reguser.id
        },
        defaults: {
            out_trade_no: orderId + "-pay-" + reguser.id,
            payAmount: orderInfo.pay_amount,
            transaction_id: "",
            orderID: orderId,
            payerID: reguser.id
        }
    }
    let [PayRecord,created]=await DataModel.PayRecord.findOrCreate(query);
    //检查订单是否已支付
    if (PayRecord.success && PayRecord.transaction_id && PayRecord.transaction_id.length > 0) throw global.errobj('订单已支付,无需重复支付');

    let payAmount = PayRecord.payAmount;

    //如果是开发或测试环境
    if ((process.env.NODE_ENV == 'development' ||
        process.env.NODE_ENV == 'test') && process.env.PAY_DEBUG==1
    ) {
        payAmount = 0.01;
        console.dir('调整为测试支付金额!');
    }
    let openID = reguser.wx_openID;
    if (process.env.PAY_DEBUG == '1') {
        const openIDsMap = JSON.parse(await global.redisClient.getAsync("openid-map"));
        const matchUsers = filter(openIDsMap, m=>m.dev == openID);
        const newOpenID = (matchUsers.length > 0) ? matchUsers[0].product : openID;
        console.log(`测试公众号下支付用户openID的转换映射:${openID}->${newOpenID}, data= ${openIDsMap}`);
        openID = newOpenID;
    }
    //生成支付密匙
    const requestParams = {
        openid: openID,
        body: `布丁酒店订单支付(${orderId})`,
        detail: '布丁酒店订单',
        out_trade_no: PayRecord.out_trade_no,
        total_fee: parseFloat(payAmount).toFixed(2) * 10000 * 100 / 10000,//这里乘以10000是为了解决js浮点数运算bug
        spbill_create_ip: _config.siteIP,
        notify_url: _config.wxconfig.pay.notify_url.replace("{sitehost}", _config.sitehost)
    };
    console.log('---签名obj---');
    console.log(requestParams);
    const requestSign = await global.wxpay.getBrandWCPayRequestParamsAsync(requestParams);
    console.log('------requestSign-----');
    console.log(requestSign);
    return {requestSign};
};
//取消订单
export const cancelOrder = async({uid, order_no, reason = "XXX"})=> {
    console.dir("cancelOrder...." + order_no);
    const orderInfo = await TMSProductAPI("get_order", {uid, order_no});
    if (!orderInfo) throw '指定订单不存在!';
    if (orderInfo.order_state == 0) {
        await TMSProductAPI("revoke_order", {order_no, uid});
    } else if (orderInfo.order_state == 1 || orderInfo.order_state == 11 || orderInfo.order_state == 12) {
        //订单是待发货的, 则检查是否有成功的支付记录, 应该有!
        //处理流程:request_refund  -》 退款操作 -》标记已退款
        await TMSProductAPI("request_refund", {uid, order_no, reason});

        //只会有一条成功支付记录
        const payrecords_success = await DataModel.PayRecord.findOne({
            where: {
                orderID: order_no,
                trantype: 'pay',
                success: 1
            }
        });
        if (!payrecords_success) {
            throw '没有此订单的支付成功记录';
        }
        const query = {
            payrecord: payrecords_success,
            rAmount: 0,//实际推荐金额, 部分退款时使用。如是全额退款,则传0值
            reseanMsg: reason
        }

        //提交微信退款
        const refund_weixin_result = await Payment.Refund_Weixn(query);
        if (refund_weixin_result) {
            await TMSProductAPI("mark_refunded", {uid, order_no, fee: parseFloat(orderInfo.pay_amount).toFixed(2)});
        }
    } else if (orderInfo.order_state == 2 || orderInfo.order_state == 3 || orderInfo.order_state == 31) {
        //订单是已发货或已收货的,
        //处理流程:request_refund登记  -》 tms后台客服处理  -》后续流程,可能有人工退款
        await TMSProductAPI("request_refund", {uid, order_no, reason});

    } else {
        const msg = `当前${order_no}订单状态不支持本操作!`;
        console.error(msg);
        throw msg;
    }
    console.dir("cancelOrder....done");
};
export const conformOrder = async({uid, order_no})=> {
    console.dir("cancelOrder...." + order_no);
    const orderInfo = await TMSProductAPI("get_order", {uid, order_no});
    if (!orderInfo) throw '指定订单不存在!';
    if (orderInfo.order_state != 2) {
        throw '订单非发货状态!';
    }
    const conformResult = await TMSProductAPI("ship_signoff", {order_no, uid});
    return conformResult;
};
export const loadProducts = async({shopcode, code})=> {
    try {
        if (!shopcode || !code) return {err: '缺少参数'};
        const products=await getShopProducts({ shopcode });
        let result = {};
        if (code == 'hot') {
            result = products.filter(item=>{
                return item.is_hot==1;
            }).sort((s1,s2)=>{ return s2.list_order-s1.list_order });
        } else {
            const cate = await DataModel.ProductCategory.findOne({
                where: {
                    code: code
                }
            });
            result= products.filter(item=>{
                return item.productcategoryId==cate.id;
            }).sort((s1,s2)=>{ return s2.list_order-s1.list_order });
        }
        return result;
    } catch (e) {
        console.log("--------loadProducts:e--------");
        console.log(e);
        throw e;
    }
};
export const checkAll = async({shopCar})=> {
    try {
        if (!shopCar) return {err: '缺少参数'};

        const res = filter(shopCar.items, {is_selected: false});

        if (res.length == 0 && shopCar.items.length > 0) return true;
        else return false;
    } catch (e) {
        console.log("--------checkAll:e--------");
        console.log(e);
        throw e;
    }
};
export const statusToggle = async({uid, status = 1, item_id, shopcode})=> {
    try {
        if (!item_id) return {err: '缺少参数'};

        const query = {
            uid: uid,
            item_id: item_id,
            agent_code: shopcode,
            is_selected: status
        };

        const res = await TMSProductAPI('mark_selected_cartitem', query);

        res.isAll = await checkAll({shopCar: res});

        return res;
    } catch (e) {
        console.log("--------statusToggle:e--------");
        console.log(e);
        throw e;
    }
};
//再次购买
export const againBuy = async({uid, order_no, shopcode})=> {
    const orderInfo = await TMSProductAPI("get_order", {uid, order_no});
    if (!orderInfo) throw '指定订单不存在!';
    const shopcarInfo = await GetShopCart({uid, shopcode});

    const items = shopcarInfo.items;

    if (items.length > 0) {
        const item_id = items.map(o=> {
            return o.id
        }).join(',');
        await TMSProductAPI("mark_selected_cartitem", {uid, item_id, agent_code: shopcode, is_selected: 0});
    }

    for (let o of orderInfo.items) {
        let code = o.product.code;
        if (items.length > 0) {
            for (let x of items) {
                if (code == x.product.code) {
                    await RemoveCartItem({uid, item_id: x.id, shopcode});
                    break;
                }
            }
        }
        await AddToCart({uid, prd_code: code, shopcode});
    }
    return true;
};
export const selectAll = async({uid, status = 1, shopcode})=> {
    try {
        const shopCar = await TMSProductAPI('get_shopcart', {
            uid: uid,
            agent_code: shopcode
        });

        let idList = '';
        if (shopCar.items.length > 0) {
            for (const item of shopCar.items) {
                idList += (idList.length > 0 ? ',' : '') + item.id
            }
            const query = {
                uid: uid,
                item_id: idList,
                agent_code: shopcode,
                is_selected: status
            };
            const res = await TMSProductAPI('mark_selected_cartitem', query);

            return res;
        } else {
            return shopCar;
        }
    } catch (e) {
        console.log("--------selectAll:e--------");
        console.log(e);
        throw e;
    }
};
export const fastBuy = async({uid, prd_code, prd_pcs = 1, shopcode})=> {
    try {
        if (!prd_code) throw '缺少参数';

        const shopCar = await selectAll({uid: uid, status: 0, shopcode});

        const list = filter(shopCar.items, function (item) {
            return item.product.code == prd_code;
        });

        if (list.length > 0) {
            await UpdateCartItem({uid: uid, item_id: list[0].id, pcs: prd_pcs, shopcode});
            await statusToggle({uid: uid, item_id: list[0].id, status: 1, shopcode});
        } else {
            await AddToCart({uid: uid, prd_code: prd_code, prd_pcs: prd_pcs, shopcode});
        }
        return true;
    } catch (e) {
        console.log("--------fastBuy:e--------");
        console.log(e);
        throw e;
    }
};
//获得优惠活动列表
export const getCouponList = async({uid, pos, size, code})=> {
    let query = {
        pos,
        size,
    };
    if (code) {
        query.code = code;
    }
    const couponList = await TMSProductAPI("query_coupon_rules", query);
    return couponList;
};
//获取优惠券
export const fetchCoupons = async({uid, rules})=> {
    const result = await TMSProductAPI("fetch_coupons", {uid, rules});
    if (!result.tickets || result.tickets.length == 0) {
        if (result.failures) {
            throw result.failures[0][2];
        }
    }
    return result;
};
//获得用户下单可用优惠券
export const getUserValidCoupon = async({uid, shopcode})=> {
    const shopcarItem = await GetShopCart({uid, shopcode, select: 1});
    if (!shopcarItem) return [];
    const items = shopcarItem.items;
    let shop_data = items.map(o=> {
        return {code: o.product.code, pcs: o.pcs}
    });

    const query = {is_expired: false, is_consumed: false, shop_data: JSON.stringify(shop_data), group: 1, uid};
    const ValidCouponList = await TMSProductAPI("query_coupons", query);
    return ValidCouponList;
};
//获得店铺的商品
export const getShopProducts = async({shopcode})=> {
    let productsInfo = [];
    const cache_key = `products_${ shopcode }`;
    let cache = await global.redisClient.getAsync(cache_key);
    if (cache) {
        productsInfo = JSON.parse(cache);
    } else {
        const ShopProducts = await TMSProductAPI("bd_query_products", {code: shopcode});
        const productCodes = ShopProducts.products.map(item=>{ return item.productid });
        const products = await DataModel.ProductSource.findAll({
            where: {
                status: 1,
                sourceCode: {
                    '$in': productCodes
                }
            }
        });

        productsInfo = products;
        for (let item of  productsInfo){
            item.get().shopfieldObj=ShopProducts.products.filter(o=>o.productid==item.sourceCode)[0];
        };
        let productsInfoJSONstring=JSON.stringify(productsInfo);
        productsInfo=JSON.parse(productsInfoJSONstring);
        if (productsInfo && productsInfo.length>0){
            //缓存结果
            delayRun(async()=> {
                await global.redisClient.setAsync(cache_key, productsInfoJSONstring);
                await global.redisClient.expireAsync(cache_key, 60);//缓存一分钟
            }, 5, (err)=> {
                console.error(`保存${cache_key}缓存key错误:${JSON.stringify(err)}`);
            });
        }
    }
    return productsInfo;
};
//店铺商品上下架
export const UpdateShopProductShelf=async ({ uid,id,status,shopcode })=>{
   const s = await TMSProductAPI('bd_update_product',{ uid,id,status });
   const productInfo= await UpdateShopProductCache({ shopproduct:s,shopcode });
   return productInfo;
};

//移除店员
export const RemoveStaffInfo=async ({ uid,id,shopcode })=>{
    const s = await TMSProductAPI('bd_deleteuserfromshop',{ uid,id,shopcode });
    return s;
};

//更新店铺商品缓存，并返回
const UpdateShopProductCache=async ({ shopproduct,shopcode })=>{
    let productlist=[];
    let productInfo={};
    const cache_key = `products_${ shopcode }`;
    let cache = await global.redisClient.getAsync(cache_key);
    if (cache){
        productlist = JSON.parse(cache);
        for (let item of productlist){
            if (item.sourceCode==shopproduct.productid){
                item.shopfieldObj=shopproduct;
                productInfo=item;
                break;
            }
        }
        //缓存结果
        delayRun(async()=> {
            await global.redisClient.setAsync(cache_key, JSON.stringify(productlist));
            await global.redisClient.expireAsync(cache_key, 60);//缓存一分钟
        }, 5, (err)=> {
            console.error(`保存${cache_key}缓存key错误:${JSON.stringify(err)}`);
        });
    }else {
        productlist=await getShopProducts({ shopcode });
        let productInfoArr=productlist.filter(item=>item.sourceCode==shopproduct.productid);
        //console.log(productInfoArr);
        if (productInfoArr && productInfoArr.length>0){
            productInfo=productInfoArr[0];
        }
    }
    return productInfo;
};

//上传店铺头像
export const UploadShopIcon = async({uid, serverId, shopcode})=> {
    const buffer = await global.wechat_api.getMediaAsync(serverId);
    const url = await global.saveBufferToFile(buffer, "shopicon");
    delayRun(async()=> {
        await TMSProductAPI('bd_update_shop', {code: shopcode, uid, shopicon: url});
    }, 500);
    return url;
};
//修改店铺信息
export const UploadShopInfo = async(params)=> {
    let result = await TMSProductAPI('bd_update_shop', params);
    return result;
};
//获得收益结算明细
export const getRewardlist = async({uid, status, reward_type, pos, size, shopcode})=> {
    const rewardsList = await TMSProductAPI('query_rewards', {
        uid,
        status,
        pos,
        size,
        store_code: shopcode
    });
    return rewardsList;
};
//获得小店账户总览数据
export const GetRewardsstatisticInfo = async({uid, shopcode})=> {
    try {
        let rewards_summary = await TMSProductAPI('get_rewards_summary', {uid});//获取用户收益记录简单统计结果(销售回佣)
        let accounts_summary = await TMSProductAPI('get_accounts_summary', {uid});//获取用户资金账户总额
        const result = {
            "accountAmount": accounts_summary.total || 0,
            "cashAmount": accounts_summary.available || 0,
            "withdraw_tbd": accounts_summary.withdraw_tbd || 0,
            "reward_status_0": rewards_summary["pending"].rewards || 0,
            "reward_status_1": rewards_summary["achieved"].rewards || 0,
            "reward_status_2": rewards_summary["cancelled"].rewards || 0,
            "reward_frozen": accounts_summary.reward_frozen || 0
        };
        return result;
    } catch (e) {
        console.log('--------GetRewardsstatisticInfo:e--------');
        console.log(e);
        throw e;
    }
};
//获得小店账户流水
export const getAccountlist = async({uid, shopcode, pos, size})=> {
    const Accountlist = await TMSProductAPI('query_accounts', {
        uid,
        pos,
        size
    });
    return Accountlist;
};
//申请提现
export const requestWithDrawInfo = async({uid, money, shopcode})=> {
    try {
        let istest = false;
        //获得用户身份
        const bduser = await TMSProductAPI('bd_get_user', {uid});

        //判断是否为店里员工
        let temparr=bduser.filter(item=>{ return item.shopcode==shopcode});
        if (!temparr || temparr.length <= 0){
            throw '您不是该店铺员工';
        }
        if (temparr[0].role==1){
            throw '店长暂不支持直接提现';
        }
        const wxopenId=bduser[0].wx_openid;
        money = parseFloat(money).toFixed(1);
        let query = {
            uid: uid,
            ca_type: 'wechat',
            ca_no: wxopenId,
            amount: money
        };
        if (istest) {
            return 'ok';
        }
        let {error, id, result}=await TMSProductAPI("request_withdraw", query);
        if (error) {
            console.error("---提现申请返回错误----");
            console.error(error);
            throw error;
        }
        else {
            let reqid = id;
            let openid = wxopenId;
            let PayParams = {
                partner_trade_no: uid.substring(0, 20) + reqid,
                openid: openid,
                check_name: 'NO_CHECK',
                amount: money * 10000 * 100 / 10000,
                desc: '员工收益提现',
                spbill_create_ip: _config.siteIP
            }
            let PayResult = await global.wxpay.EnterprisePay(PayParams);
            //提现结果记录
            delayRun(async()=> {
                await TMSProductAPI("result_withdraw", {uid: uid, id: reqid, result: JSON.stringify(PayResult)});
            }, 100, err=> {
                console.error("---记录提现结果发生错误---");
                console.error(err);
            });
            if (PayResult.return_code == 'SUCCESS' && PayResult.result_code == 'SUCCESS') {
                let confirmResult = await TMSProductAPI("confirm_withdraw", {
                    uid: uid,
                    id: reqid,
                    trans_no: PayResult.payment_no
                });
                console.log("---提现成功，后台确认结果---");
                console.log(confirmResult);

                if (confirmResult.err)throw confirmResult.err;
                else {
                    return 'ok';
                }
            } else {
                console.log("return_code:" + result.return_code);
                console.log("err_code:" + result.err_code);
                throw '您的提现申请我们已收到,正在处理!';
            }
        }
    } catch (e) {
        console.error("-----requestWithDrawInfo:e------");
        console.error(e);
        throw e;
    }
};

export const getAddressList=async ({ uid })=>{
    const addresslist=await TMSProductAPI('get_ship_addr',{ uid });
    return addresslist;
};

export const AddOrUpdateAddressList=async ({ uid,receiver,receiver_mobile,ship_province,ship_city,ship_district,ship_address })=>{
    const addresslist=await TMSProductAPI('add_ship_addr',{ uid,receiver,receiver_mobile,ship_province,ship_city,ship_district,ship_address });
    return addresslist;
};

export const DelAddress=async ({ uid,id })=>{
    const result=await TMSProductAPI('del_ship_addr',{ uid,addr_id:id });
    return result;
};

export const aaa=async ({uid,reqs})=>{
    console.error('-------客户的抛过来的js错误-------');
    console.error(uid);
    console.error(reqs);
    return true;
};

export const getSearchs = async ({uid}) => {
   try{
       if(!uid) throw '缺少参数！';

       const user = await DataModel.RegUser.findOne({
           where:{
               uid:uid
           }
       });
       if(!user) throw '未知的用户信息';

       const hotSearch = await DataModel.HotSearch.findAll({
           limit:10,
           order:[
               ["count", "DESC"],
               ["updatedAt", "DESC"]
           ]
       });
       const recentSearch = await DataModel.RecentSearch.findAll({
           where:{
               reguserId:user.id
           },
           order:[
               ["updatedAt", "DESC"]
           ],
           limit:10
       });

       return {hotSearch:hotSearch, recentSearch:recentSearch}
   }catch (e){
       console.error("-----getSearchs:e------");
       console.error(e);
       throw e;
   }
};

export const deleteRecent = async ({uid}) => {
    try{
        if(!uid) throw '缺少参数！';

        let user = await DataModel.RegUser.findOne({
            where:{
                uid:uid
            }
        });
        if(!user) throw '未知的用户信息';

        await DataModel.RecentSearch.destroy({
            where:{
                reguserId:user.id
            }
        });

        return true;
    }catch (e){
        console.error("-----deleteRecent:e------");
        console.error(e);
        throw e;
    }
};