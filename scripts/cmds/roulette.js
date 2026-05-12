const fs = require("fs-extra");

module.exports.config = {
  name: "roulette",
  aliases: ["rl", "spin"],
  version: "12.0",
  author: "Minh Anh",
  countDown: 5,
  role: 0,
  shortDescription: "Sovereign Roulette with Tiered Multipliers",
  category: "economy",
  guide: "{p}roulette [red/black/even/odd/sector1/sector2/sector3/number] [amount]"
};

function formatBalance(num) {
  try {
    const n = BigInt(num.toString().split('.')[0] || 0);
    if (n === 0n) return "0";
    const suffixes = [
      { v: 10n**100n, s: "Googol" }, { v: 10n**33n, s: "Dec" },
      { v: 10n**30n, s: "Non" }, { v: 10n**27n, s: "Oct" },
      { v: 10n**24n, s: "Sep" }, { v: 10n**21n, s: "Sex" },
      { v: 10n**18n, s: "Qui" }, { v: 10n**15n, s: "Q" },
      { v: 10n**12n, s: "T" }, { v: 10n**9n, s: "B" },
      { v: 10n**6n, s: "M" }, { v: 10n**3n, s: "K" }
    ];
    for (const { v, s } of suffixes) {
      if (n >= v) {
        const val = (n / (v / 10n)).toString();
        return val.slice(0, -1) + "." + val.slice(-1) + s;
      }
    }
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  } catch (e) { return "0"; }
}

module.exports.onStart = async function ({ api, event, args, usersData }) {
  const { threadID, messageID, senderID } = event;
  const betType = args[0]?.toLowerCase();
  const amountInput = args[1];

  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

  if (!betType || !amountInput) {
    return api.sendMessage(`🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐑𝐎𝐔𝐋𝐄𝐓𝐓𝐄\n━━━━━━━━━━━━━━━━━━\n𝐖𝐚𝐠𝐞𝐫 𝐎𝐩𝐭𝐢𝐨𝐧𝐬:\n• 𝐫𝐞𝐝/𝐛𝐥𝐚𝐜𝐤/𝐞𝐯𝐞𝐧/𝐨𝐝𝐝 (2x)\n• 𝐬𝐞𝐜𝐭𝐨𝐫𝟏/𝟐/𝟑 (3x)\n• 𝐡𝐢𝐠𝐡/𝐥𝐨𝐰 (2x)\n• [𝟎-𝟑𝟔] (36x)\n━━━━━━━━━━━━━━━━━━`, threadID, messageID);
  }

  try {
    const userData = await usersData.get(senderID);
    const currentBalance = BigInt(userData.data.money || 0);

    let betAmount;
    if (amountInput.toLowerCase() === "all") {
      betAmount = currentBalance;
    } else {
      let cleanAmount = amountInput.replace(/,/g, '').toLowerCase();
      if (cleanAmount.includes('m')) betAmount = BigInt(parseFloat(cleanAmount) * 1e6);
      else if (cleanAmount.includes('b')) betAmount = BigInt(parseFloat(cleanAmount) * 1e9);
      else betAmount = BigInt(cleanAmount.split('.')[0]);
    }

    if (betAmount <= 0n) return api.sendMessage("⚠️ Invalid stake.", threadID, messageID);
    if (betAmount > currentBalance) return api.sendMessage("❌ Insufficient Assets.", threadID, messageID);

    const result = Math.floor(Math.random() * 37);
    const color = result === 0 ? "GREEN" : (redNumbers.includes(result) ? "RED" : "BLACK");
    
    let isWin = false;
    let mult = 0n;

    // Logic for Multipliers
    if (betType === "red" || betType === "black") {
      if (betType === color.toLowerCase()) { isWin = true; mult = 2n; }
    } 
    else if (betType === "even" || betType === "odd") {
      if (result !== 0 && ((betType === "even" && result % 2 === 0) || (betType === "odd" && result % 2 !== 0))) {
        isWin = true; mult = 2n;
      }
    }
    else if (betType === "sector1" && result >= 1 && result <= 12) { isWin = true; mult = 3n; }
    else if (betType === "sector2" && result >= 13 && result <= 24) { isWin = true; mult = 3n; }
    else if (betType === "sector3" && result >= 25 && result <= 36) { isWin = true; mult = 3n; }
    else if (!isNaN(betType)) {
      if (parseInt(betType) === result) { isWin = true; mult = 36n; }
    }

    if (isWin) {
      const profit = betAmount * (mult - 1n);
      const newBal = currentBalance + profit;
      await usersData.set(senderID, { data: { ...userData.data, money: newBal.toString() } });

      return api.sendMessage(`🎡 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐖𝐇𝐄𝐄𝐋\n━━━━━━━━━━━━━━━━━━\n𝐑𝐞𝐬𝐮𝐥𝐭: [ ${result} ${color} ]\n\n𝐒𝐭𝐚𝐭𝐮𝐬: 𝐀𝐬𝐬𝐞𝐭 𝐄𝐱𝐩𝐚𝐧𝐬𝐢𝐨𝐧\n𝐆𝐚𝐢𝐧: +$${formatBalance(profit)}\n𝐍𝐞𝐰 𝐓𝐨𝐭𝐚𝐥: $${formatBalance(newBal)}\n━━━━━━━━━━━━━━━━━━`, threadID, messageID);
    } else {
      const newBal = currentBalance - betAmount;
      await usersData.set(senderID, { data: { ...userData.data, money: newBal.toString() } });

      // Randomized Loss Messages
      const lossMsgs = ["Market Correction", "Liquidated", "Asset Forfeiture", "Registry Rebalance"];
      const reason = lossMsgs[Math.floor(Math.random() * lossMsgs.length)];

      return api.sendMessage(`🎡 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐖𝐇𝐄𝐄𝐋\n━━━━━━━━━━━━━━━━━━\n𝐑𝐞𝐬𝐮𝐥𝐭: [ ${result} ${color} ]\n\n𝐒𝐭𝐚𝐭𝐮𝐬: ${reason.toUpperCase()}\n𝐃𝐞𝐛𝐢𝐭: -$${formatBalance(betAmount)}\n━━━━━━━━━━━━━━━━━━`, threadID, messageID);
    }
  } catch (e) { return api.sendMessage("⚠️ System Fault.", threadID, messageID); }
};
