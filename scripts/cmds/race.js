const fmt = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

module.exports = {
  config: {
    name: "race",
    aliases: ["horse", "derby"],
    version: "1.0.1",
    author: "Minh Anh",
    countDown: 5,
    role: 0,
    category: "economy",
    guide: {
      en: "{p}race [horse_number] [amount]"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID, senderID } = event;

    if (!global.sovereignRace) global.sovereignRace = new Map();

    const horses = [
      { id: 1, name: "Gold Ship", mult: 2n },
      { id: 2, name: "Special Week", mult: 3n },
      { id: 3, name: "Tokai Teio", mult: 5n },
      { id: 4, name: "Oguri Cap", mult: 10n },
      { id: 5, name: "Agnes Tachyon", mult: 50n }
    ];

    const horseChoice = parseInt(args[0]);
    const betAmountInput = args[1] ? args[1].toLowerCase() : null;

    if (isNaN(horseChoice) || horseChoice < 1 || horseChoice > 5 || !betAmountInput) {
      let menu = "🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐃𝐄𝐑𝐁𝐘\n━━━━━━━━━━━━━━━━━━\n";
      horses.forEach(h => menu += "[" + h.id + "] " + h.name + " (" + h.mult + "x)\n");
      menu += "━━━━━━━━━━━━━━━━━━\n💡 𝐔𝐬𝐚𝐠𝐞: {p}race [ID] [amount]";
      return api.sendMessage(menu, threadID, messageID);
    }

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

    let session = global.sovereignRace.get(threadID);

    if (!session) {
      session = {
        bets: [],
        timer: null
      };
      global.sovereignRace.set(threadID, session);

      api.sendMessage(
        "🏛️ 𝐓𝐇𝐄 𝐆𝐑𝐀𝐍𝐃 𝐃𝐄𝐑𝐁𝐘 𝐈𝐒 𝐎𝐏𝐄𝐍\n" +
        "━━━━━━━━━━━━━━━━━━\n" +
        "🏁 𝐒𝐭𝐚𝐭𝐮𝐬: 𝐏𝐥𝐚𝐜𝐢𝐧𝐠 𝐁𝐞𝐭𝐬...\n" +
        "⏳ 𝐒𝐭𝐚𝐫𝐭𝐢𝐧𝐠 𝐢𝐧: 𝟏𝟓 𝐒𝐞𝐜𝐨𝐧𝐝𝐬\n" +
        "⚠️ 𝐌𝐢𝐧𝐢𝐦𝐮𝐦 𝟐 𝐩𝐥𝐚𝐲𝐞𝐫𝐬 𝐫𝐞𝐪𝐮𝐢𝐫𝐞𝐝.\n" +
        "━━━━━━━━━━━━━━━━━━",
        threadID
      );

      session.timer = setTimeout(() => this.runRace(api, threadID, horses, usersData), 15000);
    }

    session.bets.push({ id: senderID, horse: horseChoice, stake: betAmount, name: await usersData.getName(senderID) });
    api.sendMessage("🏇 " + (await usersData.getName(senderID)) + " backed Horse #" + horseChoice + " with $" + fmt(betAmount) + ".", threadID);
  },

  runRace: async function (api, threadID, horses, usersData) {
    const session = global.sovereignRace.get(threadID);
    if (!session) return;

    // MANDATORY PARTICIPATION CHECK
    if (session.bets.length < 2) {
      api.sendMessage("⚠️ 𝐃𝐄𝐑𝐁𝐘 𝐂𝐀𝐍𝐂𝐄𝐋𝐋𝐄𝐃: Insufficient competition. At least 2 operators must place bets to start the race.", threadID);
      return global.sovereignRace.delete(threadID);
    }

    const rand = Math.random() * 100;
    let winningId;
    if (rand < 45) winningId = 1;
    else if (rand < 70) winningId = 2;
    else if (rand < 85) winningId = 3;
    else if (rand < 95) winningId = 4;
    else winningId = 5;

    const winnerHorse = horses.find(h => h.id === winningId);
    let winnersList = [];

    for (let bet of session.bets) {
      const pData = await usersData.get(bet.id);
      const currentMoney = BigInt(pData.data.money || "0");

      if (bet.horse === winningId) {
        const payout = bet.stake * winnerHorse.mult;
        const profit = payout - bet.stake;
        await usersData.set(bet.id, { data: { ...pData.data, money: (currentMoney + profit).toString() } });
        winnersList.push(bet.name + " (+$" + fmt(profit) + ")");
      } else {
        await usersData.set(bet.id, { data: { ...pData.data, money: (currentMoney - bet.stake).toString() } });
      }
    }

    let msg = "🏛️ 𝐃𝐄𝐑𝐁𝐘 𝐅𝐈𝐍𝐈𝐒𝐇 𝐋𝐈𝐍𝐄\n" +
              "━━━━━━━━━━━━━━━━━━\n" +
              "🏆 𝐖𝐈𝐍𝐍𝐄𝐑: #" + winningId + " " + winnerHorse.name.toUpperCase() + "\n" +
              "⚡ 𝐎𝐝𝐝𝐬: " + winnerHorse.mult + "𝐱\n" +
              "━━━━━━━━━━━━━━━━━━\n";
    
    if (winnersList.length > 0) {
      msg += "💰 𝐏𝐀𝐘𝐎𝐔𝐓𝐒:\n" + winnersList.join("\n") + "\n";
    } else {
      msg += "💀 𝐍𝐨 𝐨𝐧𝐞 𝐛𝐚𝐜𝐤𝐞𝐝 𝐭𝐡𝐞 𝐰𝐢𝐧𝐧𝐞𝐫.\n";
    }
    
    msg += "━━━━━━━━━━━━━━━━━━\n" +
           "   𝐄𝐗𝐄𝐂𝐔𝐓𝐄𝐃 𝐁𝐘 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐋𝐈𝐓𝐄";

    api.sendMessage(msg, threadID);
    global.sovereignRace.delete(threadID);
  }
};
