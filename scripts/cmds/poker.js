const fmt = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

module.exports = {
  config: {
    name: "poker",
    aliases: ["table", "holdem"],
    version: "1.0.0",
    author: "Minh Anh",
    countDown: 10,
    role: 0,
    category: "economy",
    guide: {
      en: "{p}poker [bet_amount]"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID, senderID } = event;

    // Initialize global table if it doesn't exist
    if (!global.sovereignPoker) global.sovereignPoker = new Map();

    const betAmount = BigInt(args[0]?.replace(/[^0-9]/g, '') || "1000000"); // Default 1M
    const userData = await usersData.get(senderID);
    const userMoney = BigInt(userData.data.money || "0");

    if (userMoney < betAmount) return api.sendMessage("❌ 𝐈𝐍𝐒𝐔𝐅𝐅𝐈𝐂𝐈𝐄𝐍𝐓 𝐂𝐑𝐄𝐃𝐈𝐓𝐒: You cannot match the table stake.", threadID, messageID);

    // Get or create table session for this thread
    let table = global.sovereignPoker.get(threadID);

    if (!table) {
      table = {
        active: true,
        stake: betAmount,
        players: [],
        timer: null
      };
      global.sovereignPoker.set(threadID, table);

      api.sendMessage(
        `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐓𝐀𝐁𝐋𝐄 𝐎𝐏𝐄𝐍𝐄𝐃\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `💰 𝐒𝐭𝐚𝐤𝐞: $${fmt(betAmount)}\n` +
        `👤 𝐇𝐨𝐬𝐭: ${await usersData.getName(senderID)}\n\n` +
        `🎮 𝐓𝐲𝐩𝐞 'join' to enter the sequence.\n` +
        `⏳ 𝐒𝐭𝐚𝐫𝐭𝐢𝐧𝐠 𝐢𝐧 𝟑𝟎 𝐬𝐞𝐜𝐨𝐧𝐝𝐬... (𝐌𝐚𝐱 𝟓)`,
        threadID
      );

      table.timer = setTimeout(() => this.executeGame(api, threadID, usersData), 30000);
    }

    // Join logic handled in handleReply or here if simple
    if (table.players.find(p => p.id === senderID)) return;
    if (table.players.length >= 5) return api.sendMessage("❌ 𝐓𝐀𝐁𝐋𝐄 𝐅𝐔𝐋𝐋: The maximum operator capacity has been reached.", threadID, messageID);

    table.players.push({ id: senderID, name: await usersData.getName(senderID) });
    api.sendMessage(`✅ ${await usersData.getName(senderID)} has joined the table. [${table.players.length}/5]`, threadID);
  },

  executeGame: async function (api, threadID, usersData) {
    const table = global.sovereignPoker.get(threadID);
    if (!table) return;

    if (table.players.length < 2) {
      global.sovereignPoker.delete(threadID);
      return api.sendMessage("⚠️ 𝐃𝐔𝐄𝐋 𝐂𝐀𝐍𝐂𝐄𝐋𝐋𝐄𝐃: Not enough operators joined the sequence.", threadID);
    }

    const winnerIndex = Math.floor(Math.random() * table.players.length);
    const winner = table.players[winnerIndex];
    const totalPot = table.stake * BigInt(table.players.length);

    // Process Ledger Updates
    for (let player of table.players) {
      const pData = await usersData.get(player.id);
      const currentMoney = BigInt(pData.data.money || "0");
      
      if (player.id === winner.id) {
        const netProfit = totalPot - table.stake;
        await usersData.set(player.id, { data: { ...pData.data, money: (currentMoney + netProfit).toString() } });
      } else {
        await usersData.set(player.id, { data: { ...pData.data, money: (currentMoney - table.stake).toString() } });
      }
    }

    let msg = `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐏𝐎𝐊𝐄𝐑 𝐑𝐄𝐒𝐔𝐋𝐓𝐒\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `🏆 𝐖𝐈𝐍𝐍𝐄𝐑: ${winner.name.toUpperCase()}\n`;
    msg += `💰 𝐓𝐎𝐓𝐀𝐋 𝐏𝐎𝐓: $${fmt(totalPot)}\n`;
    msg += `👥 𝐏𝐥𝐚𝐲𝐞𝐫𝐬: ${table.players.length}\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `📉 𝐋𝐨𝐬𝐞𝐫𝐬: ${table.players.filter(p => p.id !== winner.id).map(p => p.name).join(", ")}\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `   𝐄𝐗𝐄𝐂𝐔𝐓𝐄𝐃 𝐁𝐘 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐋𝐈𝐓𝐄`;

    api.sendMessage(msg, threadID);
    global.sovereignPoker.delete(threadID);
  }
};
