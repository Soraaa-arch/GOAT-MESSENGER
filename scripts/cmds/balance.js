const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");

// Function to generate a unique, realistic 16-digit number based on senderID
function generateUniqueCardNumber(uid) {
  const s = uid.toString();
  // We use parts of the UID and pad it to ensure it's always 16 digits
  const part1 = s.slice(0, 4).padEnd(4, '0');
  const part2 = s.slice(4, 8).padEnd(4, '1');
  const part3 = s.length > 12 ? s.slice(8, 12) : "9901";
  const part4 = s.slice(-4);
  return `${part1} ${part2} ${part3} ${part4}`;
}

function formatBalance(num) {
  try {
    const n = BigInt(Math.floor(num));
    const suffixes = [
      { value: 10n**100n, symbol: "Googol" },
      { value: 10n**33n,  symbol: "D" }, 
      { value: 10n**30n,  symbol: "N" }, 
      { value: 10n**27n,  symbol: "O" }, 
      { value: 10n**24n,  symbol: "Spt" }, 
      { value: 10n**21n,  symbol: "Sx" }, 
      { value: 10n**18n,  symbol: "Qi" }, 
      { value: 10n**15n,  symbol: "Q" }, 
      { value: 10n**12n,  symbol: "T" }, 
      { value: 10n**9n,   symbol: "B" }, 
      { value: 10n**6n,   symbol: "M" }, 
      { value: 10n**3n,   symbol: "K" }
    ];

    for (const { value, symbol } of suffixes) {
      if (n >= value) {
        let res = (n / (value / 10n)).toString();
        return res.replace(/(\d)$/, ".$1") + symbol;
      }
    }
    return n.toString();
  } catch (e) {
    return "Massive"; 
  }
}

module.exports.config = {
  name: "balance",
  aliases: ["bal"],
  version: "11.0",
  author: "MOHAMMAD AKASH",
  countDown: 5,
  role: 0,
  shortDescription: "Exclusive Digital Premium Card",
  category: "economy"
};

module.exports.onStart = async function ({ api, event, usersData }) {
  const { threadID, senderID, messageID } = event;

  try {
    const userData = await usersData.get(senderID);
    const balance = userData?.data?.money ?? 0;
    const userName = await usersData.getName(senderID);
    const formatted = formatBalance(balance);
    const uniqueCardNum = generateUniqueCardNumber(senderID);

    const width = 850;
    const height = 520;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // ===== Premium Background (Obsidian) =====
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "#0a0a0a");
    grad.addColorStop(0.5, "#1a1a1a");
    grad.addColorStop(1, "#000000");
    ctx.fillStyle = grad;
    
    // Draw Round Rect
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 40);
    ctx.fill();

    // Subtle Premium Texture
    ctx.strokeStyle = "rgba(212, 175, 55, 0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 200, height);
      ctx.stroke();
    }

    // ===== Bank Name =====
    ctx.font = "bold 40px Arial";
    ctx.fillStyle = "#D4AF37";
    ctx.fillText("ZENITH DIGITAL BANK", 60, 85);

    // ===== Gold Chip =====
    const chipGrad = ctx.createLinearGradient(60, 140, 150, 205);
    chipGrad.addColorStop(0, "#BF953F");
    chipGrad.addColorStop(0.5, "#FCF6BA");
    chipGrad.addColorStop(1, "#AA771C");
    ctx.fillStyle = chipGrad;
    ctx.beginPath();
    ctx.roundRect(60, 140, 95, 70, 12);
    ctx.fill();

    // ===== UNIQUE CARD NUMBER =====
    ctx.font = "32px monospace";
    ctx.fillStyle = "#E5E4E2"; 
    ctx.fillText(uniqueCardNum, 60, 260);

    // ===== Holder Info =====
    ctx.font = "italic 24px Arial";
    ctx.fillStyle = "#aaaaaa";
    ctx.fillText("CARD HOLDER", 60, 360);
    ctx.font = "bold 30px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(userName.toUpperCase(), 60, 400);

    // ===== Balance Box =====
    const boxX = 430, boxY = 280, boxW = 360, boxH = 160;
    ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
    ctx.strokeStyle = "rgba(212, 175, 55, 0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 20);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = "bold 18px Arial";
    ctx.fillStyle = "#D4AF37";
    ctx.fillText("TOTAL VALUATION", boxX + boxW / 2, boxY + 45);

    let balText = "$" + formatted;
    let fontSize = balText.length > 12 ? 35 : 55;
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(balText, boxX + boxW / 2, boxY + 115);
    ctx.textAlign = "left";

    // ===== Avatar =====
    try {
      const picURL = `https://graph.facebook.com/${senderID}/picture?height=500&width=500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const response = await axios.get(picURL, { responseType: "arraybuffer" });
      const avatar = await loadImage(response.data);
      ctx.save();
      ctx.beginPath();
      ctx.arc(width - 110, 100, 65, 0, Math.PI * 2);
      ctx.strokeStyle = "#D4AF37";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.clip();
      ctx.drawImage(avatar, width - 175, 35, 130, 130);
      ctx.restore();
    } catch (e) { console.log("Avatar error"); }

    const cachePath = path.join(__dirname, "cache");
    if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath);
    const filePath = path.join(cachePath, `premium_bal_${senderID}.png`);
    
    fs.writeFileSync(filePath, canvas.toBuffer("image/png"));
    
    return api.sendMessage({ attachment: fs.createReadStream(filePath) }, threadID, () => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }, messageID);

  } catch (err) {
    return api.sendMessage("Error: " + err.message, threadID, messageID);
  }
};
