export default function(elem, topTarget, callback) {
    if (!elem)
        return;
    topTarget = topTarget||110;
    if (Math.abs(elem.getBoundingClientRect().top - topTarget) < 1) {
        return;
    }
    //开始滚动时间
    if (callback) {
        const isScrolling = true;
        callback(isScrolling);
    }
    let startnode = elem.parentNode;
    let step = 0;
    let moveUpLittle = function (aNode, cicleTimes) {
        let a_top = elem.getBoundingClientRect().top;
        if (Math.abs(a_top - topTarget) >= 1 && cicleTimes < 40) {
            let old = aNode.scrollTop;
            if (!isNaN(old)) {
                step = Math.floor((a_top - topTarget) / 3);
                aNode.scrollTop += step;
                if (aNode.scrollTop == old) {
                    if (aNode.parentNode) {
                        aNode = aNode.parentNode;
                        setTimeout(() => {
                            window.requestAnimationFrame(() => {
                                moveUpLittle(aNode, cicleTimes + 1)
                            });
                        }, 15);
                    }
                } else {
                    setTimeout(() => {
                        window.requestAnimationFrame(() => {
                            moveUpLittle(aNode, cicleTimes + 1)
                        });
                    }, 20);
                }
            }
        } else {
            if (callback) {
                const isScrolling = false;
                callback(isScrolling);
            }
        }
    }
    moveUpLittle(startnode,0);
}