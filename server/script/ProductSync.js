import TMSProductAPI from './../lib/TMSProductAPI';
import * as DataModel from './../model/DataModel';
import {uniq,filter} from 'lodash';

const page_size = 20;

//step 1 ...同步供应商信息
async function System_synSuppliers({pos=0}={pos:0}) {
    console.log(`同步供应商信息 from No.${pos}:`);
    let suppliers = [];
    try {
        suppliers = await TMSProductAPI("query_suppliers", {pos, size: page_size});
    } catch (err) {
        console.error("同步供应商信息发生错误" + err);
    }
    if (!suppliers || suppliers.length == 0) {
        return suppliers;
    }
    for (let supplier of suppliers) {
        const {name,mobile,email,phone} = supplier.primary_contact||{};
        let primary_contact2 = {name,mobile,email,phone}
        var Obj = {
            province: supplier.province,
            city: supplier.city,
            code: supplier.code,
            name: supplier.name,
            notices:JSON.stringify(supplier.notices),
            shipfee_desc:JSON.stringify(supplier.shipfee_desc),
            address: supplier.address,
            primary_contact:JSON.stringify(primary_contact2),
            supId: supplier.id,
            is_active:supplier.is_active?1:0
        };
        const queryInfo = {
            where: {
                supId: supplier.id
            }
        };
        let supplierExist = await DataModel.Supplier.findOne(queryInfo);
        if (supplierExist == null) {
            await DataModel.Supplier.create(Obj);
        } else {
            await supplierExist.update(Obj);
        }
    }

    if (suppliers.length == page_size) {
        pos += page_size;
        let inner_result = await System_synSuppliers({pos, size: page_size});
        suppliers = suppliers.concat(inner_result)
    }
    return suppliers;
}

async function System_synProducts(Info) {
    Info.status = "all";
    if (!Info.pos)
        Info.pos = 0;
    Info.size = page_size;
    console.dir(`开始同步以下供应商的产品 from ${Info.pos}:${JSON.stringify(Info)}`);
    let twohou_prod_list = await TMSProductAPI("query_distributes", Info);
    if (!twohou_prod_list || twohou_prod_list.length == 0) {
        twohou_prod_list = [];
    }
    let saved = 0;
    let tcount = 0;
    for (let twohou_prod of twohou_prod_list) {
        //if (twohou_prod.status != 1) {
        //    // '未上架的新商品不做同步';
        //    console.error(`未上架的新商品不做同步${twohou_prod.code}...忽略此商品`);
        //    continue;
        //}
        let supplier = await DataModel.Supplier.findOne({where: {code: twohou_prod.supplier.code}});
        if (!supplier) {
            console.error(`指定的供应商信息还不存在${twohou_prod.supplier.code}...忽略此商品${twohou_prod.code}`);
            continue;
        }
        let pcategory = await DataModel.ProductCategory.findOne({where: {name: twohou_prod.catagory}});
        if (!pcategory) {
            console.error(`指定的分类信息还不存在(catagory=${twohou_prod.catagory})...忽略此商品${twohou_prod.code}`);
            continue;
        }
        twohou_prod.list_order = twohou_prod.list_order||0;
        twohou_prod.shipfee_desc = JSON.stringify(twohou_prod.shipfee_desc||[]);
        twohou_prod.sourceCode = twohou_prod.code;
        twohou_prod.monthly_sales = parseInt(twohou_prod.monthly_sales) + 100;
        if(twohou_prod.spec_group) {
            let speclist = [twohou_prod.spec_tag1, twohou_prod.spec_tag2, twohou_prod.spec_tag3];
            twohou_prod.spec = filter(uniq(speclist), m=>m || "").join("/")
        }
        if(twohou_prod.origin_country!="中国") {
            twohou_prod.origin_province = twohou_prod.origin_country;
        }
        const query = {
            where: {
                sourceCode: twohou_prod.code
            }
        };
        let productExist = await DataModel.ProductSource.findOne(query);
        if (!productExist&&twohou_prod.status == 1) {
            console.dir('新建货源....' + twohou_prod.code + ", " + twohou_prod.origin_province);
            twohou_prod.salesvolume = Math.floor(200 * Math.random());
            let result = await DataModel.ProductSource.create(twohou_prod);
            await result.setSupplier(supplier);
            await result.setProductcategory(pcategory);
            saved++;
        } else if (productExist){
            //更新时不覆盖"销量"
            const productExistUpdated = await productExist.update(twohou_prod);
            await productExistUpdated.setSupplier(supplier);
            await productExistUpdated.setProductcategory(pcategory);
            saved++;
            console.dir('更新货源....' + twohou_prod.code + ", " + twohou_prod.origin_province);
        }
        saved++;
    }
    tcount += twohou_prod_list.length;
    //是否存在下一页
    if (twohou_prod_list.length == page_size) {
        Info.pos += page_size;
        const result_syn = await System_synProducts(Info);
        tcount += result_syn.tcount;
        saved += result_syn.saved;
    }
    return {tcount, saved};
}

async function System_synProductsCategory() {
    console.log(`同步商品分类信息:`);
    let categories = await TMSProductAPI("get_categories",{});
    if (!categories || categories.length == 0) {
        return [];
    }
    for (let item of categories) {
        const query = {
            where: {
                code: item.code
            }
        };
        try {
            let categoryExist = await DataModel.ProductCategory.findOne(query);
            if (!categoryExist) {
                //不存在...
                console.log("新建分类:" + item.name);
                const query_create = {
                    list_order: item.list_order,
                    code: item.code,
                    name: item.name,
                    p_code_id: item.p_code_id
                };
                await DataModel.ProductCategory.create(query_create);
            } else {
                console.log("修改分类:" + item.name);
                await categoryExist.update(item);
            }
        } catch (err) {
            console.dir(`更新商品类别遇到错误 ${err}`);
        }
    }

    return categories;
}

export const ProductSync = async ()=> {
    try {
        //step 1 ...同步商品分类
        const result_Category = await System_synProductsCategory();

        //step 2 ...同步供应商
        const result_suppliers = await System_synSuppliers();

        //step 3 ...同步商品数据
        const query = {
            supplier: result_suppliers.map((o)=>o.code).join(","),
            status: 'all',
            size: page_size
        }
        let result_Products = await System_synProducts(query);
        console.dir(`商品同步完成: ${JSON.stringify(result_Products)}`);
        result_Products=null;
    } catch (err) {
        console.log("同步商品库,发生错误:");
        console.log(err);
    }
};


// (async ()=>{
//     try{
//         for(
//             let i=0, page_size = 20, _products = [];
//             (await (async ()=> {
//                 _products = await TMSProductAPI("query_distributes", {pos: i, size: page_size});
//                 return _products.length;
//             })())>0;
//             i+=page_size
//         ) {
//             for (const productItem of _products) {
//                 console.dir(productItem.name);
//             }
//         }
//     }catch(err) {
//         console.dir(err);
//     }
// })();

