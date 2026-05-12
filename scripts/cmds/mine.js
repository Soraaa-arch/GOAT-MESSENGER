module.exports.config = {
  name: "mine",
  aliases: ["bitcoin", "btc", "mining"],
  version: "1.0",
  author: "Minh Anh",
  countDown: 30, // 30-second cooldown to prevent spam
  role: 0,
  category: "economy",
  shortDescription: "Execute a Sovereign Hash-Power Mining sequence",
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
    // 1. DATA INITIALIZATION
    const userData = await usersData.get(senderID);
    const currentBalance = getSafeBigInt(userData?.data?.money ?? "0");
    const name = await usersData.getName(senderID);

    // 2. MINING LOGIC (Simulated Hash Rate)
    // Generates a random profit between $500,000 and $5,000,000 (adjust as needed)
    const baseProfit = BigInt(Math.floor(Math.random() * 4500000) + 500000);
    const hashrate = (Math.random() * (95.5 - 12.1) + 12.1).toFixed(2);
    
    const newBalance = currentBalance + baseProfit;

    // 3. DATABASE SYNC
    await usersData.set(senderID, { 
      data: { 
        ...userData.data, 
        money: newBalance.toString() 
      } 
    });

    // 4. VISUAL TERMINAL OUTPUT
    const msg = {
      body: `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐌𝐈𝐍𝐈𝐍𝐆 𝐍𝐄𝐓𝐖𝐎𝐑𝐊\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `👤 𝐎𝐩𝐞𝐫𝐚𝐭𝐨𝐫: ${name.toUpperCase()}\n` +
            `📡 𝐒𝐭𝐚𝐭𝐮𝐬: Hash-Sequence Complete\n` +
            `⚡ 𝐇𝐚𝐬𝐡𝐫𝐚𝐭𝐞: ${hashrate} TH/s\n` +
            `📦 𝐁𝐥𝐨𝐜𝐤 𝐑𝐞𝐰𝐚𝐫𝐝: +$${fmt(baseProfit)}\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `🏦 𝐔𝐏𝐃𝐀𝐓𝐄𝐃 𝐋𝐄𝐃𝐆𝐄𝐑:\n` +
            `   $${fmt(newBalance)}\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `𝐓𝐫𝐚𝐧𝐬𝐚𝐜𝐭𝐢𝐨𝐧 𝐄𝐧𝐜𝐫𝐲𝐩𝐭𝐞𝐝`
    };

    return api.sendMessage(msg, threadID, messageID);

  } catch (err) {
    return api.sendMessage("⚠️ Terminal Fault: " + err.message, threadID, messageID);
  }
};
