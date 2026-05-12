const fmt = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

module.exports = {
  config: {
    name: "poker",
    aliases: ["table", "holdem"],
    version: "1.2.1",
    author: "Minh Anh",
    countDown: 5,
    role: 0,
    category: "economy",
    guide: {
      en: "{p}poker [bet_amount]"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID, senderID } = event;

    if (!global.sovereignPoker) global.sovereignPoker = new Map();

    const betAmount = BigInt(args[0]?.replace(/[^0-9]/g, '') || "1000000");
    const userData = await usersData.get(senderID);
    const userMoney = BigInt(userData.data.money || "0");

    if (userMoney < betAmount) {
      return api.sendMessage("❌ 𝐈𝐍𝐒𝐔𝐅𝐅𝐈𝐂𝐈𝐄𝐍𝐓 𝐂𝐑𝐄𝐃𝐈𝐓𝐒.", threadID, messageID);
    }

    let table = global.sovereignPoker.get(threadID);

    if (!table) {
      table = {
        active: true,
        stake: betAmount,
        players: [{ id: senderID, name: await usersData.getName(senderID) }]
      };
      global.sovereignPoker.set(threadID, table);

      return api.sendMessage(
        "🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐓𝐀𝐁𝐋𝐄 𝐎𝐏𝐄𝐍𝐄𝐃\n" +
        "━━━━━━━━━━━━━━━━━━\n" +
        "💰 𝐒𝐭𝐚𝐤𝐞: $" + fmt(betAmount) + "\n" +
        "👤 𝐇𝐨𝐬𝐭: " + table.players[0].name + "\n\n" +
        "⏳ 𝐒𝐭𝐚𝐭𝐮𝐬: 𝐖𝐚𝐢𝐭𝐢𝐧𝐠 𝐟𝐨𝐫 𝐎𝐩𝐩𝐨𝐧𝐞𝐧𝐭...\n" +
        "💡 𝐆𝐚𝐦𝐞 𝐰𝐢𝐥𝐥 𝐬𝐭𝐚𝐫𝐭 𝐚𝐭 𝟐+ 𝐩𝐥𝐚𝐲𝐞𝐫𝐬.\n" +
        "━━━━━━━━━━━━━━━━━━",
        threadID, messageID
      );

    } else {
      if (table.players.find(p => p.id === senderID)) {
        return api.sendMessage("⚠️ You are already at the table.", threadID, messageID);
      }
      if (table.players.length >= 5) {
        return api.sendMessage("❌ 𝐓𝐀𝐁𝐋𝐄 𝐅𝐔𝐋𝐋.", threadID, messageID);
      }

      table.players.push({ id: senderID, name: await usersData.getName(senderID) });

      api.sendMessage("✅ " + (await usersData.getName(senderID)) + " joined. [" + table.players.length + "/5]\n⚡ 𝐄𝐗𝐄𝐂𝐔𝐓𝐈𝐍𝐆 𝐒𝐄𝐐𝐔𝐄𝐍𝐂𝐄...", threadID);
      
      setTimeout(() => this.executeGame(api, threadID, usersData), 1500);
    }
  },

  executeGame: async function (api, threadID, usersData) {
    const table = global.sovereignPoker.get(threadID);
    if (!table) return;

    const { players, stake } = table;
    const winnerIndex = Math.floor(Math.random() * players.length);
    const winner = players[winnerIndex];
    const totalPot = stake * BigInt(players.length);

    for (let player of players) {
      const pData = await usersData.get(player.id);
      const currentMoney = BigInt(pData.data.money || "0");
      const finalMoney = (player.id === winner.id) 
        ? (currentMoney + (totalPot - stake)) 
        : (currentMoney - stake);
      
      await usersData.set(player.id, { data: { ...pData.data, money: finalMoney.toString() } });
    }

    let resultMsg = "🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐏𝐎𝐊𝐄𝐑 𝐑𝐄𝐒𝐔𝐋𝐓𝐒\n" +
                    "━━━━━━━━━━━━━━━━━━\n" +
                    "🏆 𝐖𝐈𝐍𝐍𝐄𝐑: " + winner.name.toUpperCase() + "\n" +
                    "💰 𝐓𝐎𝐓𝐀𝐋 𝐏𝐎𝐓: $" + fmt(totalPot) + "\n" +
                    "👥 𝐏𝐥𝐚𝐲𝐞𝐫𝐬: " + players.length + "\n" +
                    "━━━━━━━━━━━━━━━━━━\n" +
                    "📉 𝐎𝐮𝐭𝐦𝐚𝐧𝐞𝐮𝐯𝐞𝐫𝐞𝐝: " + players.filter(p => p.id !== winner.id).map(p => p.name).join(", ") + "\n" +
                    "━━━━━━━━━━━━━━━━━━\n" +
                    "   𝐄𝐗𝐄𝐂𝐔𝐓𝐄𝐃 𝐁𝐘 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐋𝐈𝐓𝐄";

    api.sendMessage(resultMsg, threadID);
    global.sovereignPoker.delete(threadID);
  }
};
