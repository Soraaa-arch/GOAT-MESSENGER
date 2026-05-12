const fmt = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

module.exports = {
  config: {
    name: "plinko",
    aliases: ["pk"],
    version: "2.5.0",
    author: "Minh Anh",
    countDown: 5,
    role: 0,
    category: "gambling",
    guide: { en: "{p}plinko [amount]" }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID, senderID } = event;
    const userData = await usersData.get(senderID);
    const userMoney = BigInt((userData.data.money || "0").toString().split('.')[0]);

    if (!args[0]) return api.sendMessage("⚠️ 𝐄𝐧𝐭𝐞𝐫 𝐚 𝐛𝐞𝐭 𝐚𝐦𝐨𝐮𝐧𝐭.", threadID, messageID);
    let betAmount = args[0] === "all" ? userMoney : BigInt(args[0].replace(/,/g, ''));

    if (betAmount <= 0n || betAmount > userMoney) return api.sendMessage("❌ 𝐈𝐧𝐯𝐚𝐥𝐢𝐝 𝐅𝐮𝐧𝐝𝐬.", threadID, messageID);

    // BUFFED: Center is safer (0.5x), Edges are deadlier (15x)
    const multipliers = [15.0, 5.0, 2.0, 0.8, 0.5, 0.8, 2.0, 5.0, 15.0];
    
    let position = 0;
    let path = "";
    for (let i = 0; i < 8; i++) {
      const drop = Math.random() < 0.5 ? 0 : 1;
      position += drop;
      path += drop === 0 ? "↙️" : "↘️";
    }

    const finalMult = multipliers[position];
    const winAmount = BigInt(Math.floor(Number(betAmount) * finalMult));
    const finalBalance = userMoney - betAmount + winAmount;

    await usersData.set(senderID, { money: finalBalance.toString(), data: { ...userData.data, money: finalBalance.toString() } });

    let msg = `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐏𝐋𝐈𝐍𝐊𝐎\n━━━━━━━━━━━━━━━━━━\n`;
    msg += `📥 𝐁𝐞𝐭: $${fmt(betAmount)}\n🎯 𝐒𝐥𝐨𝐭: [ ${finalMult}𝐱 ]\n━━━━━━━━━━━━━━━━━━\n`;
    msg += `${finalMult >= 1 ? "📈 𝐏𝐑𝐎𝐅𝐈𝐓" : "📉 𝐋𝐎𝐒𝐒"}\n💰 𝐀𝐦𝐨𝐮𝐧𝐭: $${fmt(winAmount)}\n━━━━━━━━━━━━━━━━━━\n`;
    msg += `🏦 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: $${fmt(finalBalance)}\n━━━━━━━━━━━━━━━━━━\n   𝐄𝐗𝐄𝐂𝐔𝐓𝐄𝐃 𝐁𝐘 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐋𝐈𝐓𝐄`;

    return api.sendMessage(msg, threadID, messageID);
  }
};
