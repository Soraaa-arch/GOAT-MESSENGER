const fs = require("fs-extra");
const path = require("path");
const { createCanvas } = require("canvas");

module.exports.config = {
  name: "leaderboard",
  aliases: ["lb", "top"],
  version: "22.1",
  author: "Minh Anh",
  countDown: 10,
  role: 0,
  shortDescription: "Sovereign Registry with Platinum Accents",
  category: "economy"
};

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
  } catch (e) { return "Error"; }
}

module.exports.onStart = async function ({ api, event, usersData }) {
  const { threadID, messageID } = event;
  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);

  try {
    const all = await usersData.getAll();
    
    // Improved sorting logic to prevent Infinity/NaN issues
    const sorted = Object.entries(all)
      .map(([uid, d]) => {
        let moneyStr = (d.data && d.data.money) ? d.data.money.toString().split('.')[0].replace(/[^0-9]/g, '') : "0";
        return {
          uid,
          name: d.name || "Unknown Entity",
          money: BigInt(moneyStr || 0)
        };
      })
      .sort((a, b) => (b.money > a.money ? 1 : b.money < a.money ? -1 : 0))
      .slice(0, 10);

    const width = 1100, rowH = 120, headerH = 340;
    const height = headerH + (rowH * sorted.length) + 100;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // 1. BASE BACKGROUND
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, width, height);

    // 2. GRADIENTS
    const goldGrad = ctx.createLinearGradient(0, 0, width, 0);
    goldGrad.addColorStop(0, "#BF953F");
    goldGrad.addColorStop(0.25, "#FCF6BA");
    goldGrad.addColorStop(0.5, "#B38728");
    goldGrad.addColorStop(0.75, "#FBF5B7");
    goldGrad.addColorStop(1, "#AA771C");

    const eliteGrad = ctx.createLinearGradient(0, 150, 0, 260);
    eliteGrad.addColorStop(0, "#E5E4E2"); 
    eliteGrad.addColorStop(0.4, "#FFFFFF"); 
    eliteGrad.addColorStop(0.5, "#B4B4B4"); 
    eliteGrad.addColorStop(1, "#8E8E8E"); 

    // 3. AMBIENT GOLD BACKGROUND SHEEN
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = goldGrad;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1.0;

    // 4. GOLDEN FRAME
    ctx.strokeStyle = goldGrad;
    ctx.lineWidth = 12;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // 5. HEADER
    ctx.textAlign = "center";
    ctx.fillStyle = goldGrad;
    ctx.font = "bold 20px serif";
    // letterSpacing removed for compatibility; using standard tracking
    ctx.fillText("ESTABLISHED MMXXIV", width/2, 85);

    ctx.font = "italic 42px Georgia";
    ctx.fillText("The Sovereign Asset Registry", width/2, 140);

    ctx.font = "900 120px Helvetica";
    ctx.fillStyle = eliteGrad;
    ctx.shadowBlur = 20;
    ctx.shadowColor = "rgba(255, 255, 255, 0.3)";
    ctx.fillText("ELITE", width/2, 245);
    ctx.shadowBlur = 0;
    
    ctx.font = "300 45px Helvetica";
    ctx.fillStyle = goldGrad;
    ctx.fillText("LEADERBOARD", width/2, 305);

    // 6. DATA ROWS
    for (let i = 0; i < sorted.length; i++) {
      const u = sorted[i];
      const y = headerH + i * rowH;
      const isTop3 = i < 3;

      ctx.fillStyle = isTop3 ? "rgba(191, 149, 63, 0.15)" : "rgba(255, 255, 255, 0.05)";
      ctx.beginPath();
      ctx.roundRect(85, y + 10, width - 170, rowH - 20, 2);
      ctx.fill();
      
      ctx.textAlign = "center";
      ctx.font = "bold 35px serif";
      ctx.fillStyle = isTop3 ? goldGrad : "rgba(255,255,255,0.4)";
      ctx.fillText((i + 1).toString(), 145, y + rowH/2 + 12);

      const ax = 215, ay = y + rowH/2 - 45, sz = 90;
      ctx.fillStyle = isTop3 ? goldGrad : "#1a1a1a";
      ctx.beginPath(); ctx.arc(ax + sz/2, ay + sz/2, sz/2, 0, Math.PI * 2); ctx.fill();
      
      ctx.fillStyle = isTop3 ? "#000" : goldGrad;
      ctx.font = "900 48px Georgia";
      const initial = u.name.trim().charAt(0).toUpperCase();
      ctx.fillText(initial, ax + sz/2, ay + sz/2 + 16);

      ctx.textAlign = "left";
      ctx.font = "bold 32px Arial";
      ctx.fillStyle = "#ffffff";
      let dName = u.name.toUpperCase();
      if (dName.length > 22) dName = dName.substring(0, 20) + "..";
      ctx.fillText(dName, 350, y + rowH / 2 + 12);

      ctx.textAlign = "right";
      ctx.font = "900 42px Helvetica";
      ctx.fillStyle = isTop3 ? goldGrad : "#ffffff";
      ctx.fillText("$" + formatBalance(u.money), width - 130, y + rowH / 2 + 12);
    }

    // 7. FOOTER
    ctx.textAlign = "center";
    ctx.font = "14px Courier New";
    ctx.fillStyle = "rgba(212, 175, 55, 0.6)";
    ctx.fillText("• MINH ANH PRIVATE ASSET MANAGEMENT •", width/2, height - 60);

    const finalPath = path.join(cacheDir, `lb_platinum_elite_${Date.now()}.png`);
    await fs.writeFile(finalPath, canvas.toBuffer("image/png"));

    return api.sendMessage({ attachment: fs.createReadStream(finalPath) }, threadID, () => {
      if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
    }, messageID);

  } catch (err) {
    console.error(err);
    return api.sendMessage("Sovereign Registry Error | " + err.message, threadID, messageID);
  }
};
