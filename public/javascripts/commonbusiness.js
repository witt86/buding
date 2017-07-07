function navilink(code,shopcode) {
    if (!code) return;
    var codeArr=code.split(':');
    if (codeArr.length==0)return;

    if (codeArr.length==1){
        go_to(codeArr[0]);
    }else if (codeArr.length>1 && codeArr[0]=='prod'){
        go_to('/shop/'+shopcode+'/productDetail/'+codeArr[1]);
    }else if (codeArr.length>1 && codeArr[0]=='http'){
        go_to(code);
    }else if (codeArr.length>1 && codeArr[0]=='popup'){
       // go_to(code);
    }

}