const fmt = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

module.exports = {
  config: {
    name: "fish",
    version: "3.8.0",
    author: "Minh Anh",
    countDown: 5,
    role: 0,
    category: "economy",
    guide: { en: "{p}fish [catch/upgrade]" }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID, senderID } = event;
    const userData = await usersData.get(senderID);
    const userMoney = BigInt((userData.data.money || "0").toString().split('.')[0]);
    let rodLevel = parseInt(userData.data.rodLevel) || 1;

    const rods = [
      { name: "🎋 Bamboo Stick", breakChance: 0.20, maxMult: 5n },
      { name: "🎣 Carbon Rod", price: 500000n, breakChance: 0.15, maxMult: 20n },
      { name: "🔱 Sovereign Harpoon", price: 50000000n, breakChance: 0.05, maxMult: 300n }
    ];

    const currentRod = rods[rodLevel - 1];

    // BUFFED: 35% Hazard Rate total (was 60%)
    const fishPool = [
      { name: "🐟 Common Bass", chance: 0.35, mult: 10n, type: "catch" },
      { name: "🤮 𝐏𝐎𝐈𝐒𝐎𝐍 𝐅𝐈𝐒𝐇", chance: 0.20, mult: 0n, type: "poison" },
      { name: "💣 𝐁𝐎𝐌𝐁 𝐅𝐈𝐒𝐇", chance: 0.15, mult: 0n, type: "bomb" },
      { name: "🦈 Blue Shark", chance: 0.25, mult: 150n, type: "catch" },
      { name: "👑 Sovereign Leviathan", chance: 0.05, mult: 2500n, type: "catch" }
    ];

    let r = Math.random(), accum = 0, catchResult = fishPool[0];
    for (const f of fishPool) { accum += f.chance; if (r <= accum) { catchResult = f; break; } }

    let finalBalance = userMoney, status = "🌊 𝐒𝐔𝐂𝐂𝐄𝐒𝐒", impact = "";

    if (catchResult.type === "bomb") {
      const loss = userMoney / 5n; finalBalance -= loss; rodLevel = 1;
      status = "☣️ 𝐃𝐄𝐓𝐎𝐍𝐀𝐓𝐈𝐎𝐍"; impact = `💸 𝐃𝐚𝐦𝐚𝐠𝐞: -$${fmt(loss)}\n⚠️ 𝐑𝐨𝐝 𝐑𝐞𝐬𝐞𝐭`;
    } else if (catchResult.type === "poison") {
      const loss = userMoney / 10n; finalBalance -= loss;
      status = "🧪 𝐓𝐎𝐗𝐈𝐂"; impact = `💸 𝐅𝐞𝐞: -$${fmt(loss)}`;
    } else {
      const win = catchResult.mult * currentRod.maxMult * 1000n; finalBalance += win;
      impact = `💰 𝐏𝐫𝐨𝐟𝐢𝐭: +$${fmt(win)}`;
    }

    await usersData.set(senderID, { money: finalBalance.toString(), data: { ...userData.data, money: finalBalance.toString(), rodLevel } });

    let msg = `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐓𝐈𝐃𝐄𝐒\n━━━━━━━━━━━━━━━━━━\n🎣 𝐑𝐨𝐝: ${currentRod.name}\n🌊 𝐂𝐚𝐭𝐜𝐡: ${catchResult.name}\n━━━━━━━━━━━━━━━━━━\n${status}\n${impact}\n━━━━━━━━━━━━━━━━━━\n🏦 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: $${fmt(finalBalance)}\n━━━━━━━━━━━━━━━━━━\n   𝐄𝐗𝐄𝐂𝐔𝐓𝐄𝐃 𝐁𝐘 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐋𝐈𝐓𝐄`;
    return api.sendMessage(msg, threadID, messageID);
  }
};
