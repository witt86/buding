import request from 'request';
import Promise from 'bluebird';
import _config from './../../config.js';
import qs from 'querystring';

Promise.promisifyAll(request);

export const sendSMS=async (mobiles,content)=>{
    try {
        const smsconfig=_config.sms;
        const post_data={
            'account': smsconfig.account,
            'pswd': smsconfig.pswd,
            'mobile':mobiles,
            'msg':smsconfig.sign+(content||''),
            'needstatus':'true'
        };
        const params = qs.stringify(post_data);
        const url=smsconfig.sms_host+smsconfig.send_sms_uri+'?'+params;
        console.log(url);
        let {body, httpResponse} =await request.getAsync(url);
        console.log(body);
        return body;
    }catch (e){
        console.log('--------body:e-------');
        console.log(e);
    }
};
