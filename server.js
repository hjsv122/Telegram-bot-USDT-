const express = require("express");
const bodyParser = require("body-parser");
const TronWeb = require("tronweb");

const app = express();
app.use(bodyParser.json());
app.use(express.static(__dirname));

// بيانات العقد و العملة
const USDT_CONTRACT = "TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj";
const tronWeb = new TronWeb({
    fullHost: "https://api.trongrid.io"
});

// محفظة الاستلام (العامة)
const gameWallet = "TKmjAd6z7pAZpv2tQfie1Zt7ihX1XhZBTS";

// المفتاح السري من Environment Variables
const privateKey = process.env.TRC20_PRIVATE_KEY;

let balances = {}; // حفظ أرصدة اللاعبين

// إضافة ربح عند كل قفزة
app.post("/jump", (req, res) => {
    const player = req.body.player || "default";
    if (!balances[player]) balances[player] = { invest: 0, wallet: 0 };
    balances[player].invest += 1; // كل قفزة = 1 دولار
    res.json({ success: true, invest: balances[player].invest, wallet: balances[player].wallet });
});

// نقل الأرباح من الاستثمار إلى المحفظة الداخلية
app.post("/collect", (req, res) => {
    const player = req.body.player || "default";
    if (!balances[player]) balances[player] = { invest: 0, wallet: 0 };
    balances[player].wallet += balances[player].invest;
    balances[player].invest = 0;
    res.json({ success: true, invest: balances[player].invest, wallet: balances[player].wallet });
});

// السحب
app.post("/withdraw", async (req, res) => {
    const player = req.body.player || "default";
    const toAddress = req.body.address;
    if (!balances[player] || balances[player].wallet < 250) {
        return res.json({ success: false, message: "الرصيد أقل من 250$" });
    }

    try {
        const tradeobj = await tronWeb.transactionBuilder.triggerSmartContract(
            USDT_CONTRACT,
            'transfer(address,uint256)',
            {
                feeLimit: 10000000,
                callValue: 0
            },
            [
                { type: 'address', value: toAddress },
                { type: 'uint256', value: (balances[player].wallet - balances[player].wallet * 0.02) * 1e6 }
            ],
            gameWallet
        );

        const signedTxn = await tronWeb.trx.sign(tradeobj.transaction, privateKey);
        const receipt = await tronWeb.trx.sendRawTransaction(signedTxn);

        if (receipt.result) {
            balances[player].wallet = 0;
            res.json({ success: true, message: "تم السحب بنجاح" });
        } else {
            res.json({ success: false, message: "فشل السحب" });
        }

    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
