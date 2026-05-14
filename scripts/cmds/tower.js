const fmt = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

module.exports = {
  config: {
    name: "tower",
    aliases: ["climb"],
    version: "2.6.0",
    author: "Minh Anh",
    countDown: 5,
    role: 0,
    category: "gambling",
    guide: { en: "{p}tower [amount]" }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID, senderID } = event;

    try {
      const extract = (val) => {
        if (typeof val === 'object' && val !== null) return val.money || val.bank || Object.values(val)[0] || "0";
        return val || "0";
      };

      const userData = await usersData.get(senderID);
      const userMoneyRaw = extract(userData.data?.money || userData.money);
      const userMoney = BigInt(userMoneyRaw.toString().split('.')[0].replace(/[^0-9]/g, '') || "0");

      if (!args[0]) return api.sendMessage("⚠️ 𝐄𝐧𝐭𝐞𝐫 𝐚 𝐛𝐞𝐭.", threadID, messageID);
      
      let betAmount;
      if (args[0].toLowerCase() === "all") {
        betAmount = userMoney;
      } else {
        const cleanAmount = args[0].replace(/[,|$]/g, '');
        if (isNaN(cleanAmount) || cleanAmount === "") return api.sendMessage("❌ 𝐈𝐍𝐕𝐀𝐋𝐈𝐃 𝐀𝐌𝐎𝐔𝐍𝐓.", threadID, messageID);
        betAmount = BigInt(cleanAmount);
      }

      if (betAmount <= 0n || betAmount > userMoney) return api.sendMessage("❌ 𝐈𝐧𝐬𝐮𝐟𝐟𝐢𝐜𝐢𝐞𝐧𝐭 𝐅𝐮𝐧𝐝𝐬.", threadID, messageID);

      /**
       * BUFFED LOGIC:
       * - Increased Floor 4 multiplier from 10x to 15x.
       * - Increased Floor 5 multiplier from 25x to 50x.
       * - Slightly improved survival rates on mid-floors.
       */
      const floors = [
        { level: 1, mult: 1.5, fail: 0.12 }, // 88% Success
        { level: 2, mult: 3.5, fail: 0.18 }, // 82% Success
        { level: 3, mult: 7.5, fail: 0.28 }, // 72% Success
        { level: 4, mult: 15.0, fail: 0.45 }, // 55% Success
        { level: 5, mult: 50.0, fail: 0.65 }  // 35% Success
      ];

      let currentFloor = 0;
      let success = true;
      let reachedLevel = 0;

      for (const floor of floors) {
        if (Math.random() < floor.fail) {
          success = false;
          reachedLevel = floor.level - 1;
          break;
        }
        reachedLevel = floor.level;
      }

      const winMult = success ? floors[4].mult : 0;
      const winAmount = BigInt(Math.floor(Number(betAmount) * winMult));
      const finalBalance = userMoney - betAmount + winAmount;

      await usersData.set(senderID, { 
        money: finalBalance.toString(), 
        data: { ...userData.data, money: finalBalance.toString() } 
      });

      let msg = `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐓𝐎𝐖𝐄𝐑\n━━━━━━━━━━━━━━━━━━\n`;
      msg += `📥 𝐖𝐚𝐠𝐞𝐫: $${fmt(betAmount)}\n🪜 𝐀𝐬𝐜𝐞𝐧𝐭: Floor ${reachedLevel} / 5\n━━━━━━━━━━━━━━━━━━\n`;
      msg += `${success ? "🏰 𝐒𝐔𝐌𝐌𝐈𝐓 𝐂𝐎𝐍𝐐𝐔𝐄𝐑𝐄𝐃" : "📉 𝐅𝐀𝐋𝐋𝐄𝐍"}\n💰 𝐑𝐞𝐬𝐮𝐥𝐭: ${success ? "+" : "-"}$${fmt(success ? winAmount - betAmount : betAmount)}\n━━━━━━━━━━━━━━━━━━\n`;
      msg += `🏦 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: $${fmt(finalBalance)}\n━━━━━━━━━━━━━━━━━━\n   𝐄𝐗𝐄𝐂𝐔𝐓𝐄𝐃 𝐁𝐘 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐋𝐈𝐓𝐄`;

      return api.sendMessage(msg, threadID, messageID);

    } catch (err) {
      return api.sendMessage(`❌ 𝐓𝐨𝐰𝐞𝐫 𝐅𝐚𝐮𝐥𝐭: ${err.message}`, threadID, messageID);
    }
  }
};
