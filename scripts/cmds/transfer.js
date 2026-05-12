const fs = require("fs-extra");

module.exports.config = {
  name: "transfer",
  aliases: ["pay", "give", "send"],
  version: "5.0",
  author: "Minh Anh",
  countDown: 5,
  role: 0,
  shortDescription: "Ultra-High Value Asset Transfer",
  category: "economy",
  guide: "{p}transfer @tag [amount] or {p}transfer [UID] [amount]"
};

/**
 * BigInt Formatter for Confirmation Messages
 */
function formatBalance(num) {
  try {
    const n = BigInt(num.toString().split('.')[0] || 0);
    if (n === 0n) return "0";
    const suffixes = [
      { v: 10n**100n, s: "Googol" }, { v: 10n**33n, s: "Decillion" },
      { v: 10n**30n, s: "Nonillion" }, { v: 10n**27n, s: "Octillion" },
      { v: 10n**24n, s: "Septillion" }, { v: 10n**21n, s: "Sextillion" },
      { v: 10n**18n, s: "Quintillion" }, { v: 10n**15n, s: "Quadrillion" },
      { v: 10n**12n, s: "Trillion" }, { v: 10n**9n, s: "Billion" },
      { v: 10n**6n, s: "Million" }, { v: 10n**3n, s: "K" }
    ];
    for (const { v, s } of suffixes) {
      if (n >= v) {
        const val = (n / (v / 10n)).toString();
        return val.slice(0, -1) + "." + val.slice(-1) + s;
      }
    }
    return n.toString();
  } catch (e) { return "0"; }
}

module.exports.onStart = async function ({ api, event, args, usersData }) {
  const { threadID, messageID, senderID, mentions } = event;

  // 1. Identify Target and Amount
  let targetID, amountStr;

  if (Object.keys(mentions).length > 0) {
    targetID = Object.keys(mentions)[0];
    amountStr = args[args.length - 1]; // Assumes amount is the last word
  } else {
    targetID = args[0];
    amountStr = args[1];
  }

  // 2. Validations
  if (!targetID || isNaN(targetID) || targetID == senderID) {
    return api.sendMessage("⚠️ Protocol Error: Invalid or missing Recipient ID.", threadID, messageID);
  }

  if (!amountStr || amountStr.toLowerCase() === 'all') {
    const senderInfo = await usersData.get(senderID);
    amountStr = senderInfo.data.money.toString();
  }

  try {
    const amountToTransfer = BigInt(amountStr.replace(/,/g, '').split('.')[0]);
    
    if (amountToTransfer <= 0n) {
      return api.sendMessage("⚠️ Protocol Error: Transfer amount must be positive.", threadID, messageID);
    }

    // 3. Asset Verification
    const senderData = await usersData.get(senderID);
    const receiverData = await usersData.get(targetID);

    if (!receiverData) {
      return api.sendMessage("⚠️ Protocol Error: Recipient is not registered in the Sovereign Registry.", threadID, messageID);
    }

    const currentSenderBalance = BigInt(senderData.data.money || 0);

    if (amountToTransfer > currentSenderBalance) {
      return api.sendMessage(`❌ Transaction Declined: Insufficient funds.\nYour Balance: $${formatBalance(currentSenderBalance)}`, threadID, messageID);
    }

    // 4. Execute Transaction
    const newSenderBalance = currentSenderBalance - amountToTransfer;
    const newReceiverBalance = BigInt(receiverData.data.money || 0) + amountToTransfer;

    await usersData.set(senderID, { 
      data: { ...senderData.data, money: newSenderBalance.toString() } 
    });
    await usersData.set(targetID, { 
      data: { ...receiverData.data, money: newReceiverBalance.toString() } 
    });

    // 5. Luxury Confirmation
    const msg = {
      body: `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐀𝐒𝐒𝐄𝐓 𝐑𝐄𝐆𝐈𝐒𝐓𝐑𝐘\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `𝐓𝐫𝐚𝐧𝐬𝐚𝐜𝐭𝐢𝐨𝐧: Approved\n` +
            `𝐒𝐞𝐧𝐝𝐞𝐫: ${senderData.name}\n` +
            `𝐑𝐞𝐜𝐢𝐩𝐢𝐞𝐧𝐭: ${receiverData.name}\n` +
            `𝐀𝐦𝐨𝐮𝐧𝐭: $${formatBalance(amountToTransfer)}\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `𝐀𝐬𝐬𝐞𝐭𝐬 𝐡𝐚𝐯𝐞 𝐛𝐞𝐞𝐧 𝐬𝐞𝐜𝐮𝐫𝐞𝐥𝐲 𝐫𝐞-𝐫𝐨𝐮𝐭𝐞𝐝.`
    };

    return api.sendMessage(msg, threadID, messageID);

  } catch (err) {
    return api.sendMessage("⚠️ Transaction Refused: Please provide a valid numerical amount.", threadID, messageID);
  }
};
