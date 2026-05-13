const fmt = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

module.exports = {
  config: {
    name: "transfer",
    version: "2.8.5",
    author: "Minh Anh",
    countDown: 5,
    role: 0,
    category: "economy",
    guide: { en: "{p}transfer @tag [amount]" }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID, senderID, mentions } = event;
    const ADMIN_UID = "61576612175253"; 

    if (Object.keys(mentions).length === 0) return api.sendMessage("⚠️ 𝐓𝐚𝐠 𝐫𝐞𝐜𝐢𝐩𝐢𝐞𝐧𝐭.", threadID, messageID);

    try {
      const extract = (val) => {
        if (typeof val === 'object' && val !== null) return val.money || val.bank || Object.values(val)[0] || "0";
        return val || "0";
      };

      const senderData = await usersData.get(senderID);
      const senderMoneyRaw = extract(senderData.data?.money || senderData.money);
      const senderMoney = BigInt(senderMoneyRaw.toString().split('.')[0].replace(/[^0-9]/g, '') || "0");

      // FIX: Robust argument detection
      // We look for 'all' or a valid number string, ignoring tags/names
      const amountArg = args.find(arg => {
        const clean = arg.replace(/[,|$]/g, '');
        return arg.toLowerCase() === "all" || (!isNaN(clean) && clean.length > 0 && !arg.includes("@"));
      });

      if (!amountArg) return api.sendMessage("❌ 𝐈𝐧𝐯𝐚𝐥𝐢𝐝 amount. Use: transfer @tag [amount]", threadID, messageID);

      let transferAmount;
      if (amountArg.toLowerCase() === "all") {
        transferAmount = senderMoney;
      } else {
        const cleanAmount = amountArg.replace(/[,|$]/g, '');
        transferAmount = BigInt(cleanAmount);
      }

      if (transferAmount <= 0n || transferAmount > senderMoney) {
        return api.sendMessage("❌ 𝐈𝐧𝐯𝐚𝐥𝐢𝐝 amount or insufficient funds.", threadID, messageID);
      }

      // BUFFED: Tiered Tax (5% Small / 12% Whale)
      const TAX_RATE = Number(transferAmount) > 10000000 ? 0.12 : 0.05;
      const taxAmount = BigInt(Math.floor(Number(transferAmount) * TAX_RATE));
      const finalAmount = transferAmount - taxAmount;

      const receiverID = Object.keys(mentions)[0];
      const receiverData = await usersData.get(receiverID);
      const adminData = await usersData.get(ADMIN_UID);

      const receiverMoneyRaw = extract(receiverData.data?.money || receiverData.money);
      const adminMoneyRaw = extract(adminData.data?.money || adminData.money);

      const receiverMoney = BigInt(receiverMoneyRaw.toString().split('.')[0].replace(/[^0-9]/g, '') || "0");
      const adminMoney = BigInt(adminMoneyRaw.toString().split('.')[0].replace(/[^0-9]/g, '') || "0");

      const newSenderBal = (senderMoney - transferAmount).toString();
      const newReceiverBal = (receiverMoney + finalAmount).toString();
      const newAdminBal = (adminMoney + taxAmount).toString();

      await usersData.set(senderID, { money: newSenderBal, data: { ...senderData.data, money: newSenderBal } });
      await usersData.set(receiverID, { money: newReceiverBal, data: { ...receiverData.data, money: newReceiverBal } });
      await usersData.set(ADMIN_UID, { money: newAdminBal, data: { ...adminData.data, money: newAdminBal } });

      let msg = `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐗𝐂𝐇𝐀𝐍𝐆𝐄\n━━━━━━━━━━━━━━━━━━\n👤 𝐅𝐫𝐨𝐦: ${senderData.name}\n👥 𝐓𝐨: ${mentions[receiverID].replace(/@/g, "")}\n━━━━━━━━━━━━━━━━━━\n`;
      msg += `💰 𝐒𝐞𝐧𝐭: $${fmt(transferAmount)}\n⚖️ 𝐓𝐚𝐱 (${Math.round(TAX_RATE * 100)}%): -$${fmt(taxAmount)}\n🎁 𝐍𝐞𝐭: +$${fmt(finalAmount)}\n━━━━━━━━━━━━━━━━━━\n📢 𝐓𝐚𝐱 𝐫𝐞𝐯𝐞𝐧𝐮𝐞 𝐜𝐥𝐚𝐢𝐦𝐞𝐝 𝐛𝐲 𝐓𝐡𝐞 𝐒𝐨𝐯𝐞𝐫𝐞𝐢𝐠𝐧.\n━━━━━━━━━━━━━━━━━━\n   𝐄𝐗𝐄𝐂𝐔𝐓𝐄𝐃 𝐁𝐘 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐋𝐈𝐓𝐄`;

      return api.sendMessage(msg, threadID, messageID);
    } catch (err) {
      return api.sendMessage(`❌ 𝐄𝐱𝐜𝐡𝐚𝐧𝐠𝐞 𝐅𝐚𝐮𝐥𝐭: ${err.message}`, threadID, messageID);
    }
  }
};
