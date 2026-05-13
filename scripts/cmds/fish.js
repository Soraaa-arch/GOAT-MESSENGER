const fmt = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

module.exports = {
  config: {
    name: "fish",
    aliases: ["fishing", "catch"],
    version: "4.0.0",
    author: "Minh Anh",
    countDown: 300, // 5 minutes cooldown
    role: 0,
    category: "economy",
    guide: {
      en: "{p}fish [catch/upgrade]"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID, senderID } = event;

    // --- SOVEREIGN CONFIGURATION ---
    const ADMIN_UID = "61576612175253"; // <--- REPLACE THIS WITH YOUR REAL UID
    const WIN_TAX_RATE = 0.05; // 5% Royal Tax
    // -------------------------------

    const userData = await usersData.get(senderID);
    const rawMoney = (userData.data.money || "0").toString().split('.')[0].split('e')[0];
    const userMoney = BigInt(rawMoney);

    if (!userData.data.rodLevel) userData.data.rodLevel = 1;
    let rodLevel = parseInt(userData.data.rodLevel);

    const rods = [
      { name: "🎋 Bamboo Stick", price: 0n, breakChance: 0.20, maxMult: 5n },
      { name: "🎣 Carbon Rod", price: 500000n, breakChance: 0.15, maxMult: 20n },
      { name: "🔱 Sovereign Harpoon", price: 50000000n, breakChance: 0.05, maxMult: 300n }
    ];

    const currentRod = rods[rodLevel - 1];

    if (args[0] === "upgrade") {
      if (rodLevel >= rods.length) return api.sendMessage("✨ 𝐘𝐨𝐮 𝐚𝐥𝐫𝐞𝐚𝐝𝐲 𝐰𝐢𝐞𝐥𝐝 𝐭𝐡𝐞 𝐒𝐨𝐯𝐞𝐫𝐞𝐢𝐠𝐧 𝐇𝐚𝐫𝐩𝐨𝐨𝐧.", threadID, messageID);
      const nextRod = rods[rodLevel];
      if (userMoney < nextRod.price) return api.sendMessage(`❌ 𝐈𝐍𝐒𝐔𝐅𝐅𝐈𝐂𝐈𝐄𝐍𝐓 𝐂𝐑𝐄𝐃𝐈𝐓𝐒.\nRequired: $${fmt(nextRod.price)}`, threadID, messageID);

      const finalBalance = userMoney - nextRod.price;
      await usersData.set(senderID, { 
        money: finalBalance.toString(),
        data: { ...userData.data, money: finalBalance.toString(), rodLevel: rodLevel + 1 } 
      });
      return api.sendMessage(`🛠️ 𝐑𝐎𝐃 𝐔𝐏𝐆𝐑𝐀𝐃𝐄𝐃\n━━━━━━━━━━━━━━━━━━\nNew Rod: ${nextRod.name}\nCost: -$${fmt(nextRod.price)}\n━━━━━━━━━━━━━━━━━━\n🏦 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: $${fmt(finalBalance)}`, threadID, messageID);
    }

    if (Math.random() < currentRod.breakChance) {
      await usersData.set(senderID, { data: { ...userData.data, rodLevel: 1 } });
      return api.sendMessage(`💥 𝐒𝐍𝐀𝐏!\n━━━━━━━━━━━━━━━━━━\nYour ${currentRod.name} has shattered.\n⚠️ 𝐑𝐨𝐝 𝐫𝐞𝐬𝐞𝐭 𝐭𝐨 𝐁𝐚mboo Stick.`, threadID, messageID);
    }

    const fishPool = [
      { name: "🐟 Common Bass", chance: 0.35, mult: 10n, type: "catch" },
      { name: "🤮 𝐏𝐎𝐈𝐒𝐎𝐍 𝐅𝐈𝐒𝐇", chance: 0.20, mult: 0n, type: "poison" }, 
      { name: "💣 𝐁𝐎𝐌𝐁 𝐅𝐈𝐒𝐇", chance: 0.15, mult: 0n, type: "bomb" },     
      { name: "🐠 Tropical Tang", chance: 0.15, mult: 30n, type: "catch" },
      { name: "🦈 Blue Shark", chance: 0.10, mult: 120n, type: "catch" },
      { name: "👑 Sovereign Leviathan", chance: 0.05, mult: 2500n, type: "catch" }
    ];

    let catchResult = fishPool[0];
    let r = Math.random();
    let accum = 0;
    for (const fish of fishPool) {
      accum += fish.chance;
      if (r <= accum) {
        catchResult = fish; break;
      }
    }

    let finalBalance = userMoney;
    let status = "";
    let impactMsg = "";

    if (catchResult.type === "bomb") {
      const loss = userMoney / 5n;
      finalBalance = userMoney - loss;
      status = "☣️ 𝐃𝐄𝐓𝐎𝐍𝐀𝐓𝐈𝐎𝐍!";
      impactMsg = `💸 𝐃𝐚𝐦𝐚𝐠𝐞: -$${fmt(loss)}\n⚠️ 𝐑𝐨𝐝 𝐑𝐞𝐬𝐞𝐭`;
      await usersData.set(senderID, { money: finalBalance.toString(), data: { ...userData.data, money: finalBalance.toString(), rodLevel: 1 } });
    } 
    else if (catchResult.type === "poison") {
      const loss = userMoney / 10n;
      finalBalance = userMoney - loss;
      status = "🧪 𝐓𝐎𝐗𝐈𝐂 𝐄𝐗𝐏𝐎𝐒𝐔𝐑𝐄!";
      impactMsg = `💸 𝐌𝐞𝐝𝐢𝐜𝐚𝐥 𝐅𝐞𝐞: -$${fmt(loss)}`;
      await usersData.set(senderID, { money: finalBalance.toString(), data: { ...userData.data, money: finalBalance.toString() } });
    } 
    else {
      const baseValue = 1000n;
      const totalWin = catchResult.mult * currentRod.maxMult * baseValue;
      
      // TAX CALCULATION
      const taxAmount = BigInt(Math.floor(Number(totalWin) * WIN_TAX_RATE));
      const netWin = totalWin - taxAmount;
      
      finalBalance = userMoney + netWin;
      status = "🌊 𝐒𝐔𝐂𝐂𝐄𝐒𝐒𝐅𝐔𝐋 𝐇𝐀𝐔𝐋";
      impactMsg = `💰 𝐆𝐫𝐨𝐬𝐬: +$${fmt(totalWin)}\n⚖️ 𝐑𝐨𝐲𝐚𝐥 𝐓𝐚𝐱 (𝟓%): -$${fmt(taxAmount)}\n🎁 𝐍𝐞𝐭 𝐏𝐫𝐨𝐟𝐢𝐭: +$${fmt(netWin)}`;

      // Update Admin (Claim Tax)
      const adminData = await usersData.get(ADMIN_UID);
      const adminBalance = BigInt((adminData.data.money || "0").toString().split('.')[0]) + taxAmount;
      await usersData.set(ADMIN_UID, { money: adminBalance.toString(), data: { ...adminData.data, money: adminBalance.toString() } });

      await usersData.set(senderID, { money: finalBalance.toString(), data: { ...userData.data, money: finalBalance.toString() } });
    }

    let msg = `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐓𝐈𝐃𝐄𝐒\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `🎣 𝐑𝐨𝐝: ${currentRod.name}\n`;
    msg += `🌊 𝐂𝐚𝐭𝐜𝐡: ${catchResult.name}\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `${status}\n`;
    msg += `${impactMsg}\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `📢 𝐓𝐚𝐱 𝐫𝐞𝐯𝐞𝐧𝐮𝐞 𝐜𝐥𝐚𝐢𝐦𝐞𝐝 𝐛𝐲 𝐓𝐡𝐞 𝐒𝐨𝐯𝐞𝐫𝐞𝐢𝐠𝐧.\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `   𝐄𝐗𝐄𝐂𝐔𝐓𝐄𝐃 𝐁𝐘 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐋𝐈𝐓𝐄`;

    return api.sendMessage(msg, threadID, messageID);
  }
};
