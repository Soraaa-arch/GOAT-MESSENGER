const fmt = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
  config: {
    name: "tower",
    aliases: ["tw"],
    version: "1.0.0",
    author: "Minh Anh",
    countDown: 5,
    role: 0,
    category: "economy",
    guide: {
      en: "{p}tower [amount]"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID, senderID } = event;

    // 1. INPUT & BALANCE VALIDATION
    const betInput = args[0]?.toLowerCase();
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

    if (betAmount <= 0n) return api.sendMessage("🏛️ 𝐓𝐎𝐖𝐄𝐑 𝐏𝐑𝐎𝐓𝐎𝐂𝐎𝐋\n━━━━━━━━━━━━━━━━━━\n💡 𝐔𝐬𝐚𝐠𝐞: {p}tower [amount]", threadID, messageID);
    if (betAmount > userMoney) return api.sendMessage("❌ 𝐈𝐍𝐒𝐔𝐅𝐅𝐈𝐂𝐈𝐄𝐍𝐓 𝐂𝐑𝐄𝐃𝐈𝐓𝐒.", threadID, messageID);

    // 2. TOWER ENGINE (5 Levels)
    const levels = [
      { name: "GROUND", mult: 0n },
      { name: "LEVEL 1", mult: 2n, chance: 0.80 },
      { name: "LEVEL 2", mult: 5n, chance: 0.50 },
      { name: "LEVEL 3", mult: 15n, chance: 0.30 },
      { name: "LEVEL 4", mult: 50n, chance: 0.15 },
      { name: "PINNACLE", mult: 150n, chance: 0.05 }
    ];

    let currentLevel = 0;
    for (let i = 1; i < levels.length; i++) {
      if (Math.random() < levels[i].chance) {
        currentLevel = i;
      } else {
        break; // Tower collapsed
      }
    }

    const winMult = levels[currentLevel].mult;
    const isWin = winMult > 0n;

    let finalBalance;
    let status = "";
    let profitChange = "";

    if (isWin) {
      const winTotal = betAmount * winMult;
      finalBalance = userMoney + (winTotal - betAmount);
      status = currentLevel === 5 ? "💎 𝐏𝐈𝐍𝐍𝐀𝐂𝐋𝐄 𝐑𝐄𝐀𝐂𝐇𝐄𝐃" : "🗼 𝐀𝐒𝐂𝐄𝐍𝐓 𝐒𝐔𝐂𝐂𝐄𝐒𝐒𝐅𝐔𝐋";
      profitChange = `✨ 𝐘𝐢𝐞𝐥𝐝: ${winMult}𝐱\n💰 𝐏𝐫𝐨𝐟𝐢𝐭: +$${fmt(winTotal - betAmount)}`;
    } else {
      finalBalance = userMoney - betAmount;
      status = "💥 𝐓𝐎𝐖𝐄𝐑 𝐂𝐎𝐋𝐋𝐀𝐏𝐒𝐄𝐃";
      profitChange = `💸 𝐋𝐨𝐬𝐬: -$${fmt(betAmount)}`;
    }

    // 3. UI CONSTRUCTION
    const towerVisual = [
      currentLevel >= 5 ? "💎 [ HIGH ]" : "⬜ [ HIGH ]",
      currentLevel >= 4 ? "🟦 [ LVL 4 ]" : "⬜ [ LVL 4 ]",
      currentLevel >= 3 ? "🟩 [ LVL 3 ]" : "⬜ [ LVL 3 ]",
      currentLevel >= 2 ? "🟨 [ LVL 2 ]" : "⬜ [ LVL 2 ]",
      currentLevel >= 1 ? "🟧 [ LVL 1 ]" : "⬜ [ LVL 1 ]",
      "🧱 [ BASE ]"
    ].join("\n      ");

    let msg = `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐓𝐎𝐖𝐄𝐑\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `      ${towerVisual}\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `${status}\n`;
    msg += `${profitChange}\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `🏦 𝐁𝐀𝐋𝐀𝐍𝐂𝐄: $${fmt(finalBalance)}\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `   𝐄𝐗𝐄𝐂𝐔𝐓𝐄𝐃 𝐁𝐘 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐋𝐈𝐓𝐄`;

    // 4. DATABASE SYNC
    await usersData.set(senderID, { data: { ...userData.data, money: finalBalance.toString() } });

    return api.sendMessage(msg, threadID, messageID);
  }
};
