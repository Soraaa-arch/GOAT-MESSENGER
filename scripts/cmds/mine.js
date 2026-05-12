const fmt = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

module.exports = {
  config: {
    name: "mines",
    aliases: ["mine", "m"],
    version: "1.0.0",
    author: "Minh Anh",
    countDown: 5,
    role: 0,
    category: "economy",
    guide: {
      en: "{p}mines [bombs 1-24] [amount]"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID, senderID } = event;

    // 1. INPUT VALIDATION
    const bombCount = parseInt(args[0]);
    const betInput = args[1]?.toLowerCase();

    if (isNaN(bombCount) || bombCount < 1 || bombCount > 24 || !betInput) {
      return api.sendMessage("🏛️ 𝐌𝐈𝐍𝐄𝐒 𝐏𝐑𝐎𝐓𝐎𝐂𝐎𝐋\n━━━━━━━━━━━━━━━━━━\n💡 𝐔𝐬𝐚𝐠𝐞: {p}mines [1-24] [amount]\nExample: {p}mines 3 5000", threadID, messageID);
    }

    const userData = await usersData.get(senderID);
    const rawMoney = (userData.data.money || "0").toString().split('.')[0].split('e')[0];
    const userMoney = BigInt(rawMoney);

    let betAmount;
    if (betInput === "all") {
      betAmount = userMoney;
    } else {
      const sanitizedBet = betInput?.replace(/[^0-9]/g, '') || "0";
      betAmount = sanitizedBet === "" ? 0n : BigInt(sanitizedBet);
    }

    if (betAmount <= 0n) return api.sendMessage("❌ 𝐈𝐍𝐕𝐀𝐋𝐈𝐃 𝐒𝐓𝐀𝐊𝐄.", threadID, messageID);
    if (betAmount > userMoney) return api.sendMessage("❌ 𝐈𝐍𝐒𝐔𝐅𝐅𝐈𝐂𝐈𝐄𝐍𝐓 𝐂𝐑𝐄𝐃𝐈𝐓𝐒.", threadID, messageID);

    // 2. THE ADDICTION ENGINE (Probability Logic)
    // We simulate a "perfect" session where the user picks 3 random spots.
    // In a real GUI this would be interactive, but for Chat, we simulate 
    // a 3-step deep-dive to make it feel intense.
    
    const spotsToDig = 3; 
    let currentMultiplier = 1.0;
    let hitMine = false;
    let path = [];

    for (let i = 0; i < spotsToDig; i++) {
      // Probability of hitting a gem: (Total Slots - Bombs - Already Dug) / (Total Slots - Already Dug)
      const totalSlots = 25;
      const chanceOfGem = (totalSlots - bombCount - i) / (totalSlots - i);
      
      if (Math.random() < chanceOfGem) {
        // Multiplier increases more aggressively with more bombs
        currentMultiplier += (bombCount * 0.4) + (i * 0.2);
        path.push("💎");
      } else {
        hitMine = true;
        path.push("💥");
        break;
      }
    }

    // 3. BALANCE CALCULATION
    let finalBalance;
    let status = "";
    let yieldDetails = "";

    if (!hitMine) {
      const multiplierScaled = BigInt(Math.floor(currentMultiplier * 100));
      const winAmount = (betAmount * multiplierScaled) / 100n;
      finalBalance = userMoney + (winAmount - betAmount);
      status = "🛡️ 𝐄𝐗𝐓𝐑𝐀𝐂𝐓𝐈𝐎𝐍 𝐒𝐔𝐂𝐂𝐄𝐒𝐒";
      yieldDetails = `✨ 𝐘𝐢𝐞𝐥𝐝: ${currentMultiplier.toFixed(2)}𝐱\n💰 𝐏𝐫𝐨𝐟𝐢𝐭: +$${fmt(winAmount - betAmount)}`;
    } else {
      finalBalance = userMoney - betAmount;
      status = "☣️ 𝐓𝐇𝐄𝐑𝐌𝐀𝐋 𝐂𝐇𝐀𝐑𝐆𝐄 𝐃𝐄𝐓𝐎𝐍𝐀𝐓𝐄𝐃";
      yieldDetails = `💸 𝐋𝐨𝐬𝐬: -$${fmt(betAmount)}`;
    }

    // 4. UI CONSTRUCTION (Visual Grid)
    const grid = path.concat(Array(5 - path.length).fill("❓")).join(" ");

    let msg = `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐌𝐈𝐍𝐄𝐒\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `💣 𝐃𝐢𝐟𝐟𝐢𝐜𝐮𝐥𝐭𝐲: ${bombCount} 𝐁𝐨𝐦𝐛𝐬\n`;
    msg += `🗺️ 𝐒𝐜𝐚𝐧: [ ${grid} ]\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `${status}\n`;
    msg += `${yieldDetails}\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `🏦 𝐁𝐀𝐋𝐀𝐍𝐂𝐄: $${fmt(finalBalance)}\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `   𝐄𝐗𝐄𝐂𝐔𝐓𝐄𝐃 𝐁𝐘 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐋𝐈𝐓𝐄`;

    // 5. DATABASE SYNC
    await usersData.set(senderID, { data: { ...userData.data, money: finalBalance.toString() } });

    return api.sendMessage(msg, threadID, messageID);
  }
};
