module.exports.config = {
  name: "mine",
  aliases: ["btc", "mining"],
  version: "3.5",
  author: "Minh Anh",
  countDown: 86400, // 24-hour cooldown
  role: 0,
  category: "economy",
  shortDescription: "Daily Sovereign Hash-Power Sequence",
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

/**
 * Hardware Registry: Must match the levels in hashshop.js
 */
const hardwareRegistry = {
  0: { name: "INTEGRATED CPU", mult: 1n },
  1: { name: "ANTMINER S19", mult: 2n },
  2: { name: "SOVEREIGN LIQUID RIG", mult: 5n },
  3: { name: "QUANTUM HASH ARRAY", mult: 15n },
  4: { name: "SATELLITE MINE NODE", mult: 50n }
};

module.exports.onStart = async function ({ api, event, usersData }) {
  const { senderID, threadID, messageID } = event;

  try {
    const userData = await usersData.get(senderID) || { data: {} };
    const name = await usersData.getName(senderID) || "Operator";
    
    // Retrieve Level from Hash Shop (defaults to 0 if not purchased)
    const currentLevel = userData.data.minerLevel || 0;
    const rig = hardwareRegistry[currentLevel] || hardwareRegistry[0];

    // Calculate Reward: Base ($10M-$50M) * Rig Multiplier
    const baseProfit = BigInt(Math.floor(Math.random() * 40000000) + 10000000);
    const finalReward = baseProfit * rig.mult;
    
    const currentBalance = getSafeBigInt(userData.data.money || "0");
    const newBalance = currentBalance + finalReward;

    // Update Database
    await usersData.set(senderID, { 
      data: { 
        ...userData.data, 
        money: newBalance.toString() 
      } 
    });

    // Luxury Output
    const msg = {
      body: `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐌𝐈𝐍𝐈𝐍𝐆 𝐍𝐄𝐓𝐖𝐎𝐑𝐊\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `👤 𝐎𝐩𝐞𝐫𝐚𝐭𝐨𝐫: ${name.toUpperCase()}\n` +
            `⚙️ 𝐇𝐚𝐫𝐝𝐰𝐚𝐫𝐞: ${rig.name}\n` +
            `⚡ 𝐁𝐨𝐨𝐬𝐭: ${rig.mult}x Efficiency\n\n` +
            `📦 𝐁𝐥𝐨𝐜𝐤 𝐑𝐞𝐰𝐚𝐫𝐝: +$${fmt(finalReward)}\n` +
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
