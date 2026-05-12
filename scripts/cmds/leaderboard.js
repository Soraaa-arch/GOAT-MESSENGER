const fs = require("fs-extra");
const path = require("path");
const { createCanvas } = require("canvas");

module.exports.config = {
  name: "leaderboard",
  aliases: ["lb", "top"],
  version: "20.0",
  author: "MOHAMMAD AKASH / Modified by Minh Anh",
  countDown: 10,
  role: 0,
  shortDescription: "Ultra-Premium Sovereign Asset Registry",
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
    return n.toString();
  } catch (e) { return "Error"; }
}

module.exports.onStart = async function ({ api, event, usersData }) {
  const { threadID, messageID } = event;
  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);

  try {
    const all = await usersData.getAll();
    const sorted = Object.entries(all)
      .map(([uid, d]) => ({ 
        uid, 
        name: d.name || "Unknown Entity", 
        money: BigInt(d?.data?.money || 0) 
      }))
      .sort((a, b) => (b.money > a.money ? 1 : -1))
      .slice(0, 10);

    const width = 1100, rowH = 125, headerH = 320;
    const height = headerH + (rowH * sorted.length) + 120;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // 1. BACKGROUND DESIGN
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);
    
    // Vignette Effect
    const radial = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width*0.8);
    radial.addColorStop(0, "#0c0c12");
    radial.addColorStop(1, "#000000");
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);

    // 2. GRADIENTS
    const goldGrad = ctx.createLinearGradient(0, 0, width, 0);
    goldGrad.addColorStop(0, "#BF953F");
    goldGrad.addColorStop(0.25, "#FCF6BA");
    goldGrad.addColorStop(0.5, "#B38728");
    goldGrad.addColorStop(0.75, "#FBF5B7");
    goldGrad.addColorStop(1, "#AA771C");

    // 3. HEADER
    ctx.textAlign = "center";
    ctx.fillStyle = goldGrad;
    ctx.font = "bold 24px serif";
    ctx.letterSpacing = "12px";
    ctx.fillText("ESTABLISHED MMXXIV", width/2, 65);

    ctx.font = "italic 38px Georgia";
    ctx.letterSpacing = "2px";
    ctx.fillText("The Sovereign Asset Registry", width/2, 115);

    ctx.font = "900 115px Helvetica";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("ELITE", width/2, 215);
    
    ctx.font = "300 42px Helvetica";
    ctx.fillStyle = goldGrad;
    ctx.letterSpacing = "18px";
    ctx.fillText("LEADERBOARD", width/2, 275);

    // 4. ROWS
    for (let i = 0; i < sorted.length; i++) {
      const u = sorted[i];
      const y = headerH + i * rowH;
      const isTop3 = i < 3;

      // Row Highlight
      ctx.fillStyle = isTop3 ? "rgba(191, 149, 63, 0.12)" : "rgba(255, 255, 255, 0.04)";
      ctx.beginPath();
      ctx.roundRect(80, y + 15, width - 160, rowH - 30, 2);
      ctx.fill();
      if(isTop3) { ctx.strokeStyle = goldGrad; ctx.lineWidth = 1.5; ctx.stroke(); }

      // Rank Medal
      ctx.textAlign = "center";
      ctx.font = "bold 32px serif";
      ctx.fillStyle = isTop3 ? goldGrad : "rgba(255,255,255,0.4)";
      ctx.fillText((i + 1).toString().padStart(2, '0'), 140, y + rowH/2 + 10);

      // Monogram Medallion
      const ax = 210, ay = y + rowH/2 - 45, sz = 90;
      
      if(isTop3) {
        ctx.shadowBlur = 25;
        ctx.shadowColor = "rgba(191, 149, 63, 0.4)";
      }

      ctx.fillStyle = isTop3 ? goldGrad : "#151515";
      ctx.beginPath(); ctx.arc(ax + sz/2, ay + sz/2, sz/2, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = isTop3 ? "#000" : goldGrad;
      ctx.font = "900 48px Georgia";
      const initial = u.name.trim().charAt(0).toUpperCase();
      ctx.fillText(initial, ax + sz/2, ay + sz/2 + 16);

      // Identity
      ctx.textAlign = "left";
      ctx.font = "bold 30px Arial";
      ctx.fillStyle = "#ffffff";
      let dName = u.name.toUpperCase();
      if (dName.length > 22) dName = dName.substring(0, 20) + "..";
      ctx.fillText(dName, 340, y + rowH / 2 + 10);

      // Wealth
      ctx.textAlign = "right";
      ctx.font = "900 38px Helvetica";
      ctx.fillStyle = isTop3 ? goldGrad : "#ffffff";
      ctx.fillText("$" + formatBalance(u.money), width - 120, y + rowH / 2 + 10);
    }

    // 5. FOOTER
    ctx.textAlign = "center";
    ctx.font = "14px Courier New";
    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    ctx.letterSpacing = "10px";
    ctx.fillText("• MINH ANH PRIVATE ASSET MANAGEMENT •", width/2, height - 50);

    const finalPath = path.join(cacheDir, `lb_sovereign_${Date.now()}.png`);
    await fs.writeFile(finalPath, canvas.toBuffer("image/png"));

    return api.sendMessage({ attachment: fs.createReadStream(finalPath) }, threadID, () => {
      if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
    }, messageID);

  } catch (err) {
    return api.sendMessage("System Fault | " + err.message, threadID, messageID);
  }
};
