const fmt = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

module.exports = {
  config: {
    name: "tower",
    aliases: ["climb"],
    version: "2.0.0",
    author: "Minh Anh",
    countDown: 5,
    role: 0,
    category: "gambling",
    guide: {
      en: "{p}tower [amount]"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID, senderID } = event;

    const userData = await usersData.get(senderID);
    const rawMoney = (userData.data.money || "0").toString().split('.')[0].split('e')[0];
    const userMoney = BigInt(rawMoney);

    if (!args[0]) return api.sendMessage("⚠️ 𝐄𝐧𝐭𝐞𝐫 𝐚 𝐛𝐞𝐭 𝐚𝐦𝐨𝐮𝐧𝐭 𝐭𝐨 𝐛𝐞𝐠𝐢𝐧 𝐭𝐡𝐞 𝐚𝐬𝐜𝐞𝐧𝐭.", threadID, messageID);
    
    let betAmount;
    if (args[0] === "all") betAmount = userMoney;
    else betAmount = BigInt(args[0].replace(/,/g, ''));

    if (betAmount <= 0n) return api.sendMessage("⚠️ 𝐁𝐞𝐭 𝐦𝐮𝐬𝐭 𝐛𝐞 𝐠𝐫𝐞𝐚𝐭𝐞𝐫 𝐭𝐡𝐚𝐧 𝟎.", threadID, messageID);
    if (betAmount > userMoney) return api.sendMessage("❌ 𝐈𝐧𝐬𝐮𝐟𝐟𝐢𝐜𝐢𝐞𝐧𝐭 𝐒𝐨𝐯𝐞𝐫𝐞𝐢𝐠𝐧 𝐑𝐞𝐬𝐞𝐫𝐯𝐞𝐬.", threadID, messageID);

    // --- THE NERFED LOGIC ---
    // Multipliers are lower, and the 'Death' chance is significantly higher at each floor.
    const floors = [
      { level: 1, mult: 1.2, fail: 0.25 }, // 25% fail
      { level: 2, mult: 1.5, fail: 0.35 }, // 35% fail
      { level: 3, mult: 2.0, fail: 0.45 }, // 45% fail
      { level: 4, mult: 3.0, fail: 0.60 }, // 60% fail
      { level: 5, mult: 5.0, fail: 0.80 }  // 80% fail (The Wall)
    ];

    let currentFloor = 0;
    let reachedTop = true;

    for (const floor of floors) {
      if (Math.random() < floor.fail) {
        currentFloor = floor.level;
        reachedTop = false;
        break;
      }
      currentFloor = floor.level;
    }

    let finalBalance;
    let statusMsg = "";
    let winAmount = 0n;

    if (!reachedTop) {
      // LOSE: Entire bet is forfeited
      finalBalance = userMoney - betAmount;
      statusMsg = `📉 𝐅𝐀𝐋𝐋𝐄𝐍: 𝐂𝐨𝐥𝐥𝐚𝐩𝐬𝐞𝐝 𝐨𝐧 𝐅𝐥𝐨𝐨𝐫 ${currentFloor}`;
    } else {
      // WIN: Calculate prize based on the top floor multiplier
      const topMult = floors[floors.length - 1].mult;
      winAmount = BigInt(Math.floor(Number(betAmount) * topMult));
      finalBalance = userMoney - betAmount + winAmount;
      statusMsg = `🏰 𝐂𝐎𝐍𝐐𝐔𝐄𝐑𝐄𝐃: 𝐑𝐞𝐚𝐜𝐡𝐞𝐝 𝐭𝐡𝐞 𝐒𝐮𝐦𝐦𝐢𝐭`;
    }

    await usersData.set(senderID, {
      money: finalBalance.toString(),
      data: { ...userData.data, money: finalBalance.toString() }
    });

    // UI CONSTRUCTION (CATACLYSM STYLE)
    let msg = `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐓𝐎𝐖𝐄𝐑\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `📥 𝐖𝐚𝐠𝐞𝐫: $${fmt(betAmount)}\n`;
    msg += `🪜 𝐀𝐬𝐜𝐞𝐧𝐭: Floor ${reachedTop ? floors.length : currentFloor - 1} / ${floors.length}\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `${statusMsg}\n`;
    msg += `💰 𝐑𝐞𝐬𝐮𝐥𝐭: ${reachedTop ? "+" : "-"}$${fmt(reachedTop ? winAmount - betAmount : betAmount)}\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `🏦 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: $${fmt(finalBalance)}\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `   𝐄𝐗𝐄𝐂𝐔𝐓𝐄𝐃 𝐁𝐘 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐋𝐈𝐓𝐄`;

    return api.sendMessage(msg, threadID, messageID);
  }
};
