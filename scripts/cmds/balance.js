const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");

function getTierData(balance) {
  const n = BigInt(Math.floor(balance));
  if (n >= 10n**100n) return { id: 5, name: "GOOGOL OVERLORD BANK", rank: "COSMIC ENTITY", color: ["#1a0033", "#4b0082"], accent: "#cc00ff", chip: ["#ff00ff", "#ffffff"], text: "#ffffff" };
  if (n >= 10n**15n) return { id: 4, name: "AETHER PLATINUM BANK", rank: "AETHER ARCHON", color: ["#e0e0e0", "#ffffff"], accent: "#00d4ff", chip: ["#00d4ff", "#ffffff"], text: "#222222" };
  if (n >= 10n**12n) return { id: 3, name: "ZENITH PREMIUM BANK", rank: "TRILLIONAIRE ELITE", color: ["#0a0a0a", "#1a1a1a"], accent: "#D4AF37", chip: ["#BF953F", "#FCF6BA"], text: "#ffffff" };
  if (n >= 10n**9n)  return { id: 2, name: "TITAN IRON BANK", rank: "BILLIONAIRE TYCOON", color: ["#3d3d3d", "#757575"], accent: "#e5e4e2", chip: ["#8e8e8e", "#e0e0e0"], text: "#ffffff" };
  return { id: 1, name: "GOAT DIGITAL BANK", rank: "STANDARD MEMBER", color: ["#0f4c81", "#1c77c3"], accent: "#ffffff", chip: ["#e0e0e0", "#8e8e8e"], text: "#ffffff" };
}

function formatBalance(num) {
  try {
    const n = BigInt(Math.floor(num));
    const suffixes = [{v: 10n**100n, s: "Googol"}, {v: 10n**15n, s: "Q"}, {v: 10n**12n, s: "T"}, {v: 10n**9n, s: "B"}, {v: 10n**6n, s: "M"}, {v: 10n**3n, s: "K"}];
    for (const {v, s} of suffixes) { if (n >= v) return (n / (v / 10n)).toString().replace(/(\d)$/, ".$1") + s; }
    return n.toString();
  } catch (e) { return "Massive"; }
}

module.exports.config = {
  name: "balance",
  aliases: ["bal"],
  version: "20.0",
  author: "MOHAMMAD AKASH",
  countDown: 5,
  role: 0,
  shortDescription: "Evolution Card with Database Memory",
  category: "economy"
};

module.exports.onStart = async function ({ api, event, usersData }) {
  const { threadID, senderID, messageID } = event;

  try {
    const userData = await usersData.get(senderID) || { data: {} };
    const balance = userData.data.money ?? 0;
    const userName = await usersData.getName(senderID);
    const tier = getTierData(balance);
    const formatted = formatBalance(balance);

    // ONE-TIME CONGRATS LOGIC
    let bodyText = `Bank Statement for ${userName}:`;
    const lastAch = parseInt(userData.data.lastAchievement || 0);

    if (tier.id > 1 && tier.id > lastAch) {
        bodyText = `🎊 NEW TIER UNLOCKED! 🎊\n━━━━━━━━━━━━━━━━━━\nCongratulations ${userName.toUpperCase()}!\nYou have achieved the rank of ${tier.rank}.\nYour ${tier.name} card is now active.`;
        userData.data.lastAchievement = tier.id;
        await usersData.set(senderID, userData.data);
    }

    const width = 850, height = 520;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, tier.color[0]); grad.addColorStop(1, tier.color[1]);
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.roundRect(0, 0, width, height, 40); ctx.fill();

    ctx.font = "bold 38px Arial"; ctx.fillStyle = tier.accent;
    ctx.fillText(tier.name, 60, 85);

    const chipGrad = ctx.createLinearGradient(60, 140, 150, 205);
    chipGrad.addColorStop(0, tier.chip[0]); chipGrad.addColorStop(1, tier.chip[1]);
    ctx.fillStyle = chipGrad; ctx.beginPath(); ctx.roundRect(60, 140, 95, 70, 12); ctx.fill();

    const s = senderID.toString();
    const cardNum = `${s.slice(0,4)} ${s.slice(4,8)} ${s.slice(8,12).padEnd(4,'9')} ${s.slice(-4)}`;
    ctx.font = "32px monospace"; ctx.fillStyle = tier.text; ctx.fillText(cardNum, 60, 260);
    ctx.font = "bold 30px Arial"; ctx.fillText(userName.toUpperCase(), 60, 410);

    const boxX = 430, boxY = 280, boxW = 360, boxH = 160;
    ctx.fillStyle = "rgba(150, 150, 150, 0.15)";
    ctx.beginPath(); ctx.roundRect(boxX, boxY, boxW, boxH, 25); ctx.fill();
    ctx.strokeStyle = tier.accent; ctx.lineWidth = 2; ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = "bold 18px Arial"; ctx.fillStyle = tier.accent;
    ctx.fillText(tier.rank, boxX + boxW / 2, boxY + 45);
    ctx.font = `bold ${formatted.length > 12 ? 35 : 55}px Arial`; ctx.fillStyle = tier.text;
    ctx.fillText("$" + formatted, boxX + boxW / 2, boxY + 115);
    ctx.textAlign = "left";

    try {
      const picURL = `https://graph.facebook.com/${senderID}/picture?height=500&width=500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const response = await axios.get(picURL, { responseType: "arraybuffer" });
      const avatar = await loadImage(response.data);
      ctx.save(); ctx.beginPath(); ctx.arc(width - 110, 100, 70, 0, Math.PI * 2);
      ctx.strokeStyle = tier.accent; ctx.lineWidth = 5; ctx.stroke();
      ctx.clip(); ctx.drawImage(avatar, width - 180, 30, 140, 140); ctx.restore();
    } catch (e) {}

    const cachePath = path.join(__dirname, "cache");
    if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath);
    const filePath = path.join(cachePath, `bal_${senderID}.png`);
    fs.writeFileSync(filePath, canvas.toBuffer("image/png"));
    
    return api.sendMessage({ body: bodyText, attachment: fs.createReadStream(filePath) }, threadID, () => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }, messageID);

  } catch (err) { return api.sendMessage("Error: " + err.message, threadID, messageID); }
};
