'use strict';

// 资金
var Stake = function (json) {
    if (!!json) {
        let o = JSON.parse(json);
        this.balance = new BigNumber(o.balance);
        this.betInfos = o.betInfos;
    } else {
        this.balance = new BigNumber(0);
        this.betInfos = [];
    }
}
Stake.prototype.toString = function () {
    return JSON.stringify(this);
}

// 转盘游戏
var TrunGame = function (text) {
    if (text) {
        var o = JSON.parse(text);
        this.id = o.id; // 奖励id
        this.type = o.type; // 奖励类型
        this.author = o.author; // 用户
        this.amount = o.amount; // 金額
        this.desc = o.desc; // 奖励说明
        this.time = o.time;  // 许愿创建时间
    } else {
        this.id = ""; // 奖励id
        this.type = ""; // 奖励类型
        this.author = ""; // 用户
        this.amount = new BigNumber(0); // 金額
        this.desc = ""; // 奖励说明
        this.time = "";  // 许愿创建时间
    }
};
TrunGame.prototype = {
    toString: function () {
        return JSON.stringify(this);
    },
};


var TurnTable = function () {
    // turnMap key = address
    LocalContractStorage.defineMapProperty(this, 'turnMap');
    LocalContractStorage.defineMapProperty(this, 'totalCountMap');
    LocalContractStorage.defineMapProperty(this, 'addressMap');
};

TurnTable.prototype = {
    init: function () {
    },
    _pushTurnInfo(value) {
        var items = this.turnMap.get("turnInfo");
        if (!items) {
            items = [];
        }
        items.push(value);

        this.turnMap.put("turnInfo", items);
    },

    /**
     * 从合约地址中提取token
     * value: 提取的数量
     */
    takeout: function (value) {
        var from = "n1bNbxxXro8y1zi2T9pFstNnANmghtRTumw";
        var amount = new BigNumber(value);

        var result = Blockchain.transfer(from, amount);
        if (!result) {
            throw new Error("transfer failed.");
        }
        Event.Trigger("TakeOut", {
            Transfer: {
                from: Blockchain.transaction.to,
                to: from,
                value: amount.toString()
            }
        });
    },
    /**
     * 参与游戏之前转账
     */
    beginGame: function () {
        var from = Blockchain.transaction.from;
        var amount = Blockchain.transaction.value;
        var amountNas = amount.dividedBy(1000000000000000000);
        this.addressMap.put(from, amountNas);

        return {"from": from, "amount": amountNas};
    },

    createRewardInfo: function (from, value, type, desc) {
        // 创建一条抽奖信息
        var time = Blockchain.transaction.timestamp * 1000;
        var tranResult = "";
        var item = new TrunGame();
        item.id = from;
        item.type = type;
        item.author = from;
        item.desc = desc;
        item.time = time;
        //
        //发放奖励
        var amount = new BigNumber(value).dividedBy(1000000000000000000);
        if (type == 0) {
            //一等奖
            amount = amount * 5;
        } else if (type == 4) {
            amount = amount * 3;
        } else if (type == 8) {
            amount = amount * 2;
        } else {
            amount = new BigNumber(0);
        }
        if (amount > 0) {
            tranResult = Blockchain.transfer(from, amount);
            if (!tranResult) {
                throw new Error("transfer failed,from=" + from + ",amount=" + amount);
            }
        }
        item.amount = amount;
        this._pushTurnInfo(item);
        return {"tranResult": tranResult, "amount": amount};
    },

    queryRewardList: function () {
        var result = [];
        var turnInfo = this.turnMap.get("turnInfo");
        if (turnInfo) {
            for (var i = 0; i < turnInfo.length; i++) {
                result.push(turnInfo[i]);
            }
        }
        return result;
    }
};
module.exports = TurnTable;
