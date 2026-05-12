const fmt = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

module.exports = {
  config: {
    name: "highlow",
    aliases: ["hl", "hilo"],
    version: "1.1.0",
    author: "Minh Anh",
    countDown: 5,
    role: 0,
    category: "economy",
    guide: {
      en: "{p}highlow [high/low] [amount]"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID, senderID } = event;

    // 1. INPUT VALIDATION
    const prediction = args[0]?.toLowerCase();
    const betInput = args[1]?.toLowerCase();

    if (!prediction || !["high", "low", "h", "l"].includes(prediction)) {
      return api.sendMessage("🏛️ 𝐇𝐈𝐆𝐇-𝐋𝐎𝐖 𝐏𝐑𝐎𝐓𝐎𝐂𝐎𝐋\n━━━━━━━━━━━━━━━━━━\n💡 𝐔𝐬𝐚𝐠𝐞: {p}highlow [high/low] [amount]\nExample: {p}highlow high 5000", threadID, messageID);
    }

    const userData = await usersData.get(senderID);
    const rawMoney = (userData.data.money || "0").toString().split('.')[0].split('e')[0];
    const userMoney = BigInt(rawMoney);

    let betAmount;
    if (betInput === "all") {
      betAmount = userMoney;
    } else {
      const sanitizedBet = betInput?.replace(/[^0-9]/g, '') || "0";
      betAmount = sanitizedBet === "" ? 0n : BigInt(sanitizedBet);
    }

    if (betAmount <= 0n) return api.sendMessage("❌ 𝐈𝐍𝐕𝐀𝐋𝐈𝐃 𝐒𝐓𝐀𝐊𝐄.", threadID, messageID);
    if (betAmount > userMoney) return api.sendMessage("❌ 𝐈𝐍𝐒𝐔𝐅𝐅𝐈𝐂𝐈𝐄𝐍𝐓 𝐂𝐑𝐄𝐃𝐈𝐓𝐒.", threadID, messageID);

    // 2. CARD ENGINE
    const cards = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    const values = { "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, "J": 11, "Q": 12, "K": 13, "A": 14 };

    const baseCard = cards[Math.floor(Math.random() * cards.length)];
    const nextCard = cards[Math.floor(Math.random() * cards.length)];

    const baseValue = values[baseCard];
    const nextValue = values[nextCard];

    // WIN CONDITION
    const userPredictedHigh = (prediction === "high" || prediction === "h");
    const isWin = (userPredictedHigh && nextValue > baseValue) || (!userPredictedHigh && nextValue < baseValue);

    // 3. BALANCE CALCULATION
    let finalBalance;
    let status = "";
    let yieldDetails = "";

    if (isWin) {
      // UPGRADED TO 3x PAYOUT
      const winAmount = betAmount * 3n;
      finalBalance = userMoney + (winAmount - betAmount);
      status = "🏆 𝐏𝐑𝐄𝐃𝐈𝐂𝐓𝐈𝐎𝐍 𝐕𝐄𝐑𝐈𝐅𝐈𝐄𝐃";
      yieldDetails = `✨ 𝐘𝐢𝐞𝐥𝐝: 3.0𝐱\n💰 𝐏𝐫𝐨𝐟𝐢𝐭: +$${fmt(winAmount - betAmount)}`;
    } else {
      finalBalance = userMoney - betAmount;
      status = nextValue === baseValue ? "⚖️ 𝐃𝐑𝐀𝐖 - 𝐇𝐎𝐔𝐒𝐄 𝐄𝐃𝐆𝐄" : "💀 𝐏𝐑𝐄𝐃𝐈𝐂𝐓𝐈𝐎𝐍 𝐈𝐍𝐂𝐎𝐑𝐑𝐄𝐂𝐓";
      yieldDetails = `💸 𝐋𝐨𝐬𝐬: -$${fmt(betAmount)}`;
    }

    // 4. UI CONSTRUCTION
    let msg = `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐇𝐈𝐆𝐇-𝐋𝐎𝐖\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `🃏 𝐁𝐚𝐬𝐞 𝐂𝐚𝐫𝐝: [ ${baseCard} ]\n`;
    msg += `🃏 𝐃𝐫𝐚𝐰𝐧 𝐂𝐚𝐫𝐝: [ ${nextCard} ]\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `${status}\n`;
    msg += `${yieldDetails}\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `🏦 𝐁𝐀𝐋𝐀𝐍𝐂𝐄: $${fmt(finalBalance)}\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `   𝐄𝐗𝐄𝐂𝐔𝐓𝐄𝐃 𝐁𝐘 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐋𝐈𝐓𝐄`;

    // 5. DATABASE SYNC
    await usersData.set(senderID, { data: { ...userData.data, money: finalBalance.toString() } });

    return api.sendMessage(msg, threadID, messageID);
  }
};
