const fmt = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

module.exports = {
  config: {
    name: "race",
    aliases: ["horse", "derby"],
    version: "2.0.0",
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

    const horses = [
      { id: 1, name: "Gold Ship", mult: 2n },
      { id: 2, name: "Special Week", mult: 3n },
      { id: 3, name: "Tokai Teio", mult: 5n },
      { id: 4, name: "Oguri Cap", mult: 10n },
      { id: 5, name: "Agnes Tachyon", mult: 50n }
    ];

    const horseChoice = parseInt(args[0]);
    const betAmountInput = args[1] ? args[1].toLowerCase() : null;

    // --- MENU DISPLAY ---
    if (isNaN(horseChoice) || horseChoice < 1 || horseChoice > 5 || !betAmountInput) {
      let menu = "🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐃𝐄𝐑𝐁𝐘\n━━━━━━━━━━━━━━━━━━\n";
      horses.forEach(h => menu += `[${h.id}] ${h.name} (${h.mult}x)\n`);
      menu += "━━━━━━━━━━━━━━━━━━\n💡 𝐔𝐬𝐚𝐠𝐞: {p}race [ID] [amount]";
      return api.sendMessage(menu, threadID, messageID);
    }

    try {
      const userData = await usersData.get(senderID);
      
      // Safe extraction for different DB structures
      const extract = (val) => {
        if (typeof val === 'object' && val !== null) {
          return val.money || val.bank || Object.values(val)[0] || "0";
        }
        return val || "0";
      };

      const rawMoney = extract(userData.data?.money || userData.money).toString().split('.')[0].replace(/[^0-9]/g, '');
      const userMoney = BigInt(rawMoney || "0");

      let betAmount;
      if (betAmountInput === "all") {
        betAmount = userMoney;
      } else {
        betAmount = BigInt(betAmountInput.replace(/[^0-9]/g, ""));
      }

      if (betAmount <= 0n) return api.sendMessage("❌ 𝐈𝐍𝐕𝐀𝐋𝐈𝐃 𝐒𝐓𝐀𝐊𝐄.", threadID, messageID);
      if (betAmount > userMoney) return api.sendMessage("❌ 𝐈𝐍𝐒𝐔𝐅𝐅𝐈𝐂𝐈𝐄𝐍𝐓 𝐂𝐑𝐄𝐃𝐈𝐓𝐒.", threadID, messageID);

      // --- RACE EXECUTION ---
      const rand = Math.random() * 100;
      let winningId;
      if (rand < 45) winningId = 1;
      else if (rand < 70) winningId = 2;
      else if (rand < 85) winningId = 3;
      else if (rand < 95) winningId = 4;
      else winningId = 5;

      const winnerHorse = horses.find(h => h.id === winningId);
      const isWin = horseChoice === winningId;
      
      let finalBalance;
      let resultMsg = "";

      if (isWin) {
        const payout = betAmount * winnerHorse.mult;
        const profit = payout - betAmount;
        finalBalance = userMoney + profit;
        resultMsg = `🏆 𝐖𝐈𝐍𝐍𝐄𝐑: #${winningId} ${winnerHorse.name.toUpperCase()}\n💰 𝐏𝐫𝐨𝐟𝐢𝐭: +$${fmt(profit)}`;
      } else {
        finalBalance = userMoney - betAmount;
        resultMsg = `💀 𝐃𝐄𝐅𝐄𝐀𝐓\n🏆 𝐖𝐢𝐧𝐧𝐞𝐫 𝐰𝐚𝐬: #${winningId} ${winnerHorse.name.toUpperCase()}\n💸 𝐋𝐨𝐬𝐬: -$${fmt(betAmount)}`;
      }

      // Save to database
      await usersData.set(senderID, { 
        money: finalBalance.toString(),
        data: { ...userData.data, money: finalBalance.toString() } 
      });

      // --- FINAL OUTPUT ---
      let msg = `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐃𝐄𝐑𝐁𝐘\n`;
      msg += `━━━━━━━━━━━━━━━━━━\n`;
      msg += `${resultMsg}\n`;
      msg += `⚡ 𝐎𝐝𝐝𝐬: ${winnerHorse.mult}𝐱\n`;
      msg += `━━━━━━━━━━━━━━━━━━\n`;
      msg += `🏦 𝐍𝐞𝐰 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: $${fmt(finalBalance)}\n`;
      msg += `━━━━━━━━━━━━━━━━━━\n`;
      msg += `   𝐄𝐗𝐄𝐂𝐔𝐓𝐄𝐃 𝐁𝐘 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐋𝐈𝐓𝐄`;

      return api.sendMessage(msg, threadID, messageID);

    } catch (err) {
      return api.sendMessage(`❌ 𝐃𝐚𝐭𝐚𝐛𝐚𝐬𝐞 𝐄𝐫𝐫𝐨𝐫: ${err.message}`, threadID, messageID);
    }
  }
};
