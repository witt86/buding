import * as DataModel from './DataModel';
import TMSProductAPI from '../lib/TMSProductAPI';
import _config from './../../config.js' ;

export const GetOrderList=async({ uid,status,pos,size })=>{
      const orderlist=await TMSProductAPI('query_orders',{ uid,status,order_by:"-order_date",pos,size });
      return orderlist;
};