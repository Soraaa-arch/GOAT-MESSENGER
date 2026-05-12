const fmt = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

module.exports = {
  config: {
    name: "dice",
    aliases: ["roll", "dicepoker"],
    version: "1.0.0",
    author: "Minh Anh",
    countDown: 5,
    role: 0,
    category: "economy",
    guide: {
      en: "{p}dice [amount]"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID, senderID } = event;

    if (!global.sovereignDice) global.sovereignDice = new Map();

    const betAmountInput = args[0] ? args[0].toLowerCase() : null;
    if (!betAmountInput) return api.sendMessage("🏛️ 𝐃𝐈𝐂𝐄 𝐏𝐑𝐎𝐓𝐎𝐂𝐎𝐋\n━━━━━━━━━━━━━━━━━━\n💡 {p}dice [amount]", threadID, messageID);

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

    let session = global.sovereignDice.get(threadID);

    if (!session) {
      session = {
        stake: betAmount,
        players: [],
        timer: null
      };
      global.sovereignDice.set(threadID, session);

      api.sendMessage(
        "🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐃𝐈𝐂𝐄 𝐋𝐎𝐁𝐁𝐘\n" +
        "━━━━━━━━━━━━━━━━━━\n" +
        "💰 𝐄𝐧𝐭𝐫𝐲 𝐅𝐞𝐞: $" + fmt(betAmount) + "\n" +
        "👤 𝐇𝐨𝐬𝐭: " + (await usersData.getName(senderID)) + "\n\n" +
        "⏳ 𝐒𝐭𝐚𝐭𝐮𝐬: 𝐀𝐜𝐜𝐞𝐩𝐭𝐢𝐧𝐠 𝐑𝐨𝐥𝐥𝐞𝐫𝐬...\n" +
        "⏱️ 𝐖𝐢𝐧𝐝𝐨𝐰: 𝟏𝟓 𝐒𝐞𝐜𝐨𝐧𝐝𝐬\n" +
        "⚠️ 𝐌𝐢𝐧𝐢𝐦𝐮𝐦 𝟐 𝐩𝐥𝐚𝐲𝐞𝐫𝐬 𝐫𝐞𝐪𝐮𝐢𝐫𝐞𝐝.\n" +
        "━━━━━━━━━━━━━━━━━━",
        threadID
      );

      session.timer = setTimeout(() => this.executeRolls(api, threadID, usersData), 15000);
    }

    if (session.players.find(p => p.id === senderID)) return api.sendMessage("⚠️ You are already in the duel.", threadID, messageID);
    if (session.players.length >= 10) return api.sendMessage("❌ 𝐋𝐎𝐁𝐁𝐘 𝐅𝐔𝐋𝐋.", threadID, messageID);

    session.players.push({ id: senderID, name: await usersData.getName(senderID) });
    api.sendMessage("🎲 " + (await usersData.getName(senderID)) + " entered the pit. [" + session.players.length + "/10]", threadID);
  },

  executeRolls: async function (api, threadID, usersData) {
    const session = global.sovereignDice.get(threadID);
    if (!session) return;

    if (session.players.length < 2) {
      api.sendMessage("⚠️ 𝐃𝐔𝐄𝐋 𝐀𝐁𝐎𝐑𝐓𝐄𝐃: Insufficient operators. Find a rival to roll.", threadID);
      return global.sovereignDice.delete(threadID);
    }

    let results = [];
    let maxRoll = 0;

    // Roll logic
    for (let player of session.players) {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const total = d1 + d2;
      
      if (total > maxRoll) maxRoll = total;
      results.push({ ...player, roll: total, dice: "🎲 " + d1 + " + " + d2 });
    }

    const winners = results.filter(p => p.roll === maxRoll);
    const totalPot = session.stake * BigInt(session.players.length);
    const payoutPerWinner = totalPot / BigInt(winners.length);

    // Ledger update
    for (let player of session.players) {
      const pData = await usersData.get(player.id);
      const currentMoney = BigInt(pData.data.money || "0");
      const isWinner = winners.find(w => w.id === player.id);

      if (isWinner) {
        const netProfit = payoutPerWinner - session.stake;
        await usersData.set(player.id, { data: { ...pData.data, money: (currentMoney + netProfit).toString() } });
      } else {
        await usersData.set(player.id, { data: { ...pData.data, money: (currentMoney - session.stake).toString() } });
      }
    }

    let msg = "🏛️ 𝐃𝐈𝐂𝐄 𝐃𝐔𝐄𝐋 𝐑𝐄𝐒𝐔𝐋𝐓𝐒\n" +
              "━━━━━━━━━━━━━━━━━━\n";
    
    results.sort((a, b) => b.roll - a.roll).forEach(p => {
      const crown = p.roll === maxRoll ? "🏆 " : "💀 ";
      msg += crown + p.name + ": " + p.dice + " (" + p.roll + ")\n";
    });

    msg += "━━━━━━━━━━━━━━━━━━\n" +
           "💰 𝐓𝐎𝐓𝐀𝐋 𝐏𝐎𝐓: $" + fmt(totalPot) + "\n" +
           "✨ 𝐖𝐈𝐍𝐍𝐄𝐑(𝐒): " + winners.map(w => w.name).join(", ") + "\n" +
           "━━━━━━━━━━━━━━━━━━\n" +
           "   𝐄𝐗𝐄𝐂𝐔𝐓𝐄𝐃 𝐁𝐘 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐋𝐈𝐓𝐄";

    api.sendMessage(msg, threadID);
    global.sovereignDice.delete(threadID);
  }
};
