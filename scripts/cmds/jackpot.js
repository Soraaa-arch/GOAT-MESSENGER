const fmt = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

module.exports = {
  config: {
    name: "jackpot",
    aliases: ["jp", "pool"],
    version: "1.0.1",
    author: "Minh Anh",
    countDown: 5,
    role: 0,
    category: "economy",
    guide: {
      en: "{p}jackpot [amount]"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID, senderID } = event;

    if (!global.sovereignJackpot) global.sovereignJackpot = new Map();

    const betAmountInput = args[0] ? args[0].toLowerCase() : null;
    if (!betAmountInput) return api.sendMessage("🏛️ 𝐉𝐀𝐂𝐊𝐏𝐎𝐓 𝐏𝐑𝐎𝐓𝐎𝐂𝐎𝐋\n━━━━━━━━━━━━━━━━━━\n💡 {p}jackpot [amount]", threadID, messageID);

    const userData = await usersData.get(senderID);
    const userMoney = BigInt(userData.data.money || "0");

    let betAmount;
    if (betAmountInput === "all") {
      betAmount = userMoney;
    } else {
      betAmount = BigInt(betAmountInput.replace(/[^0-9]/g, ""));
    }

    if (betAmount <= 0n) return api.sendMessage("❌ 𝐈𝐍𝐕𝐀𝐋𝐈𝐃 𝐒𝐓𝐀𝐊𝐄.", threadID, messageID);
    if (betAmount > userMoney) return api.sendMessage("❌ 𝐈𝐍𝐒𝐔𝐅𝐅𝐈𝐂𝐈𝐄𝐍𝐓 𝐂𝐑𝐄𝐃𝐈𝐓𝐒.", threadID, messageID);

    let session = global.sovereignJackpot.get(threadID);

    if (!session) {
      session = {
        players: [],
        totalPot: 0n,
        timer: null
      };
      global.sovereignJackpot.set(threadID, session);

      api.sendMessage(
        "🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐉𝐀𝐂𝐊𝐏𝐎𝐓 𝐎𝐏𝐄𝐍\n" +
        "━━━━━━━━━━━━━━━━━━\n" +
        "💰 𝐈𝐧𝐢𝐭𝐢𝐚𝐥 𝐃𝐞𝐩𝐨𝐬𝐢𝐭: $" + fmt(betAmount) + "\n" +
        "👤 𝐇𝐨𝐬𝐭: " + (await usersData.getName(senderID)) + "\n\n" +
        "⏳ 𝐒𝐭𝐚𝐭𝐮𝐬: 𝐀𝐜𝐜𝐞𝐩𝐭𝐢𝐧𝐠 𝐄𝐧𝐭𝐫𝐢𝐞𝐬...\n" +
        "⏱️ 𝐖𝐢𝐧𝐝𝐨𝐰: 𝟏𝟓 𝐒𝐞𝐜𝐨𝐧𝐝𝐬\n" +
        "━━━━━━━━━━━━━━━━━━",
        threadID
      );

      session.timer = setTimeout(() => this.drawWinner(api, threadID, usersData), 15000);
    }

    const existingPlayer = session.players.find(p => p.id === senderID);
    if (existingPlayer) {
      existingPlayer.stake += betAmount;
    } else {
      session.players.push({ id: senderID, name: await usersData.getName(senderID), stake: betAmount });
    }

    session.totalPot += betAmount;
    api.sendMessage("🎟️ " + (await usersData.getName(senderID)) + " added $" + fmt(betAmount) + " to the pot.", threadID);
  },

  drawWinner: async function (api, threadID, usersData) {
    const session = global.sovereignJackpot.get(threadID);
    if (!session) return;

    if (session.players.length < 2) {
      api.sendMessage("⚠️ 𝐉𝐀𝐂𝐊𝐏𝐎𝐓 𝐃𝐈𝐒𝐒𝐎𝐋𝐕𝐄𝐃: Insufficient participation.", threadID);
      return global.sovereignJackpot.delete(threadID);
    }

    const participants = [];
    session.players.forEach(p => {
      const tickets = Number((p.stake * 100n) / session.totalPot);
      for (let i = 0; i < tickets; i++) participants.push(p);
    });

    const winner = participants[Math.floor(Math.random() * participants.length)];
    const winAmount = session.totalPot;

    for (let player of session.players) {
      const pData = await usersData.get(player.id);
      const currentMoney = BigInt(pData.data.money || "0");
      
      if (player.id === winner.id) {
        const netProfit = winAmount - player.stake;
        await usersData.set(player.id, { data: { ...pData.data, money: (currentMoney + netProfit).toString() } });
      } else {
        await usersData.set(player.id, { data: { ...pData.data, money: (currentMoney - player.stake).toString() } });
      }
    }

    let msg = "🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐉𝐀𝐂𝐊𝐏𝐎𝐓 𝐑𝐄𝐒𝐔𝐋𝐓𝐒\n" +
              "━━━━━━━━━━━━━━━━━━\n" +
              "🏆 𝐖𝐈𝐍𝐍𝐄𝐑: " + winner.name.toUpperCase() + "\n" +
              "💰 𝐓𝐎𝐓𝐀𝐋 𝐏𝐎𝐓: $" + fmt(winAmount) + "\n" +
              "📈 𝐖𝐢𝐧 𝐂𝐡𝐚𝐧𝐜𝐞: " + ((Number(winner.stake) / Number(session.totalPot)) * 100).toFixed(2) + "%\n" +
              "━━━━━━━━━━━━━━━━━━\n" +
              "👥 𝐏𝐚𝐫𝐭𝐢𝐜𝐢𝐩𝐚𝐧𝐭𝐬: " + session.players.length + "\n" +
              "━━━━━━━━━━━━━━━━━━\n" +
              "   𝐄𝐗𝐄𝐂𝐔𝐓𝐄𝐃 𝐁𝐘 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐋𝐈𝐓𝐄";

    api.sendMessage(msg, threadID);
    global.sovereignJackpot.delete(threadID);
  }
};
