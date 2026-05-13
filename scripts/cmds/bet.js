const fmt = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

module.exports.config = {
  name: "bet",
  version: "3.2.0",
  author: "Minh Anh",
  countDown: 5,
  role: 0,
  category: "economy",
  shortDescription: "Sovereign High-Stakes Casino with Royal Tax"
};

module.exports.onStart = async function ({ api, event, args, usersData }) {
  const { senderID, threadID, messageID } = event;
  const ADMIN_UID = "61576612175253"; 
  const WIN_TAX_RATE = 0.05; // 5% Royal Tax on winnings

  try {
    const extract = (val) => {
      if (typeof val === 'object' && val !== null) return val.money || val.bank || Object.values(val)[0] || "0";
      return val || "0";
    };

    const userData = await usersData.get(senderID);
    const balanceRaw = extract(userData.data?.money || userData.money);
    const balance = BigInt(balanceRaw.toString().split('.')[0].replace(/[^0-9]/g, '') || "0");

    if (!args[0]) return api.sendMessage("🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐂𝐀𝐒𝐈𝐍𝐎\n━━━━━━━━━━━━━━━━━━\nUsage: bet [amount/all]", threadID, messageID);

    let betAmount;
    if (args[0].toLowerCase() === "all") {
      betAmount = balance;
    } else {
      const cleanBet = args[0].replace(/[,|$]/g, '');
      if (isNaN(cleanBet) || cleanBet === "") return api.sendMessage("❌ 𝐈𝐍𝐕𝐀𝐋𝐈𝐃 𝐀𝐌𝐎𝐔𝐍𝐓.", threadID, messageID);
      betAmount = BigInt(cleanBet);
    }

    if (betAmount <= 0n) return api.sendMessage("❌ 𝐈𝐍𝐕𝐀𝐋𝐈𝐃 𝐁𝐄𝐓.", threadID, messageID);
    if (balance < betAmount) return api.sendMessage(`❌ 𝐈𝐍𝐒𝐔𝐅𝐅𝐈𝐂𝐈𝐄𝐍𝐓 𝐅𝐔𝐍𝐃𝐒.\n🏦 𝐕𝐚𝐮𝐥𝐭: $${fmt(balance)}`, threadID, messageID);

    const outcomes = [
      { status: "📉 𝐀𝐒𝐒𝐄𝐓 𝐒𝐄𝐈𝐙𝐔𝐑𝐄", text: "Total loss of wagered credits.", mult: 0n },
      { status: "📉 𝐌𝐀𝐑𝐆𝐈𝐍 𝐂𝐀𝐋𝐋", text: "Partial recovery of 50%.", mult: 5n }, 
      { status: "⚖️ 𝐄𝐐𝐔𝐈𝐋𝐈𝐁𝐑𝐈𝐔𝐌", text: "Wager returned in full.", mult: 10n },
      { status: "📈 𝐃𝐎𝐔𝐁𝐋𝐄 𝐘𝐈𝐄𝐋𝐃", text: "2x return on investment.", mult: 20n },
      { status: "🔥 𝐓𝐑𝐄𝐁𝐋𝐄 𝐆𝐀𝐈𝐍", text: "3x return on investment.", mult: 30n },
      { status: "💎 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐉𝐀𝐂𝐊𝐏𝐎𝐓", text: "10x legendary return.", mult: 100n }
    ];

    const win = Math.random() < 0.45;
    let selected;

    if (win) {
      const winOutcomes = outcomes.filter(o => o.mult >= 10n);
      selected = winOutcomes[Math.floor(Math.random() * winOutcomes.length)];
    } else {
      const loseOutcomes = outcomes.filter(o => o.mult < 10n);
      selected = loseOutcomes[Math.floor(Math.random() * loseOutcomes.length)];
    }

    const grossPayout = (betAmount * selected.mult) / 10n;
    let taxAmount = 0n;
    let netPayout = grossPayout;

    // Apply Tax only if the player actually won money (payout > bet)
    if (grossPayout > betAmount) {
        const winnings = grossPayout - betAmount;
        taxAmount = BigInt(Math.floor(Number(winnings) * WIN_TAX_RATE));
        netPayout = grossPayout - taxAmount;

        // Update Admin Balance
        const adminData = await usersData.get(ADMIN_UID);
        const adminMoneyRaw = extract(adminData.data?.money || adminData.money);
        const adminBalance = BigInt(adminMoneyRaw.toString().split('.')[0].replace(/[^0-9]/g, '') || "0");
        const newAdminBal = (adminBalance + taxAmount).toString();
        await usersData.set(ADMIN_UID, { money: newAdminBal, data: { ...adminData.data, money: newAdminBal } });
    }

    const newBalance = balance - betAmount + netPayout;

    await usersData.set(senderID, { 
      money: newBalance.toString(),
      data: { ...userData.data, money: newBalance.toString() } 
    });

    let msg = `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐂𝐀𝐒𝐈𝐍𝐎\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `🎰 𝐎𝐮𝐭𝐜𝐨𝐦𝐞: ${selected.status}\n` +
      `📝 𝐃𝐞𝐭𝐚𝐢𝐥𝐬: ${selected.text}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `💵 𝐖𝐚𝐠𝐞𝐫: $${fmt(betAmount)}\n` +
      `🎁 𝐆𝐫𝐨𝐬𝐬 𝐏𝐚𝐲𝐨𝐮𝐭: $${fmt(grossPayout)}\n`;

    if (taxAmount > 0n) {
      msg += `⚖️ 𝐑𝐨𝐲𝐚𝐥 𝐓𝐚𝐱 (𝟓%): -$${fmt(taxAmount)}\n`;
    }

    msg += `━━━━━━━━━━━━━━━━━━\n` +
      `🏦 𝐍𝐞𝐰 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: $${fmt(newBalance)}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📢 𝐓𝐚𝐱 𝐫𝐞𝐯𝐞𝐧𝐮𝐞 𝐜𝐥𝐚𝐢𝐦𝐞𝐝 𝐛𝐲 𝐓𝐡𝐞 𝐒𝐨𝐯𝐞𝐫𝐞𝐢𝐠𝐧.\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `   𝐄𝐗𝐄𝐂𝐔𝐓𝐄𝐃 𝐁𝐘 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐋𝐈𝐓𝐄`;

    return api.sendMessage(msg, threadID, messageID);

  } catch (err) {
    return api.sendMessage(`❌ 𝐂𝐚𝐬𝐢𝐧𝐨 𝐅𝐚𝐮𝐥𝐭: ${err.message}`, threadID, messageID);
  }
};
