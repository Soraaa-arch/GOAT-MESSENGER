const fmt = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

module.exports = {
  config: {
    name: "coinflip",
    aliases: ["cf", "flip", "duel"],
    version: "1.0.2",
    author: "Minh Anh",
    countDown: 5,
    role: 0,
    category: "economy",
    guide: {
      en: "{p}coinflip [heads/tails] [amount]"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID, senderID } = event;

    // 1. INPUT VALIDATION
    if (args.length < 2) return api.sendMessage("🏛️ 𝐃𝐔𝐄𝐋 𝐏𝐑𝐎𝐓𝐎𝐂𝐎𝐋\n━━━━━━━━━━━━━━━━━━\n💡 {p}coinflip [heads/tails] [amount]", threadID, messageID);

    const choice = args[0].toLowerCase();
    const betAmountInput = args[1].toLowerCase();
    const userData = await usersData.get(senderID);
    const userMoney = BigInt(userData.data.money || "0");

    let betAmount;
    if (betAmountInput === "all") {
      betAmount = userMoney;
    } else {
      betAmount = BigInt(betAmountInput.replace(/[^0-9]/g, ''));
    }

    if (!['heads', 'tails'].includes(choice)) return api.sendMessage("❌ 𝐈𝐍𝐕𝐀𝐋𝐈𝐃 𝐒𝐈𝐃𝐄: Choose Heads or Tails.", threadID, messageID);
    if (betAmount <= 0n) return api.sendMessage("❌ 𝐈𝐍𝐕𝐀𝐋𝐈𝐃 𝐒𝐓𝐀𝐊𝐄: Enter a positive amount.", threadID, messageID);
    if (betAmount > userMoney) return api.sendMessage("❌ 𝐈𝐍𝐒𝐔𝐅𝐅𝐈𝐂𝐈𝐄𝐍𝐓 𝐂𝐑𝐄𝐃𝐈𝐓𝐒: Your balance is too low.", threadID, messageID);

    // 2. THE FLIP
    const sides = ['heads', 'tails'];
    const result = sides[Math.floor(Math.random() * sides.length)];
    const isWin = choice === result;

    // 3. 3X PAYOUT LOGIC
    let multiplier = 3n;
    let winAmount = betAmount * multiplier;

    let finalBalance;
    if (isWin) {
      // User keeps stake and gains the net profit (e.g., Stake $1k -> Total $3k -> Profit $2k)
      finalBalance = userMoney + (winAmount - betAmount);
      await usersData.set(senderID, { data: { ...userData.data, money: finalBalance.toString() } });
    } else {
      finalBalance = userMoney - betAmount;
      await usersData.set(senderID, { data: { ...userData.data, money: finalBalance.toString() } });
    }

    // 4. DISPLAY RESULTS
    const status = isWin ? "📈 𝐃𝐔𝐄𝐋 𝐕𝐈𝐂𝐓𝐎𝐑𝐘" : "📉 𝐃𝐔𝐄𝐋 𝐃𝐄𝐅𝐄𝐀𝐓";
    const sideEmoji = result === "heads" ? "🪙 (𝐇𝐄𝐀𝐃𝐒)" : "📜 (𝐓𝐀𝐈𝐋𝐒)";

    let msg = `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐃𝐔𝐄𝐋\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `🪙 𝐑𝐞𝐬𝐮𝐥𝐭: ${sideEmoji}\n`;
    msg += `👤 𝐂𝐡𝐨𝐢𝐜𝐞: ${choice.toUpperCase()}\n`;
    msg += `💰 𝐒𝐭𝐚𝐤𝐞: $${fmt(betAmount)}\n`;
    msg += `⚡ 𝐏𝐚𝐲𝐨𝐮𝐭: 𝟑𝐱\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `${status}\n`;
    msg += isWin ? `✨ 𝐍𝐞𝐭 𝐏𝐫𝐨𝐟𝐢𝐭: +$${fmt(winAmount - betAmount)}` : `💸 𝐋𝐨𝐬𝐬: -$${fmt(betAmount)}`;
    msg += `\n━━━━━━━━━━━━━━━━━━\n`;
    msg += `🏦 𝐍𝐄𝐖 𝐁𝐀𝐋𝐀𝐍𝐂𝐄: $${fmt(finalBalance)}\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `   𝐄𝐗𝐄𝐂𝐔𝐓𝐄𝐃 𝐁𝐘 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐋𝐈𝐓𝐄`;

    return api.sendMessage(msg, threadID, messageID);
  }
};
