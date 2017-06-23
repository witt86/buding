import DataModel from './DataModel';

export const loadProducts = async ({shopcode,code})=> {
    try{
        if(!shopcode || !code) return {err:'缺少参数'};

        let result = {};
        if(code == 'hot'){
            result = await DataModel.ProductSource.findAll({
                where:{
                    tags:{
                        like:'%布丁首页%'
                    }
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
                    productcategoryId:cate.id
                }
            });
        }

        return result;
    }catch (e) {
        console.log("--------addShopCar:e--------");
        console.log(e);
        throw e;
    }
};