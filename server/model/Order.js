import * as DataModel from './DataModel';
import TMSProductAPI from '../lib/TMSProductAPI';
import _config from './../../config.js' ;

export const GetOrderList=async({ uid,status,pos,size,referrer })=>{
      let query={
            uid,
            status,
            order_by:"-order_date",
            pos,
            size
      };
      if (referrer && referrer.length>0){
            query.referrer=referrer;
            delete query.uid;
      }
      const orderlist=await TMSProductAPI('query_orders',query);
      return orderlist;
};

export const GetShopManageOrderList=async ({ uid,status,pos,size,shopcode })=>{
      const orderlist=await TMSProductAPI('query_orders',{
            status,
            order_by:"-order_date",
            pos,
            size,
            store_code:shopcode
      });
      return orderlist;
};

export const set_order_note=async ({ uid,order_no,buyer_note })=>{
     const result=await TMSProductAPI('set_order_note',{ uid,order_no,buyer_note });
     return result;
};