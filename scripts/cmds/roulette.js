const fmt = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

module.exports = {
  config: {
    name: "roulette",
    aliases: ["rl"],
    version: "1.0.2",
    author: "Minh Anh",
    countDown: 5,
    role: 0,
    category: "economy",
    guide: {
      en: "{p}roulette [red/black/green] [amount]"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID, senderID } = event;
    
    // 1. INPUT VALIDATION
    if (args.length < 2) return api.sendMessage("🏛️ 𝐔𝐒𝐀𝐆𝐄 𝐏𝐑𝐎𝐓𝐎𝐂𝐎𝐋\n━━━━━━━━━━━━━━━━━━\n💡 {p}roulette [red/black/green] [amount]", threadID, messageID);

    const betType = args[0].toLowerCase();
    const betAmountInput = args[1].toLowerCase();
    const userData = await usersData.get(senderID);
    const userMoney = BigInt(userData.data.money || "0");

    let betAmount;
    if (betAmountInput === "all") {
      betAmount = userMoney;
    } else {
      betAmount = BigInt(betAmountInput.replace(/[^0-9]/g, ''));
    }

    if (!['red', 'black', 'green'].includes(betType)) return api.sendMessage("❌ 𝐈𝐍𝐕𝐀𝐋𝐈𝐃 𝐒𝐄𝐂𝐓𝐎𝐑: Choose Red, Black, or Green.", threadID, messageID);
    if (betAmount <= 0n) return api.sendMessage("❌ 𝐈𝐍𝐕𝐀𝐋𝐈𝐃 𝐒𝐓𝐀𝐊𝐄: Enter a positive amount.", threadID, messageID);
    if (betAmount > userMoney) return api.sendMessage("❌ 𝐈𝐍𝐒𝐔𝐅𝐅𝐈𝐂𝐈𝐄𝐍𝐓 𝐂𝐑𝐄𝐃𝐈𝐓𝐒: Your balance is too low.", threadID, messageID);

    // 2. THE SPIN
    const resultNum = Math.floor(Math.random() * 37);
    let resultColor = "";
    if (resultNum === 0) resultColor = "green";
    else if (resultNum <= 18) resultColor = "red";
    else resultColor = "black";

    const isWin = betType === resultColor;
    
    // ADJUSTED MULTIPLIER: 3x for Red/Black, 14x for Green
    let multiplier = resultColor === 'green' ? 14n : 3n; 
    let winAmount = betAmount * multiplier;

    // 3. UPDATE ECONOMY
    let finalBalance;
    if (isWin) {
      // The user keeps their stake and gains (winAmount - stake)
      finalBalance = userMoney + (winAmount - betAmount);
      await usersData.set(senderID, { data: { ...userData.data, money: finalBalance.toString() } });
    } else {
      finalBalance = userMoney - betAmount;
      await usersData.set(senderID, { data: { ...userData.data, money: finalBalance.toString() } });
    }

    // 4. DISPLAY RESULTS
    const status = isWin ? "📈 𝐏𝐑𝐎𝐅𝐈𝐓 𝐀𝐂𝐐𝐔𝐈𝐑𝐄𝐃" : "📉 𝐂𝐀𝐏𝐈𝐓𝐀𝐋 𝐋𝐎𝐒𝐒";
    const resultEmoji = resultColor === "red" ? "🔴" : resultColor === "black" ? "⚫" : "🟢";

    let msg = `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐑𝐎𝐔𝐋𝐄𝐓𝐓𝐄\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `🎰 𝐖𝐡𝐞𝐞𝐥 𝐒𝐭𝐨𝐩: ${resultEmoji} ${resultNum} (${resultColor.toUpperCase()})\n`;
    msg += `👤 𝐘𝐨𝐮𝐫 𝐁𝐞𝐭: ${betType.toUpperCase()}\n`;
    msg += `💰 𝐒𝐭𝐚𝐤𝐞: $${fmt(betAmount)}\n`;
    msg += `⚡ 𝐌𝐮𝐥𝐭𝐢𝐩𝐥𝐢𝐞𝐫: ${multiplier}𝐱\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `${status}\n`;
    msg += isWin ? `✨ 𝐍𝐞𝐭 𝐆𝐚𝐢𝐧: +$${fmt(winAmount - betAmount)}` : `💸 𝐋𝐨𝐬𝐬: -$${fmt(betAmount)}`;
    msg += `\n━━━━━━━━━━━━━━━━━━\n`;
    msg += `🏦 𝐍𝐄𝐖 𝐁𝐀𝐋𝐀𝐍𝐂𝐄: $${fmt(finalBalance)}\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `   𝐄𝐗𝐄𝐂𝐔𝐓𝐄𝐃 𝐁𝐘 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐋𝐈𝐓𝐄`;

    return api.sendMessage(msg, threadID, messageID);
  }
};
