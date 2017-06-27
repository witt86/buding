import * as DataModel from './DataModel';
import TMSProductAPI from '../lib/TMSProductAPI';
import _config from './../../config.js' ;
//添加购物车
export const AddToCart = async({uid, prd_code, prd_pcs = 1,shopcode})=> {
    let o = {uid,agent_code:shopcode,prd_code,prd_pcs};
    const ShopCartInfo = await TMSProductAPI("add_to_cart", o);
    return ShopCartInfo;
};

//修改购物车商品
export const UpdateCartItem = async({uid, item_id, pcs})=> {

};

//移除购物车项
export const RemoveCartItem = async({uid, item_id})=> {

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
    //生成支付密匙
    const requestParams = {
        openid: reguser.wx_openID,
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

