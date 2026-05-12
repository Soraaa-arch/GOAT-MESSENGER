module.exports.config = {
  name: "mine",
  aliases: ["btc", "mining"],
  version: "2.0",
  author: "Minh Anh",
  countDown: 86400, // 24-hour cooldown in seconds
  role: 0,
  category: "economy",
  shortDescription: "Execute a Daily Sovereign Hash-Power Sequence",
  guide: "{p}mine"
};

/**
 * BigInt parsing to handle massive bank balances.
 */
function getSafeBigInt(value) {
  try {
    if (!value) return 0n;
    const clean = value.toString().split('.')[0].replace(/[^0-9]/g, '');
    return clean ? BigInt(clean) : 0n;
  } catch (e) {
    return 0n;
  }
}

function fmt(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

module.exports.onStart = async function ({ api, event, usersData }) {
  const { senderID, threadID, messageID } = event;

  try {
    const userData = await usersData.get(senderID);
    const currentBalance = getSafeBigInt(userData?.data?.money ?? "0");
    const name = await usersData.getName(senderID);

    // DAILY REWARD LOGIC
    // Generates a substantial daily profit: $10,000,000 to $50,000,000
    const baseProfit = BigInt(Math.floor(Math.random() * 40000000) + 10000000);
    const hashrate = (Math.random() * (210.5 - 140.1) + 140.1).toFixed(2);
    
    const newBalance = currentBalance + baseProfit;

    // DATABASE SYNC
    await usersData.set(senderID, { 
      data: { 
        ...userData.data, 
        money: newBalance.toString() 
      } 
    });

    // OUTPUT RECEIPT
    const msg = {
      body: `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐌𝐈𝐍𝐈𝐍𝐆 𝐍𝐄𝐓𝐖𝐎𝐑𝐊\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `👤 𝐎𝐩𝐞𝐫𝐚𝐭𝐨𝐫: ${name.toUpperCase()}\n` +
            `📡 𝐒𝐭𝐚𝐭𝐮𝐬: Daily Block Discovered\n` +
            `⚡ 𝐇𝐚𝐬𝐡𝐫𝐚𝐭𝐞: ${hashrate} TH/s\n` +
            `📦 𝐁𝐥𝐨𝐜𝐤 𝐑𝐞𝐰𝐚𝐫𝐝: +$${fmt(baseProfit)}\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `🏦 𝐔𝐏𝐃𝐀𝐓𝐄𝐃 𝐋𝐄𝐃𝐆𝐄𝐑:\n` +
            `   $${fmt(newBalance)}\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `𝐍𝐞𝐱𝐭 𝐒𝐞𝐪𝐮𝐞𝐧𝐜𝐞 𝐚𝐯𝐚𝐢𝐥𝐚𝐛𝐥𝐞 𝐢𝐧 𝟐𝟒𝐡`
    };

    return api.sendMessage(msg, threadID, messageID);

  } catch (err) {
    return api.sendMessage("⚠️ Terminal Fault: " + err.message, threadID, messageID);
  }
};
