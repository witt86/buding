import Sequelize from 'sequelize';
import _config from './../../config.js' ;
import * as types from './../constants';

const sequelize = new Sequelize(_config.mysql.database, _config.mysql.user, _config.mysql.password, {
    host: _config.mysql.host,
    port: _config.mysql.port,
    timezone: "+08:00",
    benchmark: false,
    logging: null //(...params)=>console.log(...params)
});

let RegUser = sequelize.define('reguser', {
    uid: Sequelize.STRING(64),
    wx_openID: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: ''
    },
    userName: {
        type: Sequelize.STRING(64),
        allowNull: false,
        defaultValue: ''
    }, //冗余记录一份,原则上应该实时从用户中心取获取
    mobile: {
        type: Sequelize.STRING(15),
        allowNull: true,
        defaultValue: ''
    }, //冗余记录一份,原则上应该实时从用户中心取获取
    realName: {
        type: Sequelize.STRING(64),
        allowNull: false,
        defaultValue: ''
    }, //TODO:新字段
    headimgurl: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: ''
    }, //初期都是来自微信的
    last_lng: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: ''
    },//精度
    last_lat: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: ''
    },
    last_Precision: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    subscribed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    issubscribed: {   //是否通过扫二维码关注过公众号，默认没关注，解决重复取消关注的冲突
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    unionid: {
        type: Sequelize.STRING(64),
        allowNull: false,
        defaultValue: ''
    },
    loginFromApp: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    userType: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0    //0：实际用户  ，1：企业虚拟用户
    },
    countrycode: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: ''
    },
    prousertype: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0   //0:普通用户，1：准导游，2：导游，3：供应商
    },
    Referrer: {  //推荐人
        'type': Sequelize.STRING(64),
        'allowNull': false,
        'defaultValue': ''
    }
}, {
    indexes: [{
        name: 'idx_uid_unique',
        fields: ['uid'],
        unique: true
    }, {
        name: 'idx_wx_openID_unique',
        fields: ['wx_openID', 'userType'],
        unique: true
    }, {
        name: 'idx_unionid_unique',
        fields: ['unionid'],
        unique: true
    }],
    hooks: {},
    classMethods: {},
    instanceMethods: {}
});

let Supplier = sequelize.define('supplier', {
    province: Sequelize.STRING(32),
    city: Sequelize.STRING(32),
    code: Sequelize.STRING(32),
    name: Sequelize.STRING(32),
    address: Sequelize.STRING(32),
    primary_contact: Sequelize.STRING(255),
    offerimage: Sequelize.STRING(1024),
    supId: Sequelize.INTEGER,  //TMS自增ID,
    notices: {
        'type': Sequelize.STRING(900),
        'defaultValue': '[]'
    },
    is_active: Sequelize.BOOLEAN,
    shipfee_desc: {
        'type': Sequelize.STRING(1024),
        'defaultValue': '[]'
    }
}, {
    indexes: [{
        name: 'idx_code_unique_supplier',
        fields: ['code'],
        unique: true
    }]
});

//住友集团发展的都是业主，业主有权限新建店铺，发展店主，店主可发展店员

let ShopkeeperInfo = sequelize.define('shopkeeperinfo', {  //店主信息表
    uid: {
        'type': Sequelize.STRING(64),
        'allowNull': false,
        'unique': true,
        'comment': "土猴帐号系统的用户ID"
    },
    wx_openID: {
        'type': Sequelize.STRING(64),
        'allowNull': false,
        'unique': true,
        'comment': "微信公众号ID"
    },
    TrueName: {
        'type': Sequelize.STRING(64),
        'allowNull': false,
        'unique': true,
        'comment': "个人是真实名称"
    },
    mobile: Sequelize.STRING(15),
    City: {
        'type': Sequelize.INTEGER,
        'allowNull': true,
        'defaultValue': 0,
        'comment': "所在城市"
    },
    IDs: { //身份证件号码
        'type': Sequelize.STRING(32),
        'allowNull': false,
        'defaultValue': '',
        'comment': "身份证号码"
    },
    photo: { //身份证正面
        'type': Sequelize.STRING(255),
        'allowNull': false,
        'defaultValue': '',
        'comment': "身份证正面"
    },
    photoReverse: { //身份证反面
        'type': Sequelize.STRING(255),
        'allowNull': false,
        'defaultValue': '',
        'comment': "身份证反面"
    },
    rejectMessage: {
        'type': Sequelize.STRING(45),
        'allowNull': false,
        'defaultValue': '',
        'comment': "拒绝信息"
    },
    status: {
        'type': Sequelize.INTEGER,
        'allowNull': true,
        'defaultValue': 0,
        'comment': "业主审核状态"//0:未审核，1：审核通过,2:审核不通过
    }
}, {
    'deletedAt': 'dtime',
    'paranoid': true,
    indexes: [{
        name: 'idx_uid_unique_shopkeeperinfo',
        fields: ['uid'],
        unique: true
    }, {
        name: 'idx_wx_openID_unique_shopkeeperinfo',
        fields: ['wx_openID', 'uid'],
        unique: true
    }],
    classMethods: {},
    instanceMethods: {}
});
ShopkeeperInfo.hook('afterCreate', function (shopkeeperinfo, options) {
    //BusinessTool.onGuiderCreate(guider);
});
ShopkeeperInfo.hook('beforeDestroy', function (shopkeeperinfo, options) {
    // BusinessTool.synWeiXinUserGroup_moveOut(guider.wx_openID, false, function (err, result) {
    //     console.info("synWeiXinUserGroup_ForGuide out:" + err);
    // });
});

let SaleShop = sequelize.define('saleshop', {  //店铺信息表
    code: Sequelize.STRING(32),
    name: Sequelize.STRING(32), //店铺名称
    comment: Sequelize.STRING(255), //
    qrcode: Sequelize.STRING(255), // 店铺二维码
    keeperqrcode: Sequelize.STRING(255),//店主邀请二维码
    shopIcon: Sequelize.STRING(255), // 店铺头像
    cover: Sequelize.STRING(255), //封面
    watchCount: { //关注人数
        'type': Sequelize.INTEGER,
        'allowNull': false,
        'defaultValue': 0
    },
    status: { //状态:0:审核中, 1:开张中,2:休息中
        'type': Sequelize.INTEGER,
        'allowNull': false,
        'defaultValue': 0
    }
}, {
    indexes: [{
        name: 'idx_code_unique_saleshop',
        fields: ['code'],
        unique: true
    }]
});
SaleShop.hook('afterCreate', function (SaleShop, options) {

});

let ShopManagerInfo = sequelize.define('shopmanagerinfo', {  //店长、店员信息表
    uid: {
        'type': Sequelize.STRING(64),
        'allowNull': false,
        'unique': true,
        'comment': "土猴帐号系统的用户ID"
    },
    wx_openID: {
        'type': Sequelize.STRING(64),
        'allowNull': false,
        'unique': true,
        'comment': "微信公众号ID"
    },
    TrueName: {
        'type': Sequelize.STRING(64),
        'allowNull': false,
        'unique': true,
        'comment': "个人是真实名称"
    },
    mobile: Sequelize.STRING(15),
    shopcode: {
        'type': Sequelize.STRING(64),
        'allowNull': false,
        'defaultValue': ''
    },
    role: {
        'type': Sequelize.ENUM(
            types.ShopManage,
            types.ShopStaff
        ),
        'defaultValue': types.ShopStaff
    },
    pid: {
        'type': Sequelize.INTEGER,
        'allowNull': true
    }
});

let ProductCategory = sequelize.define('productcategory', {
    list_order: Sequelize.INTEGER,
    code: Sequelize.STRING,
    name: Sequelize.STRING,
    p_code_id: Sequelize.STRING
}, {
    'deletedAt': 'dtime',
    'paranoid': true,
    indexes: [{
        name: 'idx_productcategory_name',
        fields: ['name', 'list_order'],
        unique: false
    }]
});

let ProductSource = sequelize.define('productsource', {
    sourceCode: {
        'type': Sequelize.STRING(32),
        'allowNull': false,
        'defaultValue': ''
    },
    catagorysort: Sequelize.INTEGER,
    //以下是tms同步字段
    code: Sequelize.STRING(256),//值与sourceCode相同, 为与tms的product对象兼容用
    name: Sequelize.STRING(256),
    brand: Sequelize.STRING(32),
    market_price: Sequelize.DECIMAL(8, 2),
    retail_price: Sequelize.DECIMAL(8, 2),
    settle_price: Sequelize.DECIMAL(8, 2),
    stock_volume: Sequelize.INTEGER,
    margin: Sequelize.DECIMAL(8, 2),
    monthly_sales: Sequelize.INTEGER,
    list_order: Sequelize.INTEGER,
    icon: Sequelize.STRING(256),
    image: Sequelize.STRING(256),
    is_package: {
        'type': Sequelize.BOOLEAN,
        'allowNull': false,
        'defaultValue': false
    },
    is_new: {
        'type': Sequelize.BOOLEAN,
        'allowNull': false,
        'defaultValue': false
    },
    is_hot: {
        'type': Sequelize.BOOLEAN,
        'allowNull': false,
        'defaultValue': false
    },
    is_special: {
        'type': Sequelize.BOOLEAN,
        'allowNull': false,
        'defaultValue': false
    },
    is_local_hot: {
        'type': Sequelize.BOOLEAN,
        'allowNull': false,
        'defaultValue': false
    },
    is_car_buy: {
        'type': Sequelize.BOOLEAN,
        'allowNull': false,
        'defaultValue': false
    },
    brief: Sequelize.STRING,
    is_multispec: Sequelize.BOOLEAN,
    spec: Sequelize.STRING,
    spec_group: Sequelize.STRING(15),
    spec_tag1: Sequelize.STRING(15),
    spec_tag2: Sequelize.STRING(15),
    spec_tag3: Sequelize.STRING(15),
    spec_tag_desc: Sequelize.STRING(64),
    lower_limit: Sequelize.INTEGER,
    unit: Sequelize.STRING,
    tags: Sequelize.STRING,
    catagory: Sequelize.STRING,
    allow_local_ship: Sequelize.INTEGER,
    local_ship_desc: Sequelize.STRING,
    status: Sequelize.BOOLEAN,
    status_txt: Sequelize.STRING(32),
    allow_free_ship: Sequelize.BOOLEAN,
    shipfee_desc: {
        'type': Sequelize.STRING(1024),
        'allowNull': false,
        'defaultValue': '[]'
    },
    free_ship_cnt: Sequelize.INTEGER,
    initial_ship_fee: Sequelize.INTEGER,
    second_ship_fee: Sequelize.INTEGER,
    create_time: Sequelize.STRING,
    update_time: Sequelize.STRING,
    origin_country: Sequelize.STRING(32),
    origin_province: Sequelize.STRING(32),
    origin_city: Sequelize.STRING(32),
    key_word: Sequelize.STRING(256)
}, {
    'deletedAt': 'dtime',
    'paranoid': true,
    indexes: [{
        name: 'idx_sourceCode',
        fields: ['sourceCode'],
        unique: true
    }],
    scopes: {
        SummaryView: {
            attributes: [
                `id`,
                `sourceCode`,
                `code`,
                `name`,
                `brand`,
                `is_multispec`,
                `market_price`,
                `retail_price`,
                `stock_volume`,
                `monthly_sales`,
                `settle_price`,
                `shipfee_desc`,
                `list_order`,
                `icon`,
                `image`,
                `brand`,
                `is_package`,
                `is_new`,
                `is_hot`,
                `is_car_buy`,
                `is_local_hot`,
                `lower_limit`,
                `brief`,
                `spec`,
                `spec_tag1`,
                `spec_tag2`,
                `spec_tag3`,
                `spec_tag_desc`,
                `spec_group`,
                `is_special`,
                `status`,
                `unit`,
                `catagory`,
                `catagorysort`,
                `allow_local_ship`,
                `local_ship_desc`,
                `free_ship_cnt`,
                `update_time`,
                `second_ship_fee`,
                `productcategoryId`,
                `origin_country`,
                `origin_province`,
                `create_time`,
                `update_time`,
                `origin_city`,
                `allow_free_ship`,
                `key_word`,
                `initial_ship_fee`, `createdAt`, `updatedAt`],
            where: {
                status: 1
            },
            include: [
                ProductCategory,
                Supplier
            ]
        },
        SummaryManageView: {
            attributes: [
                `id`,
                `sourceCode`,
                `code`,
                `name`,
                `brand`,
                `is_multispec`,
                `market_price`,
                `retail_price`,
                `settle_price`,
                `stock_volume`,
                `monthly_sales`,
                `list_order`,
                `icon`,
                `image`,
                `brand`,
                `is_package`,
                `is_new`,
                `is_hot`,
                `is_local_hot`,
                `is_car_buy`,
                `is_special`,
                `lower_limit`,
                `shipfee_desc`,
                `brief`,
                `margin`,
                `spec`,
                `spec_tag1`,
                `spec_tag2`,
                `spec_tag3`,
                `spec_tag_desc`,
                `spec_group`,
                `status`,
                `unit`,
                `catagory`,
                `catagorysort`,
                `update_time`,
                `allow_local_ship`,
                `local_ship_desc`,
                `free_ship_cnt`,
                `second_ship_fee`,
                `origin_country`,
                `origin_province`,
                `origin_city`,
                `create_time`,
                `update_time`,
                `allow_free_ship`,
                `key_word`,
                `initial_ship_fee`, `createdAt`, `updatedAt`],
            where: {
                status: 1
            },
            include: [
                ProductCategory,
                Supplier
            ]
        }
    }
});

let SaleShop_ProductSource = sequelize.define('saleshop_productsource', {
    sort: {
        'type': Sequelize.INTEGER,
        'allowNull': false,
        'defaultValue': 0
    }
}, {
    hooks: {
        afterCreate: function (obj, options) {

        },
    }
});

//支付记录:
//分三类: 单笔订单支付, 复合多笔支付, 退款记录
//退款记录只对应到单笔支付记录上,mergepay记录没有直接对应的退款记录(因为没有合并退款,退款都是针对单个商品的)
let PayRecord = sequelize.define('payrecord', {
        out_trade_no: Sequelize.STRING(64), //外部跟踪编号
        trantype: {'type': Sequelize.STRING, 'allowNull': false, 'defaultValue': "pay"},//交易类型: pay(默认) / refund
        payAmount: Sequelize.DECIMAL(8, 2),//支付金额
        pay_type:{ 'type':Sequelize.STRING,'allowNull': false, 'defaultValue': "weixin" } , //'weixin', 'alipay'
        isSelf:{ 'type':Sequelize.BOOLEAN,'allowNull': false, 'defaultValue': 1 },  //是否为自己支付,默认是,
        success:{ 'type':Sequelize.BOOLEAN,'allowNull': false, 'defaultValue': 0 } , //是否支付成功
        transaction_id: Sequelize.STRING(64),   //第三方支付记录编号, 只有成功支付的才会有, 包括退款
        ori_out_trade_no: Sequelize.STRING, //退款记录时,记录原付款记录的交易跟踪号
        orderID: Sequelize.STRING(64)
    }
)

let Paynotify_weixin = sequelize.define('paynotify_weixin',
    {
        appid: {'type': Sequelize.STRING, 'allowNull': false, 'defaultValue': ""},
        bank_type: {'type': Sequelize.STRING, 'allowNull': false, 'defaultValue': ""},
        cash_fee: {'type': Sequelize.STRING, 'allowNull': false, 'defaultValue': ""},
        fee_type: {'type': Sequelize.STRING, 'allowNull': false, 'defaultValue': ""},
        is_subscribe: {'type': Sequelize.STRING, 'allowNull': false, 'defaultValue': ""},
        mch_id: {'type': Sequelize.STRING, 'allowNull': false, 'defaultValue': ""},
        nonce_str: {'type': Sequelize.STRING, 'allowNull': false, 'defaultValue': ""},
        openid: {'type': Sequelize.STRING, 'allowNull': false, 'defaultValue': ""},
        out_trade_no: {'type': Sequelize.STRING, 'allowNull': false, 'defaultValue': ""},
        result_code: {'type': Sequelize.STRING, 'allowNull': false, 'defaultValue': ""},
        return_code: {'type': Sequelize.STRING, 'allowNull': false, 'defaultValue': ""},
        sign: {'type': Sequelize.STRING, 'allowNull': false, 'defaultValue': ""},
        time_end: {'type': Sequelize.STRING, 'allowNull': false, 'defaultValue': ""},
        total_fee: {'type': Sequelize.STRING, 'allowNull': false, 'defaultValue': ""},
        trade_type: {'type': Sequelize.STRING, 'allowNull': false, 'defaultValue': ""},
        transaction_id: {'type': Sequelize.STRING, 'allowNull': false, 'defaultValue': ""},
        businessdone: Sequelize.BOOLEAN,
    }
    , {
        indexes: [
            {
                name: 'idx_paynotify_transaction_id',
                fields: ['transaction_id', 'time_end'],
                unique: true
            },
            {
                name: 'idx_out_trade_no',
                fields: ['out_trade_no'],
                unique: false
            }
        ]
    }
);

//热搜
let HotSearch = sequelize.define('hotsearch', {
    district: Sequelize.STRING(32),
    code: Sequelize.STRING(16),
    name: Sequelize.STRING(32)
});

//用户键值对
let UserKeyProp = sequelize.define('userkeyprop', {
    uid: Sequelize.STRING(64),
    propKey: Sequelize.STRING(128),
    propValue: Sequelize.STRING(512),
    random: Sequelize.INTEGER,
}, {
    indexes: [{
        name: 'idx_UserKeyProp',
        fields: ['uid', 'propKey'],
        unique: true
    }]
});

//退款log
let RefundLog_Weixin = sequelize.define('refundlog_weixin', {
    return_code: Sequelize.STRING,
    return_msg: Sequelize.STRING,
    appid: Sequelize.STRING,
    mch_id: Sequelize.STRING,
    nonce_str: Sequelize.STRING,
    sign: Sequelize.STRING,
    result_code: Sequelize.STRING,
    transaction_id: Sequelize.STRING,
    out_trade_no: Sequelize.STRING,
    out_refund_no: Sequelize.STRING,
    refund_id: Sequelize.STRING,
    refund_channel: Sequelize.STRING,
    refund_fee: Sequelize.STRING,
    coupon_refund_fee: Sequelize.STRING,
    total_fee: Sequelize.STRING,
    cash_fee: Sequelize.STRING,
    coupon_refund_count: Sequelize.STRING,
    cash_refund_fee: Sequelize.STRING
}, {
    'deletedAt': 'dtime',
    'paranoid': true
});

let SMSMessage = sequelize.define('smsmessage', {
    targetPhones: Sequelize.STRING(512),
    content: Sequelize.STRING(1024),
    sendNum: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    isSend: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },   //  0:等待发送，1:发送成功，2:发送失败
}, {
    'deletedAt': 'dtime',
    'paranoid': true
});
//短信
SMSMessage.belongsTo(RegUser);
RegUser.hasMany(SMSMessage);
//供应商与货源
ProductSource.belongsTo(Supplier);
Supplier.hasMany(ProductSource);
//货源类别 1:N 货源商品
ProductCategory.hasMany(ProductSource);
ProductSource.belongsTo(ProductCategory);
//用户 1:1 店主
ShopkeeperInfo.belongsTo(RegUser);
RegUser.hasOne(ShopkeeperInfo);
//店主 1:N 店
ShopkeeperInfo.hasMany(SaleShop);
SaleShop.belongsTo(ShopkeeperInfo);
//订单与用户\微店\订单商品\支付
//订单 N:1 用户
//支付记录1:1支付者(用户)
RegUser.hasMany(PayRecord, {as: 'Payer', foreignKey: "payerID"});
PayRecord.belongsTo(RegUser, {as: 'Payer', foreignKey: "payerID"});
//支付记录 1:N 支付通讯日志
PayRecord.hasMany(Paynotify_weixin);
Paynotify_weixin.belongsTo(PayRecord);

//关注:
//店主关注供应商
SaleShop.belongsToMany(ProductSource, {through: SaleShop_ProductSource, as: 'FavProductSource'});
ProductSource.belongsToMany(SaleShop, {through: SaleShop_ProductSource, as: 'FollowerSaleShop'});

module.exports.RegUser = RegUser;
module.exports.Supplier = Supplier;
module.exports.ShopkeeperInfo = ShopkeeperInfo;
module.exports.ProductSource = ProductSource;
module.exports.SaleShop = SaleShop;
module.exports.ShopManagerInfo = ShopManagerInfo;
module.exports.PayRecord = PayRecord;
module.exports.ProductCategory = ProductCategory;
module.exports.UserKeyProp = UserKeyProp;
module.exports.RefundLog_Weixin = RefundLog_Weixin;
module.exports.Paynotify_weixin = Paynotify_weixin;
module.exports.HotSearch = HotSearch;
module.exports.SMSMessage = SMSMessage;

module.exports.SaleShop_ProductSource = SaleShop_ProductSource;


//由sql组成的函数方法,注意:需要对传入的所有参数做防SQL注入过滤(字符串替换或数值转换操作)
module.exports.Functions = {};

if (process.env.BUID == 78901234 && process.env.DEBUG == 'resetdb3') {
    if (process.env.NODE_ENV != 'production') {
        sequelize.sync({force: true}).then(function () {
            console.info("DB Inited! ");
        });
    }
}


//BUID=78901234 DEBUG=resetdb3 NODE_ENV=development node test/run-resetModel.js
//对于交易系统，订单的行程id可定义为"微场景id、场景销售活动id"，前者是旅游团、民宿等，后者是行程id、促销id

// Seller.findAll({
//     include: [
//         {
//             model: Organization,
//             include: [{
//                 model: AdminOrganization,
//                 include: [{
//                     model: RegUser,
//                     where: {
//                         uid: '*****'
//                     }
//                 }]
//             }]
//         }
//     ]
// });

