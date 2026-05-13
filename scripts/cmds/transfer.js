const fmt = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

module.exports = {
  config: {
    name: "transfer",
    version: "2.8.0",
    author: "Minh Anh",
    countDown: 5,
    role: 0,
    category: "economy",
    guide: { en: "{p}transfer @tag [amount]" }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID, senderID, mentions } = event;
    const ADMIN_UID = "61576612175253"; // Update this

    if (Object.keys(mentions).length === 0) return api.sendMessage("⚠️ 𝐓𝐚𝐠 𝐫𝐞𝐜𝐢𝐩𝐢𝐞𝐧𝐭.", threadID, messageID);

    const senderData = await usersData.get(senderID);
    const senderMoney = BigInt((senderData.data.money || "0").toString().split('.')[0]);
    const amountArg = args.find(arg => !arg.includes("@"));
    let transferAmount = amountArg === "all" ? senderMoney : BigInt(amountArg.replace(/,/g, ''));

    if (transferAmount <= 0n || transferAmount > senderMoney) return api.sendMessage("❌ 𝐈𝐧𝐯𝐚𝐥𝐢𝐝.", threadID, messageID);

    // BUFFED: Tiered Tax (5% Small / 12% Whale)
    const TAX_RATE = Number(transferAmount) > 10000000 ? 0.12 : 0.05;
    const taxAmount = BigInt(Math.floor(Number(transferAmount) * TAX_RATE));
    const finalAmount = transferAmount - taxAmount;

    const receiverID = Object.keys(mentions)[0];
    const receiverData = await usersData.get(receiverID);
    const adminData = await usersData.get(ADMIN_UID);

    await usersData.set(senderID, { money: (senderMoney - transferAmount).toString() }, "data.money");
    await usersData.set(receiverID, { money: (BigInt(receiverData.data.money) + finalAmount).toString() }, "data.money");
    await usersData.set(ADMIN_UID, { money: (BigInt(adminData.data.money) + taxAmount).toString() }, "data.money");

    let msg = `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐗𝐂𝐇𝐀𝐍𝐆𝐄\n━━━━━━━━━━━━━━━━━━\n👤 𝐅𝐫𝐨𝐦: ${senderData.name}\n👥 𝐓𝐨: ${mentions[receiverID].replace(/@/g, "")}\n━━━━━━━━━━━━━━━━━━\n`;
    msg += `💰 𝐒𝐞𝐧𝐭: $${fmt(transferAmount)}\n⚖️ 𝐓𝐚𝐱 (${TAX_RATE*100}%): -$${fmt(taxAmount)}\n🎁 𝐍𝐞𝐭: +$${fmt(finalAmount)}\n━━━━━━━━━━━━━━━━━━\n📢 𝐓𝐚𝐱 𝐫𝐞𝐯𝐞𝐧𝐮𝐞 𝐜𝐥𝐚𝐢𝐦𝐞𝐝 𝐛𝐲 𝐓𝐡𝐞 𝐒𝐨𝐯𝐞𝐫𝐞𝐢𝐠𝐧.\n━━━━━━━━━━━━━━━━━━\n   𝐄𝐗𝐄𝐂𝐔𝐓𝐄𝐃 𝐁𝐘 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐋𝐈𝐓𝐄`;

    return api.sendMessage(msg, threadID, messageID);
  }
};
