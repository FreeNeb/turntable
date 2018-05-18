var nebulas = require("nebulas");
var NebPay = require("nebpay");

const neb = new nebulas.Neb();
neb.setRequest(new nebulas.HttpRequest("https://testnet.nebulas.io"));
const nebPay = new NebPay();

var nodeServer = "http://localhost:9999/callFunc?func=";

var addrContract = "n1rEb34P2QgLdgm1b1unmy4RzX2Y15PVAdg";

//pro address
var fromAuth = 'n1bNbxxXro8y1zi2T9pFstNnANmghtRTumw';

var __DEV__ = true;

function call(fromAddr, func, ...args) {
    let from = fromAddr;
    if (__DEV__) {
        from = fromAuth;
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
        let html = '';
        let arrRet = JSON.parse(resp.result || []);

        arrRet.forEach(function (ret) {
            if (ret.type == 0 || ret.type == 4 || ret.type == 8) {
                html += ('<div style="margin-bottom: 10px;">恭喜' + ret.author + '用户中了' + ret.desc + '</div>');
            }
        });
        document.getElementById("dataTable").innerHTML = html;
        return JSON.parse(resp.result);
    }).catch(function (err) {
        console.log('error:' + err.message);
    });
}


function queryRewardList() {
    call("", "queryRewardList");
}

function createRewardInfo(id, type, desc) {
    var arg = {to: addrContract, id: id, type: type, desc: desc};
    callNodeServer("createRewardInfo", arg);
}

function callNodeServer(method, arg) {
    var xmlReq = new XMLHttpRequest();
    var url = nodeServer + method + "&&arg=" + JSON.stringify(arg);
    console.log("url", url);
    xmlReq.open("GET", url, true);
    xmlReq.send();
}

var dataObj = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
$(function () {
    queryRewardList();
    var rotating = false;
    var rotateFunc = function (num, type, address) {
        rotating = true;
        $("#outer").rotate({
            angle: 0,
            duration: 4000,
            animateTo: num + 1440, //1440是我要让指针旋转4圈
            callback: function () {
                rotating = false;
                var name = "再接再厉";
                var desc = "未中奖";
                if (type == 0) {
                    desc = "一等奖0.005nas";
                    alert("恭喜你获得一等奖");
                } else if (type == 4) {
                    desc = "二等奖0.003nas";
                    alert("恭喜你获得二等奖");
                } else if (type == 8) {
                    desc = "三等奖0.002nas";
                    alert("恭喜你获得三等奖");
                } else {
                    alert("再接再厉");
                }
                createRewardInfo(address, 4, desc);
                queryRewardList();
            }
        });
    };
    $("#inner").on("click", function () {
        callByWallet(0.001, "beginGame");
    });

    var callByWallet = function (payAmount, contractFunc, options = {}, ...contractFuncArgs) {
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
                            !rotating && rotateFunc(dataObj[key], key, respObject.data.from);
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
