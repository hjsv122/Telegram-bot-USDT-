// server.js
const express = require("express");
const bodyParser = require("body-parser");
const TronWeb = require("tronweb");

const app = express();
app.use(bodyParser.json());
app.use(express.static(__dirname)); // عرض index.html مباشرة

// إعداد محفظة TRC20
const privateKey = "Tornado Wolf End Enough Speed Reform Nut Broccoli Sting flash purchase"; // مفتاحك السري
const tronWeb = new TronWeb({
    fullHost: "https://api.trongrid.io",
    privateKey: privateKey
});

let internalBalance = 0; // الرصيد داخل اللعبة

// جمع الأرباح
app.post("/collect", (req, res) => {
    internalBalance += 1; // زيادة 1$ لكل قفزة
    res.json({ balance: internalBalance });
});

// السحب
app.post("/withdraw", async (req, res) => {
    const { address } = req.body;

    if (internalBalance < 250) {
        return res.json({ message: "الرصيد أقل من 250$، لا يمكن السحب" });
    }

    const fee = internalBalance * 0.02; // خصم 2% رسوم
    const amountToSend = internalBalance - fee;

    try {
        const tx = await tronWeb.trx.sendTransaction(address, amountToSend * 1000000); // تحويل USDT
        internalBalance = 0; // تصفير الرصيد بعد السحب
        res.json({ message: `تم إرسال ${amountToSend}$ إلى ${address}`, tx });
    } catch (error) {
        res.json({ message: "حدث خطأ أثناء السحب", error });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
