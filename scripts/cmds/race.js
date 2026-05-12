const fmt = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

module.exports = {
  config: {
    name: "race",
    aliases: ["horse", "derby"],
    version: "1.0.0",
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

    // 1. HORSE DEFINITIONS (Number, Name, Multiplier)
    const horses = [
      { id: 1, name: "Sovereign Gold", mult: 2n },
      { id: 2, name: "Midnight Shadow", mult: 3n },
      { id: 3, name: "Crimson Bolt", mult: 5n },
      { id: 4, name: "Cyber Phantom", mult: 10n },
      { id: 5, name: "Eternal Void", mult: 50n } // The Longshot
    ];

    const horseChoice = parseInt(args[0]);
    const betAmountInput = args[1] ? args[1].toLowerCase() : null;

    if (isNaN(horseChoice) || horseChoice < 1 || horseChoice > 5 || !betAmountInput) {
      let menu = "🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐃𝐄𝐑𝐁𝐘\n━━━━━━━━━━━━━━━━━━\n";
      horses.forEach(h => menu += `[${h.id}] ${h.name} (${h.mult}x)\n`);
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
        "━━━━━━━━━━━━━━━━━━",
        threadID
      );

      session.timer = setTimeout(() => this.runRace(api, threadID, horses, usersData), 15000);
    }

    session.bets.push({ id: senderID, horse: horseChoice, stake: betAmount, name: await usersData.getName(senderID) });
    api.sendMessage(`🏇 ${await usersData.getName(senderID)} backed Horse #${horseChoice} with $${fmt(betAmount)}.`, threadID);
  },

  runRace: async function (api, threadID, horses, usersData) {
    const session = global.sovereignRace.get(threadID);
    if (!session) return;

    // Determine Winner based on rarity
    // Chance: 1 (45%), 2 (25%), 3 (15%), 4 (10%), 5 (5%)
    const rand = Math.random() * 100;
    let winningId;
    if (rand < 45) winningId = 1;
    else if (rand < 70) winningId = 2;
    else if (rand < 85) winningId = 3;
    else if (rand < 95) winningId = 4;
    else winningId = 5;

    const winnerHorse = horses.find(h => h.id === winningId);
    
    let winnersList = [];
    let losersList = [];

    for (let bet of session.bets) {
      const pData = await usersData.get(bet.id);
      const currentMoney = BigInt(pData.data.money || "0");

      if (bet.horse === winningId) {
        const payout = bet.stake * winnerHorse.mult;
        const profit = payout - bet.stake;
        await usersData.set(bet.id, { data: { ...pData.data, money: (currentMoney + profit).toString() } });
        winnersList.push(`${bet.name} (+$${fmt(profit)})`);
      } else {
        await usersData.set(bet.id, { data: { ...pData.data, money: (currentMoney - bet.stake).toString() } });
        losersList.push(bet.name);
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
