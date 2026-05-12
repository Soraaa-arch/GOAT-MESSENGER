const fmt = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

module.exports = {
  config: {
    name: "plinko",
    aliases: ["pk"],
    version: "1.0.0",
    author: "Minh Anh",
    countDown: 5,
    role: 0,
    category: "economy",
    guide: {
      en: "{p}plinko [amount]"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID, senderID } = event;

    // 1. DATA & BALANCE SCRUBBING
    const userData = await usersData.get(senderID);
    const rawMoney = (userData.data.money || "0").toString().split('.')[0].split('e')[0];
    const userMoney = BigInt(rawMoney);

    const betInput = args[0]?.toLowerCase();
    if (!betInput) {
      return api.sendMessage("🏛️ 𝐏𝐋𝐈𝐍𝐊𝐎 𝐏𝐑𝐎𝐓𝐎𝐂𝐎𝐋\n━━━━━━━━━━━━━━━━━━\n💡 𝐔𝐬𝐚𝐠𝐞: {p}plinko [amount]\nExample: {p}plinko 1000", threadID, messageID);
    }

    let betAmount;
    if (betInput === "all") {
      betAmount = userMoney;
    } else {
      const sanitizedBet = betInput?.replace(/[^0-9]/g, '') || "0";
      betAmount = sanitizedBet === "" ? 0n : BigInt(sanitizedBet);
    }

    if (betAmount <= 0n) return api.sendMessage("❌ 𝐈𝐍𝐕𝐀𝐋𝐈𝐃 𝐒𝐓𝐀𝐊𝐄.", threadID, messageID);
    if (betAmount > userMoney) return api.sendMessage("❌ 𝐈𝐍𝐒𝐔𝐅𝐅𝐈𝐂𝐈𝐄𝐍𝐓 𝐂𝐑𝐄𝐃𝐈𝐓𝐒.", threadID, messageID);

    // 2. THE GRAVITY ENGINE
    // Plinko path simulation (8 rows of pins)
    // 0 = Left bounce, 1 = Right bounce
    let position = 0;
    let visualPath = "";
    for (let i = 0; i < 8; i++) {
      const bounce = Math.random() < 0.5 ? 0 : 1;
      position += bounce;
      visualPath += bounce === 0 ? "↙️" : "↘️";
    }

    // Map positions (0-8) to multipliers
    // Edges (0 and 8) are the Jackpots. Center (4) is a loss.
    const multipliers = [100.0, 20.0, 5.0, 1.5, 0.2, 1.5, 5.0, 20.0, 100.0];
    const resultMult = multipliers[position];

    // 3. BALANCE CALCULATION
    const multiplierScaled = BigInt(Math.floor(resultMult * 100));
    const winAmount = (betAmount * multiplierScaled) / 100n;
    const finalBalance = userMoney - betAmount + winAmount;

    // 4. UI CONSTRUCTION
    let status = resultMult >= 1.0 ? "💎 𝐃𝐄𝐏𝐎𝐒𝐈𝐓 𝐒𝐔𝐂𝐂𝐄𝐒𝐒" : "📉 𝐄𝐍𝐄𝐑𝐆𝐘 𝐃𝐈𝐒𝐒𝐈𝐏𝐀𝐓𝐄𝐃";
    let color = resultMult >= 20.0 ? "🌟" : (resultMult >= 1.0 ? "✅" : "❌");

    let msg = `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐏𝐋𝐈𝐍𝐊𝐎\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `      🔴 [CORE DROP]\n`;
    msg += `      ${visualPath}\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `🎰 𝐒𝐥𝐨𝐭 𝐇𝐢𝐭: [ ${resultMult}𝐱 ]\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `${color} ${status}\n`;
    msg += `💰 𝐑𝐞𝐬𝐮𝐥𝐭: ${resultMult >= 1.0 ? "+" : "-"}$${fmt(resultMult >= 1.0 ? winAmount - betAmount : betAmount)}\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `🏦 𝐁𝐀𝐋𝐀𝐍𝐂𝐄: $${fmt(finalBalance)}\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `   𝐄𝐗𝐄𝐂𝐔𝐓𝐄𝐃 𝐁𝐘 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐋𝐈𝐓𝐄`;

    // 5. DATABASE SYNC
    await usersData.set(senderID, { data: { ...userData.data, money: finalBalance.toString() } });

    return api.sendMessage(msg, threadID, messageID);
  }
};
