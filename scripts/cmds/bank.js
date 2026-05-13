const fs = require("fs-extra");

module.exports.config = {
  name: "bank",
  aliases: ["vault", "dep", "wd", "collect"],
  version: "11.0",
  author: "Minh Anh",
  countDown: 5,
  role: 0,
  shortDescription: "Secure Sovereign Vault with Daily Interest Accrual",
  category: "economy",
  guide: "{p}bank [deposit/withdraw/collect] [amount]"
};

const INTEREST_RATE = 0.005; 
const COLLECTION_COOLDOWN = 86400000;

function formatBalance(num) {
  try {
    const n = BigInt(num.toString().split('.')[0] || 0);
    if (n === 0n) return "0";
    const suffixes = [
      { v: 10n**100n, s: "Googol" }, { v: 10n**33n, s: "Dec" },
      { v: 10n**30n, s: "Non" }, { v: 10n**27n, s: "Oct" },
      { v: 10n**24n, s: "Sep" }, { v: 10n**21n, s: "Sex" },
      { v: 10n**18n, s: "Qui" }, { v: 10n**15n, s: "Q" },
      { v: 10n**12n, s: "T" }, { v: 10n**9n, s: "B" },
      { v: 10n**6n, s: "M" }, { v: 10n**3n, s: "K" }
    ];
    for (const { v, s } of suffixes) {
      if (n >= v) {
        const val = (n / (v / 10n)).toString();
        return val.slice(0, -1) + "." + val.slice(-1) + s;
      }
    }
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  } catch (e) { return "0"; }
}

module.exports.onStart = async function ({ api, event, args, usersData }) {
  const { threadID, messageID, senderID } = event;
  const action = args[0]?.toLowerCase();
  const amountInput = args[1];

  try {
    const userData = await usersData.get(senderID);
    
    // FIX: Extract raw value from potential [object Object]
    const extract = (val) => {
      if (typeof val === 'object' && val !== null) return val.money || val.bank || Object.values(val)[0] || "0";
      return val || "0";
    };

    if (!userData.data) userData.data = {};
    if (!userData.data.bank) userData.data.bank = "0";
    if (!userData.data.lastInterest) userData.data.lastInterest = 0;
    
    // FIX: Sanitize before BigInt conversion
    const cash = BigInt(extract(userData.data.money || 0).toString().split('.')[0].replace(/[^0-9]/g, '') || "0");
    const vault = BigInt(extract(userData.data.bank || 0).toString().split('.')[0].replace(/[^0-9]/g, '') || "0");

    if (action === "collect") {
      const now = Date.now();
      const lastCollect = userData.data.lastInterest;

      if (now - lastCollect < COLLECTION_COOLDOWN) {
        const remaining = COLLECTION_COOLDOWN - (now - lastCollect);
        const hours = Math.floor(remaining / 3600000);
        const mins = Math.floor((remaining % 3600000) / 60000);
        return api.sendMessage(`⏳ 𝐏𝐫𝐨𝐭𝐨𝐜𝐨𝐥 𝐃𝐞𝐥𝐚𝐲: Interest matures every 24 hours.\n⚠️ 𝐑𝐞𝐭𝐮𝐫𝐧 𝐢𝐧: ${hours}h ${mins}m`, threadID, messageID);
      }

      if (vault <= 0n) return api.sendMessage("⚠️ 𝐕𝐚𝐮𝐥𝐭 𝐄𝐦𝐩𝐭𝐲: No assets found to generate interest.", threadID, messageID);

      const interestEarned = BigInt(Math.floor(Number(vault) * INTEREST_RATE));
      const newVault = vault + interestEarned;

      await usersData.set(senderID, { 
        data: { ...userData.data, bank: newVault.toString(), lastInterest: now } 
      });

      return api.sendMessage({
        body: `📈 𝐃𝐀𝐈𝐋𝐘 𝐘𝐈𝐄𝐋𝐃 𝐀𝐂𝐂𝐑𝐔𝐄𝐃\n━━━━━━━━━━━━━━━━━━\n𝐀𝐬𝐬𝐞𝐭 𝐘𝐢𝐞𝐥𝐝: +$${formatBalance(interestEarned)}\n𝐍𝐞𝐰 𝐕𝐚𝐮𝐥𝐭 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: $${formatBalance(newVault)}\n━━━━━━━━━━━━━━━━━━\nAssets reinvested into the Sovereign Vault.`
      }, threadID, messageID);
    }

    if (!action) {
      const projectedInterest = BigInt(Math.floor(Number(vault) * INTEREST_RATE));
      return api.sendMessage({
        body: `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐕𝐀𝐔𝐋𝐓 𝐒𝐓𝐀𝐓𝐔𝐒\n━━━━━━━━━━━━━━━━━━\n👤 𝐇𝐨𝐥𝐝𝐞𝐫: ${userData.name}\n\n💰 𝐋𝐢𝐪𝐮𝐢𝐝 𝐂𝐚𝐬𝐡: $${formatBalance(cash)}\n🏦 𝐕𝐚𝐮𝐥𝐭 𝐀𝐬𝐬𝐞𝐭𝐬: $${formatBalance(vault)}\n━━━━━━━━━━━━━━━━━━\n📈 𝐃𝐚𝐢𝐥𝐲 𝐘𝐢𝐞𝐥𝐝: +$${formatBalance(projectedInterest)}\n⚖️ 𝐈𝐧𝐭𝐞𝐫𝐞𝐬𝐭 𝐑𝐚𝐭𝐞: ${(INTEREST_RATE * 100).toFixed(1)}% / 𝟐𝟒𝐡\n━━━━━━━━━━━━━━━━━━\n𝐔𝐬𝐞: 'bank collect' once per day.`
      }, threadID, messageID);
    }

    let amount;
    if (amountInput?.toLowerCase() === "all") {
      amount = (action === "deposit" || action === "dep") ? cash : vault;
    } else {
      let cleanAmount = (amountInput || "0").replace(/,/g, '').toLowerCase();
      if (cleanAmount.includes('m')) amount = BigInt(parseFloat(cleanAmount) * 1e6);
      else if (cleanAmount.includes('b')) amount = BigInt(parseFloat(cleanAmount) * 1e9);
      else amount = BigInt(cleanAmount.split('.')[0].replace(/[^0-9]/g, '') || "0");
    }

    if (amount <= 0n) return api.sendMessage("⚠️ Invalid amount.", threadID, messageID);

    if (action === "deposit" || action === "dep") {
      if (amount > cash) return api.sendMessage("❌ Insufficient liquid funds.", threadID, messageID);
      const newCash = cash - amount;
      const newVault = vault + amount;
      await usersData.set(senderID, { data: { ...userData.data, money: newCash.toString(), bank: newVault.toString() } });
      return api.sendMessage(`✅ Moved $${formatBalance(amount)} to the Sovereign Vault.`, threadID, messageID);
    }

    if (action === "withdraw" || action === "wd") {
      if (amount > vault) return api.sendMessage("❌ Insufficient vault assets.", threadID, messageID);
      const newCash = cash + amount;
      const newVault = vault - amount;
      await usersData.set(senderID, { data: { ...userData.data, money: newCash.toString(), bank: newVault.toString() } });
      return api.sendMessage(`✅ Moved $${formatBalance(amount)} to Liquid Assets.`, threadID, messageID);
    }

  } catch (err) {
    console.error(err); // Logs the real error to Railway/Console
    return api.sendMessage(`⚠️ System Fault: ${err.message}`, threadID, messageID);
  }
};
