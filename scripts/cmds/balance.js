const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");

if (!global.milestoneRegistry) global.milestoneRegistry = {};

/**
 * FIXED: Secure parsing to prevent "Massive" error.
 * Strips decimals and non-numeric characters before BigInt conversion.
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

function getTierData(balance) {
  const n = getSafeBigInt(balance);
  
  if (n >= 10n**100n) return { 
    id: 6, name: "GOOGOL OVERLORD", rank: "COSMIC ENTITY", 
    color: ["#000000", "#1a0033", "#4b0082"], accent: "#cc00ff", 
    chip: ["#ff00ff", "#ffffff"], text: "#ffffff", glass: "rgba(255, 255, 255, 0.1)" 
  };
  if (n >= 10n**30n) return { 
    id: 5, name: "CELESTIAL DIAMOND", rank: "GALAXY ARCHITECT", 
    color: ["#0f2027", "#203a43", "#2c5364"], accent: "#b9f2ff", 
    chip: ["#b9f2ff", "#ffffff"], text: "#ffffff", glass: "rgba(185, 242, 255, 0.2)", special: "hologram" 
  };
  if (n >= 10n**15n) return { 
    id: 4, name: "AETHER PLATINUM", rank: "AETHER ARCHON", 
    color: ["#cfd9df", "#ffffff", "#e2ebf0"], accent: "#00d4ff", 
    chip: ["#00d4ff", "#ffffff"], text: "#1a1a1a", glass: "rgba(255, 255, 255, 0.5)", special: "hologram" 
  };
  if (n >= 10n**12n) return { 
    id: 3, name: "ZENITH GOLD", rank: "TRILLIONAIRE ELITE", 
    color: ["#0f0f0f", "#2c2c2c"], accent: "#D4AF37", 
    chip: ["#BF953F", "#FCF6BA"], text: "#ffffff", glass: "rgba(255, 215, 0, 0.1)" 
  };
  if (n >= 10n**9n) return { 
    id: 2, name: "TITAN IRON", rank: "BILLIONAIRE TYCOON", 
    color: ["#232526", "#414345"], accent: "#e5e4e2", 
    chip: ["#8e8e8e", "#e0e0e0"], text: "#ffffff", glass: "rgba(255, 255, 255, 0.15)" 
  };
  return { 
    id: 1, name: "STANDARD DIGITAL", rank: "MEMBER", 
    color: ["#1e3c72", "#2a5298"], accent: "#ffffff", 
    chip: ["#e0e0e0", "#8e8e8e"], text: "#ffffff", glass: "rgba(255, 255, 255, 0.2)" 
  };
}

function formatBalance(num) {
  const n = getSafeBigInt(num);
  if (n === 0n) return "0";

  const suffixes = [
    { v: 10n**100n, s: "Googol" },
    { v: 10n**33n,  s: "Dec" },
    { v: 10n**30n,  s: "Non" },
    { v: 10n**27n,  s: "Oct" },
    { v: 10n**24n,  s: "Sep" },
    { v: 10n**21n,  s: "Sex" },
    { v: 10n**18n,  s: "Qui" },
    { v: 10n**15n,  s: "Q" },
    { v: 10n**12n,  s: "T" },
    { v: 10n**9n,   s: "B" },
    { v: 10n**6n,   s: "M" },
    { v: 10n**3n,   s: "K" }
  ];

  for (const { v, s } of suffixes) {
    if (n >= v) {
      const calculation = (n / (v / 10n)).toString();
      const whole = calculation.slice(0, -1) || "0";
      const decimal = calculation.slice(-1);
      // FIXED: Added backticks for template string
      return `${whole}.${decimal}${s}`;
    }
  }
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

module.exports.config = {
  name: "balance",
  aliases: ["bal"],
  version: "32.1",
  author: "Minh Anh",
  countDown: 5,
  role: 0,
  shortDescription: "Evolutionary Wealth Card",
  category: "economy"
};

module.exports.onStart = async function ({ api, event, usersData }) {
  const { threadID, senderID, messageID } = event;

  try {
    const userData = await usersData.get(senderID) || { data: {} };
    if (!userData.data) userData.data = {};
    
    const balance = userData.data.money || "0";
    const userName = await usersData.getName(senderID) || "Facebook User";
    
    const tier = getTierData(balance);
    const formatted = formatBalance(balance);

    let bodyText = "✦ ───────────── ✦\n   🏦 BANK STATEMENT\n✦ ───────────── ✦\nAccount Holder: " + userName;
    
    const lastAch = Number(userData.data.lastAchievement || 0);
    const currentTierID = Number(tier.id);
    const sessionKey = senderID + "_" + currentTierID;

    if (currentTierID > 1 && currentTierID > lastAch && !global.milestoneRegistry[sessionKey]) {
        bodyText = "✦ EVOLUTION ACHIEVED ✦\n━━━━━━━━━━━━━━━━━━\nCongratulations " + userName.toUpperCase() + "\n\nRANK ✧ " + tier.rank + "\nTIER ✧ " + tier.name + "\n\nWelcome to the elite tier.\n━━━━━━━━━━━━━━━━━━";
        userData.data.lastAchievement = currentTierID;
        global.milestoneRegistry[sessionKey] = true; 
        await usersData.set(senderID, { data: userData.data });
    }

    const width = 850, height = 520;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Background Gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    tier.color.forEach((c, i) => grad.addColorStop(i / (tier.color.length - 1), c));
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.roundRect(0, 0, width, height, 45); ctx.fill();

    // Design Accents
    if (tier.special === "hologram") {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1;
        for (let i = -width; i < width; i += 30) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + height, height); ctx.stroke();
        }
    }

    ctx.font = "bold 40px Arial"; ctx.fillStyle = tier.accent;
    ctx.fillText(tier.name, 60, 85);

    // Chip Design
    const chipGrad = ctx.createLinearGradient(60, 140, 150, 205);
    chipGrad.addColorStop(0, tier.chip[0]); chipGrad.addColorStop(1, tier.chip[1]);
    ctx.fillStyle = chipGrad; ctx.beginPath(); ctx.roundRect(60, 140, 95, 70, 15); ctx.fill();

    // Card Details
    const s = senderID.toString();
    const cardNum = s.slice(0,4) + " " + s.slice(4,8) + " " + s.slice(8,12).padEnd(4,"*") + " " + s.slice(-4);
    ctx.font = "30px monospace"; ctx.fillStyle = tier.text; ctx.fillText(cardNum, 60, 270);
    ctx.font = "bold 32px Arial"; ctx.fillText(userName.toUpperCase(), 60, 420);

    // Balance Glass Box
    const boxX = 410, boxY = 280, boxW = 400, boxH = 170;
    ctx.fillStyle = tier.glass;
    ctx.beginPath(); ctx.roundRect(boxX, boxY, boxW, boxH, 30); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 1; ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = "18px Arial"; ctx.fillStyle = tier.accent;
    ctx.fillText(tier.rank, boxX + boxW / 2, boxY + 50);
    
    const fontSize = formatted.length > 14 ? 35 : 55;
    ctx.font = "bold " + fontSize + "px Arial"; 
    ctx.fillStyle = tier.text;
    ctx.fillText("$" + formatted, boxX + boxW / 2, boxY + 120);

    // Avatar Logic
    try {
      // FIXED: Added backticks for template string
      const u = `https://graph.facebook.com/${senderID}/picture?height=500&width=500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const response = await axios.get(u, { responseType: "arraybuffer" });
      const avatar = await loadImage(response.data);
      ctx.save(); 
      ctx.beginPath(); ctx.arc(width - 110, 105, 70, 0, Math.PI * 2);
      ctx.strokeStyle = tier.accent; ctx.lineWidth = 4; ctx.stroke();
      ctx.clip(); ctx.drawImage(avatar, width - 180, 35, 140, 140); ctx.restore();
    } catch (e) {}

    const cachePath = path.join(__dirname, "cache");
    if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath);
    const filePath = path.join(cachePath, "bal_" + senderID + ".png");
    fs.writeFileSync(filePath, canvas.toBuffer("image/png"));
    
    return api.sendMessage({ body: bodyText, attachment: fs.createReadStream(filePath) }, threadID, () => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }, messageID);

  } catch (err) { return api.sendMessage("System Fault: " + err.message, threadID, messageID); }
};
