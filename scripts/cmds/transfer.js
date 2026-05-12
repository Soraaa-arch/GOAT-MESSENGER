const fmt = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

module.exports = {
  config: {
    name: "transfer",
    aliases: ["pay", "give", "send"],
    version: "2.7.0",
    author: "Minh Anh",
    countDown: 5,
    role: 0,
    category: "economy",
    guide: {
      en: "{p}transfer @tag [amount]"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID, senderID, mentions } = event;

    // --- SOVEREIGN CONFIGURATION ---
    const ADMIN_UID = "61576612175253"; // <--- REPLACE THIS WITH YOUR REAL UID
    const TAX_RATE = 0.10; 
    // -------------------------------

    if (Object.keys(mentions).length === 0) return api.sendMessage("⚠️ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐭𝐚𝐠 𝐭𝐡𝐞 𝐫𝐞𝐜𝐢𝐩𝐢𝐞𝐧𝐭.", threadID, messageID);

    const senderData = await usersData.get(senderID);
    const rawSenderMoney = (senderData.data.money || "0").toString().split('.')[0].split('e')[0];
    const senderMoney = BigInt(rawSenderMoney);

    const receiverID = Object.keys(mentions)[0];
    const receiverName = mentions[receiverID].replace(/@/g, "");

    const amountArg = args.find(arg => !arg.includes("@"));
    if (!amountArg) return api.sendMessage("⚠️ 𝐒𝐩𝐞𝐜𝐢𝐟𝐲 𝐜𝐫𝐞𝐝𝐢𝐭 𝐚𝐦𝐨𝐮𝐧𝐭.", threadID, messageID);

    let transferAmount;
    if (amountArg === "all") {
        transferAmount = senderMoney;
    } else {
        try {
            transferAmount = BigInt(amountArg.replace(/,/g, ''));
        } catch (e) {
            return api.sendMessage("❌ 𝐈𝐍𝐕𝐀𝐋𝐈𝐃 𝐃𝐀𝐓𝐀: 𝐔𝐬𝐞 𝐧𝐮𝐦𝐞𝐫𝐢𝐜 𝐯𝐚𝐥𝐮𝐞𝐬.", threadID, messageID);
        }
    }

    if (transferAmount <= 0n) return api.sendMessage("⚠️ 𝐓𝐫𝐚𝐧𝐬𝐟𝐞𝐫 𝐦𝐮𝐬𝐭 𝐞𝐱𝐜𝐞𝐞𝐝 𝟎.", threadID, messageID);
    if (transferAmount > senderMoney) return api.sendMessage("❌ 𝐈𝐍𝐒𝐔𝐅𝐅𝐈𝐂𝐈𝐄𝐍𝐓 𝐅𝐔𝐍𝐃𝐒.", threadID, messageID);
    if (receiverID === senderID) return api.sendMessage("🤡 𝐒𝐞𝐥𝐟-𝐭𝐫𝐚𝐧𝐬𝐟𝐞𝐫𝐬 𝐛𝐥𝐨𝐜𝐤𝐞𝐝.", threadID, messageID);

    try {
      const taxAmount = BigInt(Math.floor(Number(transferAmount) * TAX_RATE));
      const finalAmount = transferAmount - taxAmount;

      const receiverData = await usersData.get(receiverID);
      const adminData = await usersData.get(ADMIN_UID);

      const receiverBalance = BigInt((receiverData.data.money || "0").toString().split('.')[0]) + finalAmount;
      const adminBalance = BigInt((adminData.data.money || "0").toString().split('.')[0]) + taxAmount;
      const newSenderBalance = senderMoney - transferAmount;

      await usersData.set(senderID, {
        money: newSenderBalance.toString(),
        data: { ...senderData.data, money: newSenderBalance.toString() }
      });

      await usersData.set(receiverID, {
        money: receiverBalance.toString(),
        data: { ...receiverData.data, money: receiverBalance.toString() }
      });

      await usersData.set(ADMIN_UID, {
        money: adminBalance.toString(),
        data: { ...adminData.data, money: adminBalance.toString() }
      });

      // THE SPECIFIC CLAIMED REVENUE DESIGN
      let msg = `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐗𝐂𝐇𝐀𝐍𝐆𝐄\n`;
      msg += `━━━━━━━━━━━━━━━━━━\n`;
      msg += `👤 𝐅𝐫𝐨𝐦: ${senderData.name}\n`;
      msg += `👥 𝐓𝐨: ${receiverName}\n`;
      msg += `━━━━━━━━━━━━━━━━━━\n`;
      msg += `💰 𝐒𝐞𝐧𝐭: $${fmt(transferAmount)}\n`;
      msg += `⚖️ 𝐓𝐚𝐱 (𝟏𝟎%): -$${fmt(taxAmount)}\n`;
      msg += `🎁 𝐑𝐞𝐜𝐞𝐢𝐯𝐞𝐝: +$${fmt(finalAmount)}\n`;
      msg += `━━━━━━━━━━━━━━━━━━\n`;
      msg += `📢 𝐓𝐚𝐱 𝐫𝐞𝐯𝐞𝐧𝐮𝐞 𝐜𝐥𝐚𝐢𝐦𝐞𝐝 𝐛𝐲 𝐓𝐡𝐞 𝐒𝐨𝐯𝐞𝐫𝐞𝐢𝐠𝐧.\n`;
      msg += `━━━━━━━━━━━━━━━━━━\n`;
      msg += `   𝐄𝐗𝐄𝐂𝐔𝐓𝐄𝐃 𝐁𝐘 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐋𝐈𝐓𝐄`;

      return api.sendMessage(msg, threadID, messageID);

    } catch (err) {
      return api.sendMessage(`❌ 𝐄𝐑𝐑𝐎𝐑: ${err.message}`, threadID, messageID);
    }
  }
};
