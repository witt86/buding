import * as DataModel from './DataModel';
import TMSProductAPI from '../lib/TMSProductAPI';
import _config from './../../config.js' ;
import {filter} from 'lodash';
import { delayRun } from '../util/util';
import * as Payment from './../model_inner/Payment';

//添加购物车
export const AddToCart = async({uid, prd_code, prd_pcs = 1})=> {
    try{
        if(!prd_code) throw '缺少参数';

        const query = {
            uid:uid,
            prd_code:prd_code,
            prd_pcs:prd_pcs,
            agent_code:'05987386'
        };
        const res = await TMSProductAPI('add_to_cart',query);
        return res;
    }catch (e) {
        console.log("--------AddToCart:e--------");
        console.log(e);
        throw e;
    }
};

//修改购物车商品
export const UpdateCartItem = async({uid, item_id, pcs})=> {
    try{
        if(!item_id || !pcs) throw '缺少参数';
        const res = await TMSProductAPI('update_cartitem',{
            uid:uid,
            item_id:item_id,
            pcs:pcs,
            agent_code:'05987386'
        });

        res.isAll = await checkAll({shopCar:res});

        return res;
    }catch (e) {
        console.log("--------UpdateCartItem:e--------");
        console.log(e);
        throw e;
    }
};

//移除购物车项
export const RemoveCartItem = async({uid, item_id})=> {
    try{
        if(!item_id) throw '缺少参数';
        const res = await TMSProductAPI('remove_cartitem',{
            uid:uid,
            item_id:item_id,
            agent_code:'05987386'
        });

        res.isAll = await checkAll({shopCar:res});

        return res;
    }catch (e) {
        console.log("--------RemoveCartItem:e--------");
        console.log(e);
        throw e;
    }
};

//清空购物车
export const ClearCarItem = async({uid})=> {

};
//获得购物车信息
export const GetShopCart = async({uid, select,shopcode})=> {
    let query = {uid,agent_code:shopcode};
    if (select != undefined) {
        query.is_selected = select;
    }
    const ShopCartInfo = await TMSProductAPI("get_shopcart",query);
    return ShopCartInfo;
};
//下单并支付
export const makeOrder = async({uid, shopcode, buyInfo})=> {
    //检查用户是否存在
    const reguser = await DataModel.RegUser.findOne({where: {uid}});
    if (!reguser) throw global.errobj('指定用户不存在!');

    let guider_uid = uid;
    //获得选中的购物车项
    const allSelectCartItem = await GetShopCart({uid,shopcode,select:1});
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
        referrer_id: guider_uid,
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

    console.log("make_order.............");
    console.log(orderInfo);

    //下单
    let orderId = "";
    try {
        let createdOrderInfo = await TMSProductAPI("make_order", orderInfo);
        orderId = createdOrderInfo.order_no;
        console.log(orderId);
    } catch (e) {
        throw global.errobj("makeOrderErr", `下单失败，请稍后重试`, e);
    }
    return { orderId };
    // //生成支付密匙
    // try {
    //     const requestSign = await payOrder({uid, orderId});
    //     return {requestSign, orderId};
    // } catch (e) {
    //     throw global.errobj("paySignErr", `生成支付密钥失败`, e);
    // }
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
    if (process.env.NODE_ENV == 'development' ||
        process.env.NODE_ENV == 'test'
    ) {
        payAmount = 0.01;
        console.dir('调整为测试支付金额!');
    }
    let openID=reguser.wx_openID;
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
    return {requestSign};
};
//取消订单
export const cancelOrder = async ({ uid, order_no, reason="XXX" })=> {
    console.dir("cancelOrder...."+order_no);
    const orderInfo = await TMSProductAPI("get_order", {uid, order_no});
    if (!orderInfo) throw '指定订单不存在!';
    if (orderInfo.order_state == 0) {
        await TMSProductAPI("revoke_order", {order_no, uid});
    } else if (orderInfo.order_state == 1 || orderInfo.order_state == 11 || orderInfo.order_state == 12) {
        //订单是待发货的, 则检查是否有成功的支付记录, 应该有!
        //处理流程:request_refund  -》 退款操作 -》标记已退款
        await TMSProductAPI("request_refund", {uid, order_no, reason});

        //只会有一条成功支付记录
        const payrecords_success=await DataModel.PayRecord.findOne({ where:{ orderID:order_no,trantype:'pay',success:1 } });
        if (!payrecords_success){
            throw '没有此订单的支付成功记录';
        }
        const query = {
            payrecord:payrecords_success,
            rAmount: 0,//实际推荐金额, 部分退款时使用。如是全额退款,则传0值
            reseanMsg: reason
        }

        //提交微信退款
        const refund_weixin_result = await Payment.Refund_Weixn(query);
        if (refund_weixin_result){
            await TMSProductAPI("mark_refunded", {uid, order_no,fee: parseFloat(orderInfo.pay_amount).toFixed(2)});
        }
    } else if(orderInfo.order_state ==2 || orderInfo.order_state == 3 || orderInfo.order_state == 31) {
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

export const conformOrder=async ({ uid,order_no })=>{
    console.dir("cancelOrder...."+order_no);
    const orderInfo = await TMSProductAPI("get_order", {uid, order_no});
    if (!orderInfo) throw '指定订单不存在!';
    if (orderInfo.order_state!=2){
        throw '订单非发货状态!';
    }
    const conformResult=await TMSProductAPI("ship_signoff",{ order_no,uid });
    return conformResult;
};

export const loadProducts = async ({shopcode,code})=> {
    try{
        if(!shopcode || !code) return {err:'缺少参数'};

        let result = {};
        if(code == 'hot'){
            result = await DataModel.ProductSource.findAll({
                where:{
                    tags:{
                        like:'%首页%'
                    },
                    status:1
                }
            });
        }else{
            const cate = await DataModel.ProductCategory.findOne({
                where:{
                    code:code
                }
            });

            result = await DataModel.ProductSource.findAll({
                where:{
                    productcategoryId:cate.id,
                    status:1
                }
            });
        }

        return result;
    }catch (e) {
        console.log("--------loadProducts:e--------");
        console.log(e);
        throw e;
    }
};
export const checkAll = async ({shopCar})=> {
    try{
        if(!shopCar) return {err:'缺少参数'};

        const res = filter(shopCar.items, {is_selected:false});

        if(res.length == 0 && shopCar.items.length > 0) return true;
        else return false;
    }catch (e) {
        console.log("--------checkAll:e--------");
        console.log(e);
        throw e;
    }
};

export const statusToggle = async ({uid,status = 1,item_id})=> {
    try{
        if(!item_id) return {err:'缺少参数'};

        const query = {
            uid:uid,
            item_id:item_id,
            agent_code:'05987386',
            is_selected:status
        };

        const res = await TMSProductAPI('mark_selected_cartitem',query);

        res.isAll = await checkAll({shopCar:res});

        return res;
    }catch (e) {
        console.log("--------statusToggle:e--------");
        console.log(e);
        throw e;
    }
};
//再次购买
export const againBuy=async ({ uid,order_no,shopcode })=>{
    const orderInfo = await TMSProductAPI("get_order", {uid, order_no});
    if (!orderInfo) throw '指定订单不存在!';
    const shopcarInfo=await GetShopCart({ uid,shopcode });

    const items=shopcarInfo.items;

    if (items.length>0){
        const item_id=items.map(o=>{ return o.id }).join(',');
        await TMSProductAPI("mark_selected_cartitem", {uid, item_id,agent_code:shopcode,is_selected:0});
    }

    for (let o of orderInfo.items){
        let code=o.product.code;
        if (items.length>0){
            for (let x of items){
                if (code==x.product.code){
                    await RemoveCartItem({  uid,item_id:x.id });
                    break;
                }
            }
        }
        await AddToCart({ uid,prd_code:code });
    }
    return true;
};

export const selectAll = async ({uid,status = 1})=> {
    try{
        const shopCar = await TMSProductAPI('get_shopcart',{
            uid:uid,
            agent_code:'05987386'
        });

        let idList = '';
        if(shopCar.items.length > 0){
            for(const item of shopCar.items){
                idList += (idList.length > 0 ? ',' : '') + item.id
            }
            const query = {
                uid:uid,
                item_id:idList,
                agent_code:'05987386',
                is_selected:status
            };
            const res = await TMSProductAPI('mark_selected_cartitem',query);

            return res;
        }else{
            return shopCar;
        }
    }catch (e) {
        console.log("--------selectAll:e--------");
        console.log(e);
        throw e;
    }
};

export const fastBuy = async ({uid,prd_code,prd_pcs=1})=> {
    try{
        if(!prd_code) throw '缺少参数';

        const shopCar = await selectAll({uid:uid,status:0});

        const list = filter(shopCar.items, function (item) {
            return item.product.code == prd_code;
        });

        if(list.length > 0){
            await UpdateCartItem({uid:uid,item_id:list[0].id,pcs:prd_pcs});
            await statusToggle({uid:uid,item_id:list[0].id,status:1});
        }else {
            await AddToCart({uid:uid,prd_code:prd_code,prd_pcs:prd_pcs});
        }
        return true;
    }catch (e) {
        console.log("--------fastBuy:e--------");
        console.log(e);
        throw e;
    }
};