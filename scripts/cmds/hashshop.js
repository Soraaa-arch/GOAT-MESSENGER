module.exports.config = {
  name: "hashshop",
  aliases: ["hshop", "minerupgrade"],
  version: "1.0",
  author: "Minh Anh",
  role: 0,
  category: "economy",
  shortDescription: "Purchase high-end ASIC hardware upgrades"
};

function getSafeBigInt(value) {
  try {
    const clean = value.toString().split('.')[0].replace(/[^0-9]/g, '');
    return clean ? BigInt(clean) : 0n;
  } catch (e) { return 0n; }
}

const upgrades = [
  { level: 1, name: "Antminer S19", price: 50000000n, multiplier: 2 },
  { level: 2, name: "Sovereign Liquid Rig", price: 250000000n, multiplier: 5 },
  { level: 3, name: "Quantum Hash Array", price: 1000000000n, multiplier: 15 },
  { level: 4, name: "Satellite Mine Node", price: 50000000000n, multiplier: 50 }
];

module.exports.onStart = async function ({ api, event, args, usersData }) {
  const { senderID, threadID, messageID } = event;
  const userData = await usersData.get(senderID);
  const currentBalance = getSafeBigInt(userData?.data?.money ?? "0");
  const currentLevel = parseInt(userData?.data?.minerLevel || 0);

  if (!args[0]) {
    let msg = "🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐇𝐀𝐒𝐇 𝐒𝐇𝐎𝐏\n━━━━━━━━━━━━━━━━━━\n";
    upgrades.forEach(u => {
      const status = currentLevel >= u.level ? "✅ OWNED" : `$${u.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
      msg += `[ LVL ${u.level} ] ${u.name}\n🚀 Boost: ${u.multiplier}x Reward\n💰 Cost: ${status}\n\n`;
    });
    msg += `━━━━━━━━━━━━━━━━━━\nType: hashshop [level] to upgrade`;
    return api.sendMessage(msg, threadID, messageID);
  }

  const targetLevel = parseInt(args[0]);
  const upgrade = upgrades.find(u => u.level === targetLevel);

  if (!upgrade) return api.sendMessage("❌ Invalid hardware level.", threadID, messageID);
  if (currentLevel >= targetLevel) return api.sendMessage("⚠️ You already own this or better hardware.", threadID, messageID);
  if (currentBalance < upgrade.price) return api.sendMessage("❌ Insufficient assets for this acquisition.", threadID, messageID);

  const newBalance = currentBalance - upgrade.price;
  await usersData.set(senderID, { 
    data: { ...userData.data, money: newBalance.toString(), minerLevel: targetLevel } 
  });

  return api.sendMessage(`🏛️ 𝐇𝐀𝐑𝐃𝐖𝐀𝐑𝐄 𝐀𝐂𝐐𝐔𝐈𝐒𝐈𝐓𝐈𝐎𝐍\n━━━━━━━━━━━━━━━━━━\nSuccessfully installed: ${upgrade.name}\nYour daily mining rewards are now boosted by ${upgrade.multiplier}x.\n━━━━━━━━━━━━━━━━━━`, threadID, messageID);
};
