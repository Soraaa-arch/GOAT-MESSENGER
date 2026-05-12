const fmt = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

module.exports = {
  config: {
    name: "poker",
    aliases: ["table", "holdem"],
    version: "1.1.2",
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

    // Initialize global storage if it's missing
    if (!global.sovereignPoker) global.sovereignPoker = new Map();

    const betAmount = BigInt(args[0]?.replace(/[^0-9]/g, '') || "1000000");
    const userData = await usersData.get(senderID);
    const userMoney = BigInt(userData.data.money || "0");

    if (userMoney < betAmount) {
        return api.sendMessage("❌ 𝐈𝐍𝐒𝐔𝐅𝐅𝐈𝐂𝐈𝐄𝐍𝐓 𝐂𝐑𝐄𝐃𝐈𝐓𝐒.", threadID, messageID);
    }

    let table = global.sovereignPoker.get(threadID);

    // If no table exists, create one
    if (!table) {
      table = {
        active: true,
        stake: betAmount,
        players: [{ id: senderID, name: await usersData.getName(senderID) }],
        mainMessageID: null
      };
      global.sovereignPoker.set(threadID, table);

      co🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐓𝐀𝐁𝐋𝐄 𝐎𝐏𝐄𝐍𝐄𝐃\n𝐀𝐁𝐋𝐄 𝐎𝐏𝐄𝐍𝐄𝐃\n` +
                      ━━━━━━━━━━━━━━━━━━\n +
                💰 𝐒𝐭𝐚𝐤𝐞: $${fmt(betAmount)}\nt)}\n` +
                 👤 𝐇𝐨𝐬𝐭: ${table.players[0].name}\n\n\n\n` +
⏳ 𝐒𝐭𝐚𝐭𝐮𝐬: 𝐁𝐥𝐢𝐭𝐳 𝐑𝐞𝐜𝐫𝐮𝐢𝐭𝐦𝐞𝐧𝐭...\n𝐥𝐢𝐭𝐳 𝐑𝐞𝐜𝐫𝐮𝐢𝐭𝐦𝐞𝐧𝐭...\n` +
       ⏱️ 𝐖𝐢𝐧𝐝𝐨𝐰: 𝟏𝟎 𝐒𝐞𝐜𝐨𝐧𝐝𝐬\n: 𝟏𝟎 𝐒𝐞𝐜𝐨𝐧𝐝𝐬\n` +
                      ━━━━━━━━━━━━━━━━━━;

      api.sendMessage(msgBody, threadID, (err, info) => {
        if (err) return console.error(err);
        table.mainMessageID = info.messageID;

        // Set the hard 10-second timer
        setTimeout(() => {
          this.executeGame(api, threadID, usersData);
        }, 10000);
      }, messageID);

    } else {
      // Logic for joining an existing table
      if (table.players.find(p => p.id === senderID)) {
          return api.sendMessage("⚠️ You are already in the sequence.", threadID, messageID);
      }
      if (table.players.length >= 5) {
          return api.sendMessage("❌ 𝐓𝐀𝐁𝐋𝐄 𝐅𝐔𝐋𝐋.", threadID, messageID);
      }

      table.players.push({ id: senderID, name: await usersData.getName(senderID) });
      return api.sendMessage(✅ ${await usersData.getName(senderID)} matched the stake. [${table.players.length}/5], threadID);
    }
  },

  executeGame: async function (api, threadID, usersData) {
    const table = global.sovereignPoker.get(threadID);
    if (!table) return;

    const { players, stake, mainMessageID } = table;

    if (players.length < 2) {
      api.sendMessage("⚠️ 𝐃𝐔𝐄𝐋 𝐂𝐀𝐍𝐂𝐄𝐋𝐋𝐄𝐃: Insufficient participation.", threadID);
      return global.sovereignPoker.delete(threadID);
    }

    const winnerIndex = Math.floor(Math.random() * players.length);
    const winner = players[winnerIndex];
    const totalPot = stake * BigInt(players.length);

    // Transaction Logic
    for (let player of players) {
      const pData = await usersData.get(player.id);
      const currentMoney = BigInt(pData.data.money || "0");
      const finalMoney = (player.id === winner.id) 
        ? (currentMoney + (totalPot - stake)) 
        : (currentMoney - stake);
      
      await usersData.set(player.id, { data: { ...pData.data, money: finalMoney.toString() } });
  🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐏𝐎𝐊𝐄𝐑 𝐑𝐄𝐒𝐔𝐋𝐓𝐒\n 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐏𝐎𝐊𝐄𝐑 𝐑𝐄𝐒𝐔𝐋𝐓𝐒\n` +
      ━━━━━━━━━━━━━━━━━━\n━━━━━━━━━━━━━\n` +
   🏆 𝐖𝐈𝐍𝐍𝐄𝐑: ${winner.name.toUpperCase()}\ne.toUpperCase()}\n` +
     💰 𝐓𝐎𝐓𝐀𝐋 𝐏𝐎𝐓: $${fmt(totalPot)}\nfmt(totalPot)}\n` +
👥 𝐏𝐥𝐚𝐲𝐞𝐫𝐬: ${players.length}\n: ${players.length}\n` +
        ━━━━━━━━━━━━━━━━━━\n━━━━━━━━━━━\n` +
        📉 𝐎𝐮𝐭𝐦𝐚𝐧𝐞𝐮𝐯𝐞𝐫𝐞𝐝: ${players.filter(p => p.id !== winner.id).length} Operators\n} Operators\n` ━━━━━━━━━━━━━━━━━━\n  `━━━━━━━━━━━━━━━━━━\n`    𝐄𝐗𝐄𝐂𝐔𝐓𝐄𝐃 𝐁𝐘 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐋𝐈𝐓𝐄𝐔𝐓𝐄𝐃 𝐁𝐘 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐋𝐈𝐓𝐄`;

    api.sendMessage(resultMsg, threadID);
    global.sovereignPoker.delete(threadID);
  }
};
