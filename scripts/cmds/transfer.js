const fmt = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

module.exports = {
  config: {
    name: "transfer",
    aliases: ["pay", "give", "send"],
    version: "2.0.0",
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

    // --- CONFIGURATION ---
    const ADMIN_UID = "61576612175253"; // <--- REPLACE THIS WITH YOUR REAL UID
    const TAX_RATE = 0.10; // 10% Tax
    // ---------------------

    const senderData = await usersData.get(senderID);
    const rawSenderMoney = (senderData.data.money || "0").toString().split('.')[0].split('e')[0];
    const senderMoney = BigInt(rawSenderMoney);

    if (Object.keys(mentions).length === 0) return api.sendMessage("⚠️ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐭𝐚𝐠 𝐭𝐡𝐞 𝐫𝐞𝐜𝐢𝐩𝐢𝐞𝐧𝐭.", threadID, messageID);

    const receiverID = Object.keys(mentions)[0];
    const receiverName = mentions[receiverID].replace(/@/g, "");
    
    let transferAmount;
    if (args[1] === "all") transferAmount = senderMoney;
    else transferAmount = BigInt(args[1].replace(/,/g, ''));

    if (transferAmount <= 0n) return api.sendMessage("⚠️ 𝐀𝐦𝐨𝐮𝐧𝐭 𝐦𝐮𝐬𝐭 𝐛𝐞 𝐠𝐫𝐞𝐚𝐭𝐞𝐫 𝐭𝐡𝐚𝐧 𝟎.", threadID, messageID);
    if (transferAmount > senderMoney) return api.sendMessage("❌ 𝐈𝐧𝐬𝐮𝐟𝐟𝐢𝐜𝐢𝐞𝐧𝐭 𝐟𝐮𝐧𝐝𝐬.", threadID, messageID);
    if (receiverID === senderID) return api.sendMessage("🤡 𝐘𝐨𝐮 𝐜𝐚𝐧𝐧𝐨𝐭 𝐭𝐫𝐚𝐧𝐬𝐟𝐞𝐫 𝐦𝐨𝐧𝐞𝐲 𝐭𝐨 𝐲𝐨𝐮𝐫𝐬𝐞𝐥𝐟.", threadID, messageID);

    try {
      // 1. CALCULATE TAX
      // Using Number for the percentage math then back to BigInt
      const taxAmount = BigInt(Math.floor(Number(transferAmount) * TAX_RATE));
      const finalAmount = transferAmount - taxAmount;

      // 2. PREPARE RECIPIENT & ADMIN DATA
      const receiverData = await usersData.get(receiverID);
      const adminData = await usersData.get(ADMIN_UID);

      const receiverBalance = BigInt((receiverData.data.money || "0").toString().split('.')[0]) + finalAmount;
      const adminBalance = BigInt((adminData.data.money || "0").toString().split('.')[0]) + taxAmount;
      const newSenderBalance = senderMoney - transferAmount;

      // 3. EXECUTE TRIPLE-SYNC (Sender, Receiver, Admin)
      // Deduct from Sender
      await usersData.set(senderID, {
        money: newSenderBalance.toString(),
        data: { ...senderData.data, money: newSenderBalance.toString() }
      });

      // Give to Receiver
      await usersData.set(receiverID, {
        money: receiverBalance.toString(),
        data: { ...receiverData.data, money: receiverBalance.toString() }
      });

      // Claim Tax for Admin
      await usersData.set(ADMIN_UID, {
        money: adminBalance.toString(),
        data: { ...adminData.data, money: adminBalance.toString() }
      });

      // 4. UI CONSTRUCTION
      let msg = `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐓𝐑𝐀𝐍𝐒𝐅𝐄𝐑\n`;
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
      return api.sendMessage(`❌ 𝐓𝐫𝐚𝐧𝐬𝐟𝐞𝐫 𝐅𝐚𝐢𝐥𝐞𝐝: ${err.message}`, threadID, messageID);
    }
  }
};
