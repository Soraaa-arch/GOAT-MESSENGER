const fmt = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

module.exports = {
  config: {
    name: "tower",
    aliases: ["climb"],
    version: "2.5.0",
    author: "Minh Anh",
    countDown: 5,
    role: 0,
    category: "gambling",
    guide: { en: "{p}tower [amount]" }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID, senderID } = event;
    const userData = await usersData.get(senderID);
    const userMoney = BigInt((userData.data.money || "0").toString().split('.')[0]);

    if (!args[0]) return api.sendMessage("⚠️ 𝐄𝐧𝐭𝐞𝐫 𝐚 𝐛𝐞𝐭.", threadID, messageID);
    let betAmount = args[0] === "all" ? userMoney : BigInt(args[0].replace(/,/g, ''));

    if (betAmount <= 0n || betAmount > userMoney) return api.sendMessage("❌ 𝐈𝐧𝐬𝐮𝐟𝐟𝐢𝐜𝐢𝐞𝐧𝐭 𝐅𝐮𝐧𝐝𝐬.", threadID, messageID);

    // BUFFED: Higher survival on floors 1-3
    const floors = [
      { level: 1, mult: 1.5, fail: 0.15 },
      { level: 2, mult: 2.5, fail: 0.20 },
      { level: 3, mult: 5.0, fail: 0.35 },
      { level: 4, mult: 10.0, fail: 0.50 },
      { level: 5, mult: 25.0, fail: 0.70 }
    ];

    let currentFloor = 0;
    let success = true;
    for (const floor of floors) {
      if (Math.random() < floor.fail) { success = false; currentFloor = floor.level; break; }
      currentFloor = floor.level;
    }

    const winAmount = success ? BigInt(Math.floor(Number(betAmount) * floors[4].mult)) : 0n;
    const finalBalance = userMoney - betAmount + winAmount;

    await usersData.set(senderID, { money: finalBalance.toString(), data: { ...userData.data, money: finalBalance.toString() } });

    let msg = `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐓𝐎𝐖𝐄𝐑\n━━━━━━━━━━━━━━━━━━\n`;
    msg += `📥 𝐖𝐚𝐠𝐞𝐫: $${fmt(betAmount)}\n🪜 𝐀𝐬𝐜𝐞𝐧𝐭: Floor ${success ? 5 : currentFloor-1} / 5\n━━━━━━━━━━━━━━━━━━\n`;
    msg += `${success ? "🏰 𝐒𝐔𝐌𝐌𝐈𝐓 𝐂𝐎𝐍𝐐𝐔𝐄𝐑𝐄𝐃" : "📉 𝐅𝐀𝐋𝐋𝐄𝐍"}\n💰 𝐑𝐞𝐬𝐮𝐥𝐭: ${success ? "+" : "-"}$${fmt(success ? winAmount - betAmount : betAmount)}\n━━━━━━━━━━━━━━━━━━\n`;
    msg += `🏦 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: $${fmt(finalBalance)}\n━━━━━━━━━━━━━━━━━━\n   𝐄𝐗𝐄𝐂𝐔𝐓𝐄𝐃 𝐁𝐘 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐋𝐈𝐓𝐄`;

    return api.sendMessage(msg, threadID, messageID);
  }
};
