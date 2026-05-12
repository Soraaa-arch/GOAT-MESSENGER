const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "transfer",
  aliases: ["pay", "give"],
  version: "1.0.2",
  author: "Minh Anh",
  countDown: 5,
  role: 0,
  shortDescription: "Secure peer-to-peer credit transfer",
  category: "economy"
};

module.exports.onStart = async function ({ api, event, args, usersData }) {
  const { threadID, messageID, senderID, mentions, type, messageReply } = event;

  try {
    let targetID;
    let amountStr;

    if (type === "message_reply") {
      targetID = messageReply.senderID;
      amountStr = args[0];
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
      amountStr = args.find(a => !a.includes(targetID) && !isNaN(a.replace(/,/g, "")));
    } else if (args[0] && !isNaN(args[0]) && args[1]) {
      targetID = args[0];
      amountStr = args[1];
    }

    if (!targetID || targetID === senderID) {
      return api.sendMessage("Invalid recipient selected", threadID, messageID);
    }

    const amount = BigInt(amountStr ? amountStr.replace(/,/g, "") : 0);
    if (amount <= 0n) {
      return api.sendMessage("Specify a valid transfer amount", threadID, messageID);
    }

    const senderData = await usersData.get(senderID) || { data: {} };
    const targetData = await usersData.get(targetID) || { data: {} };
    
    const senderBalance = BigInt(senderData.data.money || 0);
    const targetBalance = BigInt(targetData.data.money || 0);

    if (senderBalance < amount) {
      return api.sendMessage("Insufficient funds for this transaction", threadID, messageID);
    }

    senderData.data.money = (senderBalance - amount).toString();
    targetData.data.money = (targetBalance + amount).toString();

    await usersData.set(senderID, senderData.data);
    await usersData.set(targetID, targetData.data);

    const senderName = await usersData.getName(senderID);
    const targetName = await usersData.getName(targetID);
    
    let msg = "━━━━━━━━━━━━━━\n";
    msg += "   TRANSFER SUCCESSFUL\n";
    msg += "━━━━━━━━━━━━━━\n";
    msg += "From | " + senderName + "\n";
    msg += "To | " + targetName + "\n";
    msg += "Amount | $" + amount.toLocaleString() + "\n";
    msg += "━━━━━━━━━━━━━━";

    return api.sendMessage(msg, threadID, messageID);

  } catch (err) {
    return api.sendMessage("Transfer Error " + err.message, threadID, messageID);
  }
};
