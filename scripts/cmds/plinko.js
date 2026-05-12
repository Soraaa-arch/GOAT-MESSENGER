const fmt = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

module.exports = {
  config: {
    name: "plinko",
    aliases: ["pk"],
    version: "2.0.0",
    author: "Minh Anh",
    countDown: 5,
    role: 0,
    category: "gambling",
    guide: {
      en: "{p}plinko [amount]"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID, senderID } = event;

    // 1. DATA & BET VALIDATION
    const userData = await usersData.get(senderID);
    const rawMoney = (userData.data.money || "0").toString().split('.')[0].split('e')[0];
    const userMoney = BigInt(rawMoney);

    if (!args[0]) return api.sendMessage("⚠️ 𝐄𝐧𝐭𝐞𝐫 𝐚 𝐛𝐞𝐭 𝐚𝐦𝐨𝐮𝐮𝐧𝐭.", threadID, messageID);
    
    let betAmount;
    if (args[0] === "all") betAmount = userMoney;
    else betAmount = BigInt(args[0].replace(/,/g, ''));

    if (betAmount <= 0n) return api.sendMessage("⚠️ 𝐁𝐞𝐭 𝐦𝐮𝐬𝐭 𝐛𝐞 𝐠𝐫𝐞𝐚𝐭𝐞𝐫 𝐭𝐡𝐚𝐧 𝟎.", threadID, messageID);
    if (betAmount > userMoney) return api.sendMessage("❌ 𝐈𝐧𝐬𝐮𝐟𝐟𝐢𝐜𝐢𝐞𝐧𝐭 𝐟𝐮𝐧𝐝𝐬.", threadID, messageID);

    // 2. NERFED MULTIPLIERS (The "House" always wins)
    // Most results will land in the middle (0.2x to 0.5x), losing 50-80% of the bet.
    const multipliers = [5.0, 2.0, 0.5, 0.2, 0.2, 0.5, 2.0, 5.0];
    
    // 3. THE PHYSICS SIMULATION (8 Rows)
    // 0 = Left, 1 = Right. We sum the results to find the landing slot.
    let position = 0;
    let path = "";
    for (let i = 0; i < 7; i++) {
      const drop = Math.random() < 0.5 ? 0 : 1;
      position += drop;
      path += drop === 0 ? "↙️" : "↘️";
    }

    const finalMult = multipliers[position];
    const winAmount = BigInt(Math.floor(Number(betAmount) * finalMult));
    const finalBalance = userMoney - betAmount + winAmount;

    // 4. DATABASE UPDATE
    await usersData.set(senderID, {
      money: finalBalance.toString(),
      data: { ...userData.data, money: finalBalance.toString() }
    });

    // 5. UI CONSTRUCTION
    let resultEmoji = finalMult >= 1 ? "📈 𝐏𝐑𝐎𝐅𝐈𝐓" : "📉 𝐋𝐎𝐒𝐒";
    if (finalMult === 1) resultEmoji = "⚖️ 𝐁𝐑𝐄𝐀𝐊𝐄𝐕𝐄𝐍";

    let msg = `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐏𝐋𝐈𝐍𝐊𝐎\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `📥 𝐁𝐞𝐭: $${fmt(betAmount)}\n`;
    msg += `🛣️ 𝐏𝐚𝐭𝐡: ${path}\n`;
    msg += `🎯 𝐒𝐥𝐨𝐭: [ ${finalMult}𝐱 ]\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `${resultEmoji}\n`;
    msg += `💰 𝐀𝐦𝐨𝐮𝐧𝐭: ${finalMult >= 1 ? "+" : "-"}$${fmt(winAmount > betAmount ? winAmount - betAmount : betAmount - winAmount)}\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `🏦 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: $${fmt(finalBalance)}\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `   𝐄𝐗𝐄𝐂𝐔𝐓𝐄𝐃 𝐁𝐘 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐋𝐈𝐓𝐄`;

    return api.sendMessage(msg, threadID, messageID);
  }
};
