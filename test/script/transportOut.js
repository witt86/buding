import * as DataModel from './../../server/model/DataModel';
import xlsx from "node-xlsx";
import fs from 'fs';

export async function transportOut() {
    try{
        const data = await DataModel.TransportLog.findAll({
            attributes: ['province', 'city','addr','getter','mobile','content'],
            where:{
                'addr':{
                    '$notlike':'%测试%'
                },
                'content':{
                    '$like':'%A%'
                }
            }
        });

    }catch (e){
        console.log(e);
    }
}
