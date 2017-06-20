/**
 * Created by TY on 2017/6/15.
 */
    //历史
var eleMenus = $(".routeItem").bind("click", function(event) {
        var query = this.href.split("?")[1];
        if (history.pushState && query && !$(this).hasClass('routeActive')) {
            $('.routeItem').removeClass('routeActive');
            $(this).addClass('routeActive');
            //功能

            var title = $(this).text();
            document.title = title;
            if (event && /\d/.test(event.button)) {
                history.pushState({ title: title }, title, location.href.split("?")[0] + "?" + query);
            }
        }
        return false;
    });
var clickTrigger = function(target) {
    var query = location.href.split("?")[1], eleTarget = target || null;
    if (typeof query == "undefined") {
        if (eleTarget = eleMenus.get(0)) {
            history.replaceState(null, document.title, location.href.split("#")[0] + "?" + eleTarget.href.split("?")[1]) + location.hash;
            clickTrigger(eleTarget);
        }
    } else {
        eleMenus.each(function() {
            if (eleTarget === null && this.href.split("?")[1] === query) {
                eleTarget = this;
            }
        });

        if (!eleTarget) {
            history.replaceState(null, document.title, location.href.split("?")[0]);
            clickTrigger();
        } else {
            $(eleTarget).trigger("click");
        }
    }
};
if (history.pushState) {
    window.addEventListener("popstate", function() {
        clickTrigger();
    });
    clickTrigger();
}