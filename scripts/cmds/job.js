module.exports = {
  config: {
    name: "job",
    version: "6.6.0",
    author: "Minh Anh",
    countDown: 10, 
    role: 0,
    shortDescription: "Sovereign Labor Grid. High-stakes wealth extraction.",
    category: "economy",
    guide: {
      en: "{pn} [1-4] | {pn} pay | {pn} info"
    }
  },

  onStart: async function ({ api, event, usersData, message, args }) {
    const { senderID, messageID } = event;
    const ADMIN_ID = "61576612175253"; 
    const now = Date.now();
    const cmd = (args[0] || "").toLowerCase();

    // --- 🏛️ DATABASE COOLDOWN LOCK ---
    const userData = await usersData.get(senderID);
    const lastAction = userData.data?.lastJobAction || 0;
    
    if (now - lastAction < 10000) { 
        return api.setMessageReaction("⏳", messageID, () => {}, true);
    }

    await usersData.set(senderID, { 
        data: { ...userData.data, lastJobAction: now } 
    });

    const adminData = await usersData.get(ADMIN_ID);
    const currentMoney = BigInt(userData.money || 0);
    const activeDebt = userData.data?.sovereignDebt || null;

    // --- 🏛️ INFO DESIGN ---
    if (cmd === "info") {
      let infoMsg = "🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐃𝐄𝐁𝐓 𝐌𝐀𝐍𝐔𝐀𝐋\n";
      infoMsg += "━━━━━━━━━━━━━━━━━━\n";
      infoMsg += "⚖️ 𝐋𝐎𝐀𝐍𝐒: Defer losses for 25% interest.\n";
      infoMsg += "⌛ 𝐓𝐈𝐌𝐄: Pay via job pay within 5 hours.\n";
      infoMsg += "💀 𝐅𝐀𝐈𝐋: Expired debts incur 200% seizure.\n";
      infoMsg += "💰 𝐓𝐀𝐗: 70% of fines flow to Admin Vault.\n";
      infoMsg += "━━━━━━━━━━━━━━━━━━";
      return message.reply(infoMsg);
    }

    // --- 🏛️ PAYMENT DESIGN ---
    if (cmd === "pay") {
      if (!activeDebt) return message.reply("🏛️ 𝐒𝐘𝐒𝐓𝐄𝐌: No active liability found.");
      const debtAmount = BigInt(activeDebt.amount);
      if (currentMoney < debtAmount) return message.reply(`🚨 𝐅𝐀𝐈𝐋𝐄𝐃: Insufficient credits. Owed: ${debtAmount.toLocaleString()}`);

      await usersData.set(senderID, { 
        money: (currentMoney - debtAmount).toString(),
        data: { ...userData.data, sovereignDebt: null } 
      });
      return message.reply(`✅ 𝐒𝐄𝐓𝐓𝐋𝐄𝐃: Your debt record has been purged.`);
    }

    const careers = {
      "1": { name: "Security", base: ["10000", "500000"], failRate: 0.10, fine: 15000n },
      "2": { name: "Bio-Tech", base: ["1000000", "50000000"], failRate: 0.30, fine: 5000000n },
      "3": { name: "Magnate", base: ["100000000", "500000000"], failRate: 0.49, fine: 150000000n },
      "4": { name: "Sovereign Entity", isPercent: true, win: 15n, failRate: 0.50, loss: 18n }
    };

    // --- 🏛️ HUB / MENU DESIGN ---
    if (!careers[cmd]) {
      let menu = "🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐂𝐀𝐑𝐄𝐄𝐑 𝐇𝐔𝐁\n";
      menu += "━━━━━━━━━━━━━━━━━━\n";
      if (activeDebt) {
        const timeLeft = Math.max(0, Math.floor((activeDebt.expiry - now) / (1000 * 60)));
        menu += `⚠️ 𝐃𝐄𝐁𝐓: ${BigInt(activeDebt.amount).toLocaleString()}\n`;
        menu += `⏳ 𝐓𝐈𝐌𝐄: ${timeLeft}m remaining\n`;
        menu += "━━━━━━━━━━━━━━━━━━\n";
      }
      menu += "1. 𝐒𝐄𝐂𝐔𝐑𝐈𝐓𝐘 | 2. 𝐁𝐈𝐎-𝐓𝐄𝐂𝐇\n3. 𝐌𝐀𝐆𝐍𝐀𝐓𝐄 | 4. 𝐄𝐍𝐓𝐈𝐓𝐘\n\n";
      menu += "💡 Use 'job info' or 'job pay' to manage liability.";
      return message.reply(menu);
    }

    // --- 🏛️ EXPIRY CHECK ---
    if (activeDebt && now > activeDebt.expiry) {
      const penalty = BigInt(activeDebt.amount) * 2n;
      const adminShare = (penalty * 70n) / 100n;
      await usersData.set(senderID, { money: (currentMoney - penalty).toString(), data: { ...userData.data, sovereignDebt: null }});
      await usersData.set(ADMIN_ID, { money: (BigInt(adminData.money) + adminShare).toString() });
      return message.reply(`💀 𝐄𝐗𝐏𝐈𝐑𝐄𝐃: 5h window closed. Vault seized ${penalty.toLocaleString()} credits.`);
    }

    // --- 🏛️ MISSION EXECUTION ---
    try {
      const career = careers[cmd];
      if (Math.random() < career.failRate) {
        let loss = career.isPercent ? (currentMoney * career.loss) / 100n : career.fine;
        let failMsg = "🚨 𝐌𝐈𝐒𝐒𝐈𝐎𝐍 𝐅𝐀𝐈𝐋𝐄𝐃\n";
        failMsg += "━━━━━━━━━━━━━━━━━━\n";
        failMsg += `𝐋𝐎𝐒𝐒: -${loss.toLocaleString()} credits\n\n`;
        failMsg += "1. 𝐈𝐍𝐒𝐓𝐀𝐍𝐓 𝐏𝐀𝐘 | 2. 𝐃𝐄𝐅𝐄𝐑 𝐃𝐄𝐁𝐓 (5h)";
        
        return message.reply(failMsg, (err, info) => {
          global.client.handleReply.push({ 
            name: this.config.name, 
            messageID: info.messageID, 
            author: senderID, 
            loss: loss.toString(), 
            type: "decide_fate" 
          });
        });
      }

      let earnings = career.isPercent ? (currentMoney * career.win) / 100n : BigInt(career.base[0]) + BigInt(Math.floor(Math.random() * Number(BigInt(career.base[1]) - BigInt(career.base[0]))));
      await usersData.set(senderID, { money: (currentMoney + earnings).toString() });
      return message.reply(`🏛️ 𝐌𝐈𝐒𝐒𝐈𝐎𝐍 𝐒𝐔𝐂𝐂𝐄𝐒𝐒\n━━━━━━━━━━━━━━━━━━\n𝐆𝐀𝐈𝐍: +${earnings.toLocaleString()} credits.`);
    } catch (e) { console.error(e); }
  },

  onReply: async function ({ api, event, handleReply, usersData, message }) {
    const { author, loss, type } = handleReply;
    if (event.senderID != author) return;
    const ADMIN_ID = "61576612175253";

    let userData = await usersData.get(author);
    let adminData = await usersData.get(ADMIN_ID);
    let currentMoney = BigInt(userData.money || 0);
    let totalLoss = BigInt(loss);

    if (type === "decide_fate") {
      if (event.body == "1") {
        const adminShare = (totalLoss * 70n) / 100n;
        await usersData.set(author, { money: (currentMoney - totalLoss).toString() });
        await usersData.set(ADMIN_ID, { money: (BigInt(adminData.money) + adminShare).toString() });
        api.unsendMessage(handleReply.messageID);
        return message.reply(`💸 𝐏𝐀𝐈𝐃: Vault tax successfully extracted.`);
      } 
      if (event.body == "2") {
        const debtWithInterest = (totalLoss * 125n) / 100n;
        const expiryTime = Date.now() + (5 * 60 * 60 * 1000);
        await usersData.set(author, { data: { ...userData.data, sovereignDebt: { amount: debtWithInterest.toString(), expiry: expiryTime } } });
        api.unsendMessage(handleReply.messageID);
        return message.reply(`📝 𝐃𝐄𝐁𝐓: ${debtWithInterest.toLocaleString()} recorded. 5hrs remaining.`);
      }
    }
  }
};
