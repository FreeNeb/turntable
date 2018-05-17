var nebulas = require("nebulas");
var NebPay = require("nebpay");

const neb = new nebulas.Neb();
neb.setRequest(new nebulas.HttpRequest("https://testnet.nebulas.io"));
const nebPay = new NebPay();

var addrContract = "n218ovoa3zBaziQGQYQm1gAGh3yVas2h9uQ";

var __DEV__ = true;

function call(fromAddr, func, ...args) {
    let from = fromAddr;
    if (__DEV__) {
        from = 'n1JSqUa3brKh2h5vSkShjN8NBUwRvSMZxsZ';
    }
    let value = '0';
    let nonce = '0';
    let gas_price = '1000000';
    let gas_limit = '2000000';
    let contract = {
        'function': func,
        'args': JSON.stringify(args)
    };

    return neb.api.call(from, this.addrContract, value, nonce, gas_price, gas_limit, contract).then(function (resp) {
        console.log('result:' + resp.result);
        document.getElementById("dataTable").innerHTML = resp.result;
        return JSON.parse(resp.result);
    }).catch(function (err) {
        console.log('error:' + err.message);
    });
}


function queryRewardList() {
    call("","queryRewardList");
}

var dataObj = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
$(function () {
    queryRewardList();
    var rotating = false;
    var rotateFunc = function (num, type) {
        rotating = true;
        $("#outer").rotate({
            angle: 0,
            duration: 4000,
            animateTo: num + 1440, //1440是我要让指针旋转4圈
            callback: function () {
                rotating = false;
                var desc = "再接再厉";
                if (type == 0) {
                    desc = "一等奖";
                    alert("恭喜你获得一等奖");
                } else if (type == 4) {
                    desc = "二等奖";
                    alert("恭喜你获得二等奖");
                } else if (type == 8) {
                    desc = "三等奖";
                    alert("恭喜你获得三等奖");
                } else {
                    alert("再接再厉");
                }
                call("","createRewardInfo","n1JSqUa3brKh2h5vSkShjN8NBUwRvSMZxsZ",type,desc);
            }
        });
    };
    $("#inner").on("click", function () {
        callByWallet(0.001,"totalStatistic");
    });

    var callByWallet = function(payAmount, contractFunc, options = {}, ...contractFuncArgs) {
        if (payAmount <= 0) {
            throw new Error('交易金额必须大于0');
        }
        let tradeNum = nebPay.call(this.addrContract, payAmount, contractFunc, JSON.stringify(contractFuncArgs), options);
        let intervalQuery;
        return new Promise((resolve, reject) => {
            intervalQuery = setInterval(function () {
                nebPay.queryPayInfo(tradeNum)   // search transaction result from server (result upload to server by app)
                    .then(function (resp) {
                        let respObject = JSON.parse(resp);
                        if (respObject.code === 0) {
                            // 交易成功, 处理相关任务
                            clearInterval(intervalQuery);    // 清除定时查询
                            var key = getRandom(0, 12);
                            !rotating && rotateFunc(dataObj[key], key);
                        } else {
                            console.log(respObject);
                        }
                    })
                    .catch(function (err) {
                        console.log(err);
                    });
            }, 5000);
        });
};


function getRandom(min, max) {
    //x上限，y下限
    var x = max;
    var y = min;
    if (x < y) {
        x = min;
        y = max;
    }
    var rand = parseInt(Math.random() * (x - y + 1) + y);
    return rand;
}
});
