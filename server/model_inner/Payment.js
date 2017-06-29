import * as DataModel from './../model/DataModel';
import * as BusinessEvent from './../model/BusinessEvent';
import {delayRun} from './../util/util';
import TMSProductAPI from '../lib/TMSProductAPI';
import _config from './../../config.js' ;
import {reduce, filter} from 'lodash';
import Promise from 'bluebird';

/*
 处理支付成功后的业务:
 1. 更新支付记录,标记第三方支付流水编号、标记为成功
 2. 如果是合并支付,则标记子支付记录(第三方流水号空缺!!, 标记为成功)
 3. 轮询每个订单,出发订单成功支付相关的通知
 */
const Paying_paySuccess_business = async(paynotify_weixin, message)=> {
    try {
        let payrecord = await DataModel.PayRecord.findOne({
                where: {
                    out_trade_no: message.out_trade_no
                }
            }
        );
        //
        console.dir(`开始处理支付跟踪编号${message.out_trade_no}的支付成功后业务`);
        payrecord.transaction_id = message.transaction_id;
        payrecord.success = true;
        await payrecord.save();

        const user_payer = await payrecord.getPayer();

        //标记TMS订单已支付
        await Paying_paySuccess_synTMS(payrecord.orderID, user_payer.uid, payrecord.transaction_id,payrecord.payAmount);
        //异步的事件通知
        delayRun(()=> {
             BusinessEvent.onOrderPaySuccess(payrecord.orderID);
        }, 20, (err)=> {
            console.error(`onOrderPaySuccess 事件内部错误:${err}`);
        });
        //在支付日志上,标记业务已处理完成
        paynotify_weixin.businessdone = true;
        await paynotify_weixin.save();
        console.dir("Paying_paySuccess Done!");
    } catch (err) {
        console.error(`Paying_paySuccess_business error: ${err}`);
    }
}

const Paying_paySuccess_synTMS = async(orderNo, buy_uid, payNo, payamount)=> {
    try {
        const orderinfo = await TMSProductAPI("get_order", {order_no: orderNo});
        if (orderinfo.order_state == 0) {
            var query = {
                order_no: orderNo,
                pay_amount: payamount,//如果是1分钱支付,则特殊处理,注意安全性
                uid: buy_uid,
                pay_code: payNo,
                pay_type: 2
            };
            let payresult = await TMSProductAPI("pay_order", query);
            console.log('----标记TMS订单支付状态为已支付----');
            console.log(payresult);
            console.dir(`标记订单${orderNo}的支付${payamount}元成功状态 成功`);
        }
    } catch (err) {
        console.error(`标记订单的支付${payamount}元成功状态时发生错误:${JSON.stringify(err)}`);
        throw err;
    }
}


export const Paying_onNotify_weixin = async(message, callback, businessDone)=> {
    if (!message)
        throw 'message支付消息对象为空';

    let info = {
        appid: message.appid,
        bank_type: message.bank_type,
        cash_fee: message.cash_fee,
        fee_type: message.fee_type,
        is_subscribe: message.is_subscribe,
        mch_id: message.mch_id,
        nonce_str: message.nonce_str,
        openid: message.openid,
        out_trade_no: message.out_trade_no,
        result_code: message.result_code,
        return_code: message.return_code,
        sign: message.sign,
        time_end: message.time_end,
        total_fee: message.total_fee,
        trade_type: message.trade_type,
        transaction_id: message.transaction_id,
    };
    try {
        info.businessdone = false;
        let [paynotifyRec, isCreated]= await DataModel.Paynotify_weixin.findOrCreate({
            where: {
                transaction_id: message.transaction_id,
                time_end: message.time_end
            },
            defaults: info
        });
        console.dir(`提前返回结果给第三方服务器(微信)....`);
        callback(null, paynotifyRec);
        //
        //接着慢慢处理业务....
        console.dir(`支付业务后续处理....`);
        let error;
        try {
            await Paying_paySuccess_business(paynotifyRec, message);
        } catch (err) {
             error = err;
            console.error(`支付业务后续处理异常....`);
            console.error(err);
        } finally {
            if (businessDone)
                businessDone(error);
        }
    } catch (err) {
        console.error(`支付业务后续处理异常2....`);
        console.error(err);
        callback(err, null);
    }
};

//这里传入的payrecord都是独立订单的对应支付记录,需要判断其是否属于某个合并支付中的
export const Refund_Weixn = async({payrecord, rAmount, reseanMsg})=> {
    try {
        const refundAmount=rAmount==0?payrecord.payAmount:rAmount;
        if (refundAmount>payrecord.payAmount){
            throw `退款金额:${refundAmount}超过付款金额:${ payrecord.payAmount }`;
        }

        const out_refund_no = payrecord.orderID + "-CNY-" + refundAmount;

        let total_fee=payrecord.payAmount;
        let refund_fee=refundAmount;

        //如果是开发或测试环境
        if (process.env.NODE_ENV == 'development' ||
            process.env.NODE_ENV == 'test'
        ) {
            total_fee=0.01;
            refund_fee = 0.01;
            console.dir('调整为测试支付金额!');
        }
        const params = {
            appid: _config.wxconfig.pay.appid,
            mch_id: _config.wxconfig.pay.mch_id,
            op_user_id: _config.wxconfig.pay.mch_id,
            out_refund_no: out_refund_no,
            total_fee: (total_fee).toFixed(2) * 10000 * 100 / 10000, //原支付金额   这里乘以10000是为了解决js浮点数运算bug
            refund_fee: (refund_fee).toFixed(2) * 10000 * 100 / 10000, //退款金额
            transaction_id: payrecord.transaction_id
        };
        let refund_result = await global.wxpay.refundAsync(params);
        if (refund_result.return_code != "SUCCESS") {
            throw `微信退款接口调用异常params:${JSON.stringify(params)}, ${JSON.stringify(refund_result)}`;
        }
        if (refund_result.result_code != "SUCCESS") {
            throw `微信退款接口调用异常params:${JSON.stringify(params)}, ${JSON.stringify(refund_result)}`;
        }

        console.dir(`订单${payrecord.orderID}微信(${payrecord.transaction_id})退款${refundAmount}元成功(${JSON.stringify(refund_result)})`);

        refund_result.reseanMsg = reseanMsg;
        const logResult = await DataModel.RefundLog_Weixin.create(refund_result);
        if (!logResult)
            console.error(`退款${payrecord.orderID}成功,但退款日志记录失败!`);


        const query_payrecord_refund = {
            out_trade_no: out_refund_no, //外部跟踪编号
            trantype: "refund",//交易类型: pay(默认) /
            payAmount: refundAmount,   //支付金额
            pay_type: 'weixin', //'weixin', 'alipay'
            isSelf: true,  //是否为自己支付,
            success: true, //是否支付成功
            transaction_id: refund_result.transaction_id,   //第三方支付记录编号, 只有成功支付的才会有, 包括退款
            ori_out_trade_no: payrecord.transaction_id, //退款记录时,记录原付款记录的交易跟踪号
            orderID:payrecord.orderID,
            payerID:payrecord.payerID
        }
        const payrecord_refund = await DataModel.PayRecord.create(query_payrecord_refund);
        if (!payrecord_refund)
            console.error(`退款${payrecord.orderID}成功,退款记录(payrecord)创建失败!`);

        return true;
    } catch (err) {
        console.error(`Refund_Weixn内部错误:${err}`);
        throw err
    }
}
