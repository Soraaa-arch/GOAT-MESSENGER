module.exports.config = {
  name: "slot",
  version: "3.6",
  author: "MOHAMMAD AKASH x Minh Anh",
  role: 0,
  category: "economy",
  shortDescription: "Sovereign Slot - BigInt Fix"
};

const symbols = [
  { emoji: "👑", weight: 3,  multiplier: 50n },
  { emoji: "💎", weight: 5,  multiplier: 20n },
  { emoji: "🎰", weight: 12, multiplier: 10n },
  { emoji: "💰", weight: 20, multiplier: 5n },
  { emoji: "💵", weight: 25, multiplier: 3n },
  { emoji: "🍒", weight: 35, multiplier: 2n }
];

const fmt = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

function weightedPick() {
  const total = symbols.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const sym of symbols) {
    r -= sym.weight;
    if (r <= 0) return sym;
  }
  return symbols[0];
}

module.exports.onStart = async function ({ api, event, args, usersData }) {
  const { senderID, threadID, messageID } = event;

  const betInput = args[0]?.toLowerCase();
  const userData = await usersData.get(senderID);
  
  // FIX: Force string conversion then split at decimal/scientific notation if it exists
  const rawMoney = (userData.data.money || "0").toString().split('.')[0].split('e')[0];
  const userMoney = BigInt(rawMoney);

  let betAmount;
  if (betInput === "all") {
    betAmount = userMoney;
  } else {
    // FIX: Ensure we don't accidentally create a float during replacement
    const sanitizedBet = betInput?.replace(/[^0-9]/g, '') || "0";
    betAmount = sanitizedBet === "" ? 0n : BigInt(sanitizedBet);
  }

  if (betAmount <= 0n) {
    return api.sendMessage("🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐒𝐋𝐎𝐓𝐒\n━━━━━━━━━━━━━━━━━━\n💡 𝐔𝐬𝐚𝐠𝐞: {p}slot [amount]", threadID, messageID);
  }

  if (betAmount > userMoney) {
    return api.sendMessage("❌ 𝐈𝐍𝐒𝐔𝐅𝐅𝐈𝐂𝐈𝐄𝐍𝐓 𝐂𝐑𝐄𝐃𝐈𝐓𝐒.", threadID, messageID);
  }

  const s1 = weightedPick();
  const s2 = weightedPick();
  const s3 = weightedPick();

  let finalBalance = userMoney - betAmount;
  let yieldMult = 0n;
  let status = "📉 𝐍𝐎 𝐌𝐀𝐓𝐂𝐇";

  if (s1.emoji === s2.emoji && s2.emoji === s3.emoji) {
    yieldMult = s1.multiplier;
    status = s1.emoji === "👑" ? "🎰 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐉𝐀𝐂𝐊𝐏𝐎𝐓!" : "✨ 𝐓𝐑𝐈𝐏𝐋𝐄 𝐖𝐈𝐍!";
  } else if (s1.emoji === s2.emoji || s2.emoji === s3.emoji || s1.emoji === s3.emoji) {
    yieldMult = 2n; 
    status = "📈 𝐒𝐌𝐀𝐋𝐋 𝐖𝐈𝐍";
  }

  if (yieldMult > 0n) {
    finalBalance += (betAmount * yieldMult);
  }

  let msg = `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐒𝐋𝐎𝐓𝐒\n`;
  msg += `━━━━━━━━━━━━━━━━━━\n`;
  msg += `      [ ${s1.emoji} | ${s2.emoji} | ${s3.emoji} ]\n`;
  msg += `━━━━━━━━━━━━━━━━━━\n`;
  msg += `${status}\n`;
  
  if (yieldMult > 0n) {
    msg += `✨ 𝐘𝐢𝐞𝐥𝐝: ${yieldMult}𝐱\n`;
    msg += `💰 𝐏𝐫𝐨𝐟𝐢𝐭: +$${fmt(betAmount * yieldMult - betAmount)}\n`;
  } else {
    msg += `💸 𝐋𝐨𝐬𝐬: -$${fmt(betAmount)}\n`;
  }
  
  msg += `━━━━━━━━━━━━━━━━━━\n`;
  msg += `🏦 𝐁𝐀𝐋𝐀𝐍𝐂𝐄: $${fmt(finalBalance)}\n`;
  msg += `━━━━━━━━━━━━━━━━━━\n`;
  msg += `   𝐄𝐗𝐄𝐂𝐔𝐓𝐄𝐃 𝐁𝐘 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐋𝐈𝐓𝐄`;

  // Save as string to prevent scientific notation in database
  await usersData.set(senderID, { data: { ...userData.data, money: finalBalance.toString() } });

  return api.sendMessage(msg, threadID, messageID);
};
