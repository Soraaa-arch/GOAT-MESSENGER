module.exports.config = {
  name: "transfer",
  version: "2.5",
  author: "Mohammad Akash x Minh Anh",
  role: 0,
  category: "economy",
  shortDescription: "Secure 1:1 Asset Relocation Protocol",
  guide: "{p}transfer [amount] [@tag/reply]"
};

/**
 * Robust parsing to handle Googol/BigInt values 
 * and prevent the "Massive" calculation error.
 */
function getSafeBigInt(value) {
  try {
    if (!value) return 0n;
    // Remove decimals, then remove everything that isn't a digit
    const clean = value.toString().split('.')[0].replace(/[^0-9]/g, '');
    return clean ? BigInt(clean) : 0n;
  } catch (e) {
    return 0n;
  }
}

function fmt(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

module.exports.onStart = async function ({ api, event, args, usersData }) {
  const { senderID, threadID, messageID, mentions, messageReply } = event;

  try {
    // 1. IDENTITY VALIDATION
    const senderData = await usersData.get(senderID);
    const senderName = await usersData.getName(senderID);

    // 2. PARSE AMOUNT (BigInt Support)
    const amountStr = args[0] || "";
    const transferAmount = getSafeBigInt(amountStr);

    if (transferAmount <= 0n) {
      return api.sendMessage("🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐓𝐑𝐀𝐍𝐒𝐅𝐄𝐑\n━━━━━━━━━━━━━━━━━━\nUsage: transfer [amount] @mention\nOr reply to a message.", threadID, messageID);
    }

    // 3. IDENTIFY RECIPIENT
    let receiverID = null;
    if (messageReply) {
      receiverID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      receiverID = Object.keys(mentions)[0];
    }

    if (!receiverID) return api.sendMessage("❌ Target recipient not found in Registry.", threadID, messageID);
    if (receiverID === senderID) return api.sendMessage("⚠️ Circular transfers are restricted.", threadID, messageID);

    const receiverData = await usersData.get(receiverID);
    const receiverName = await usersData.getName(receiverID);

    // 4. BALANCE VALIDATION
    const senderBalance = getSafeBigInt(senderData?.data?.money ?? "0");
    const receiverBalance = getSafeBigInt(receiverData?.data?.money ?? "0");

    if (senderBalance < transferAmount) {
      return api.sendMessage(`❌ Insufficient liquid assets.\nAvailable: $${fmt(senderBalance)}`, threadID, messageID);
    }

    // 5. EXECUTION (1:1 Transfer - No Tax)
    const newSenderBal = senderBalance - transferAmount;
    const newReceiverBal = receiverBalance + transferAmount;

    await usersData.set(senderID, { data: { ...senderData.data, money: newSenderBal.toString() } });
    await usersData.set(receiverID, { data: { ...receiverData.data, money: newReceiverBal.toString() } });

    // 6. SOVEREIGN RECEIPT
    const msg = {
      body: `🏛️ 𝐀𝐒𝐒𝐄𝐓 𝐑𝐄𝐋𝐎𝐂𝐀𝐓𝐈𝐎𝐍 𝐂𝐎𝐌𝐏𝐋𝐄𝐓𝐄\n━━━━━━━━━━━━━━━━━━\n` +
            `👤 𝐅𝐫𝐨𝐦: ${senderName}\n` +
            `👤 𝐓𝐨: ${receiverName}\n\n` +
            `💰 𝐓𝐫𝐚𝐧𝐬𝐟𝐞𝐫𝐫𝐞𝐝: $${fmt(transferAmount)}\n` +
            `📦 𝐑𝐞𝐜𝐞𝐢𝐯𝐞𝐝: $${fmt(transferAmount)}\n` +
            `⚖️ 𝐒𝐭𝐚𝐭𝐮𝐬: 1:1 Direct Exchange\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `🏦 𝐒𝐄𝐍𝐃𝐄𝐑 𝐋𝐄𝐃𝐆𝐄𝐑:\n` +
            `   $${fmt(senderBalance)} → $${fmt(newSenderBal)}\n\n` +
            `🏦 𝐑𝐄𝐂𝐄𝐈𝐕𝐄𝐑 𝐋𝐄𝐃𝐆𝐄𝐑:\n` +
            `   $${fmt(receiverBalance)} → $${fmt(newReceiverBal)}\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `𝐓𝐫𝐚𝐧𝐬𝐚𝐜𝐭𝐢𝐨𝐧 𝐒𝐞𝐜𝐮𝐫𝐞𝐝`
    };

    api.sendMessage(msg, threadID, messageID);

  } catch (err) {
    api.sendMessage("⚠️ Transfer Protocol Fault: " + err.message, threadID, messageID);
  }
};
