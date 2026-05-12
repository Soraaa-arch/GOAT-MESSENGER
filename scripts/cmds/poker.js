const fmt = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

module.exports = {
  config: {
    name: "poker",
    aliases: ["table", "holdem"],
    version: "1.1.0",
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

    if (userMoney < betAmount) return api.sendMessage("❌ 𝐈𝐍𝐒𝐔𝐅𝐅𝐈𝐂𝐈𝐄𝐍𝐓 𝐂𝐑𝐄𝐃𝐈𝐓𝐒.", threadID, messageID);

    let table = global.sovereignPoker.get(threadID);

    if (!table) {
      table = {
        active: true,
        stake: betAmount,
        players: [],
        mainMessageID: null
      };
      global.sovereignPoker.set(threadID, table);

      const initialMsg = await api.sendMessage(
        `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐓𝐀𝐁𝐋𝐄 𝐎𝐏𝐄𝐍𝐄𝐃\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `💰 𝐒𝐭𝐚𝐤𝐞: $${fmt(betAmount)}\n` +
        `👤 𝐇𝐨𝐬𝐭: ${await usersData.getName(senderID)}\n\n` +
        `⏳ 𝐒𝐭𝐚𝐭𝐮𝐬: 𝐑𝐞𝐜𝐫𝐮𝐢𝐭𝐢𝐧𝐠 𝐎𝐩𝐞𝐫𝐚𝐭𝐨𝐫𝐬... (𝐌𝐚𝐱 𝟓)\n` +
        `━━━━━━━━━━━━━━━━━━`,
        threadID
      );
      
      table.mainMessageID = initialMsg.messageID;
      table.players.push({ id: senderID, name: await usersData.getName(senderID) });

      // Start the 30-second countdown
      setTimeout(() => this.executeGame(api, threadID, usersData), 30000);
    } else {
      // Joining existing table
      if (table.players.find(p => p.id === senderID)) return;
      if (table.players.length >= 5) return api.sendMessage("❌ 𝐓𝐀𝐁𝐋𝐄 𝐅𝐔𝐋𝐋.", threadID, messageID);

      table.players.push({ id: senderID, name: await usersData.getName(senderID) });
      
      // Feedback for joining
      api.sendMessage(`✅ ${await usersData.getName(senderID)} matched the stake. [${table.players.length}/5]`, threadID);
    }
  },

  executeGame: async function (api, threadID, usersData) {
    const table = global.sovereignPoker.get(threadID);
    if (!table) return;

    if (table.players.length < 2) {
      api.editMessage("⚠️ 𝐃𝐔𝐄𝐋 𝐂𝐀𝐍𝐂𝐄𝐋𝐋𝐄𝐃: Insufficient operator participation.", table.mainMessageID);
      return global.sovereignPoker.delete(threadID);
    }

    const winnerIndex = Math.floor(Math.random() * table.players.length);
    const winner = table.players[winnerIndex];
    const totalPot = table.stake * BigInt(table.players.length);

    // Process Ledger
    for (let player of table.players) {
      const pData = await usersData.get(player.id);
      const currentMoney = BigInt(pData.data.money || "0");
      const finalMoney = (player.id === winner.id) ? (currentMoney + (totalPot - table.stake)) : (currentMoney - table.stake);
      await usersData.set(player.id, { data: { ...pData.data, money: finalMoney.toString() } });
    }

    // Prepare Result UI
    let msg = `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐏𝐎𝐊𝐄𝐑 𝐑𝐄𝐒𝐔𝐋𝐓𝐒\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `🏆 𝐖𝐈𝐍𝐍𝐄𝐑: ${winner.name.toUpperCase()}\n`;
    msg += `💰 𝐓𝐎𝐓𝐀𝐋 𝐏𝐎𝐓: $${fmt(totalPot)}\n`;
    msg += `👥 𝐏𝐥𝐚𝐲𝐞𝐫𝐬: ${table.players.length}\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `📉 𝐎𝐮𝐭𝐦𝐚𝐧𝐞𝐮𝐯𝐞𝐫𝐞𝐝: ${table.players.filter(p => p.id !== winner.id).length} Operators\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `   𝐄𝐗𝐄𝐂𝐔𝐓𝐄𝐃 𝐁𝐘 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐋𝐈𝐓𝐄`;

    // The Magic: Edit the original recruitment message with the results
    api.editMessage(msg, table.mainMessageID);
    global.sovereignPoker.delete(threadID);
  }
};
