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
        this.name = o.name; // 奖励名称
        this.author = o.author; // 用户
        this.desc = o.desc; // 奖励说明
        this.time = o.time;  // 许愿创建时间
    } else {
        this.id = ""; // 奖励id
        this.name = ""; // 奖励名称
        this.author = ""; // 用户
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
     * 用户参与次数
     */
    totalStatistic: function (address) {
        var result = 0;
        var totalStatistic = this.totalCountMap.get(address);
        if (!totalStatistic) {
            return result;
        }
        result = totalStatistic;
        return result;
    },

    createRewardInfo: function (id, name, desc) {
        // 创建一条抽奖信息
        var from = Blockchain.transaction.from;
        var time = Blockchain.transaction.timestamp * 1000;

        var item = new TrunGame();
        item.id = id;
        item.name = name;
        item.author = from;
        item.desc = desc;
        item.time = time;
        this._pushTurnInfo(item);
        return {result: item};
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
