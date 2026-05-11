const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");

function formatBalance(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
  return num.toLocaleString();
}

module.exports.config = {
  name: "balance",
  aliases: ["bal"],
  version: "8.0",
  author: "MOHAMMAD AKASH",
  countDown: 5,
  role: 0,
  shortDescription: "Real Bank Card",
  category: "economy"
};

module.exports.onStart = async function ({ api, event, usersData }) {
  const { threadID, senderID, messageID } = event;

  try {
    const userData = await usersData.get(senderID);
    const balance = userData?.data?.money ?? 100;
    const userName = await usersData.getName(senderID);
    const formatted = formatBalance(balance);

    let avatar = null;
    try {
      const picURL = https://graph.facebook.com/${senderID}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662;
      const res = await axios({ url: picURL, method: "GET", responseType: "arraybuffer" });
      avatar = await loadImage(res.data);
    } catch (e) {
      console.log("Avatar failed:", e.message);
    }

    const W = 900, H = 540;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");

    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0.00, "#0a1628");
    bgGrad.addColorStop(0.40, "#0d2346");
    bgGrad.addColorStop(0.75, "#102c52");
    bgGrad.addColorStop(1.00, "#071020");
    ctx.fillStyle = bgGrad;
    roundRect(ctx, 0, 0, W, H, 36, true);

    for (let i = 0; i < 4500; i++) {
      const nx = Math.random() * W;
      const ny = Math.random() * H;
      const alpha = Math.random() * 0.045;
      ctx.fillStyle = rgba(255,255,255,${alpha});
      ctx.fillRect(nx, ny, 1, 1);
    }

    const glow1 = ctx.createRadialGradient(W * 0.75, H * 0.25, 0, W * 0.75, H * 0.25, 340);
    glow1.addColorStop(0, "rgba(30,100,255,0.18)");
    glow1.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, W, H);

    const glow2 = ctx.createRadialGradient(W * 0.2, H * 0.85, 0, W * 0.2, H * 0.85, 260);
    glow2.addColorStop(0, "rgba(0,180,255,0.12)");
    glow2.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    for (let i = -H; i < W + H; i += 28) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + H, H);
      ctx.stroke();
    }
    ctx.restore();

    const shimmer = ctx.createLinearGradient(0, 0, W, 0);
    shimmer.addColorStop(0, "rgba(255,255,255,0)");
    shimmer.addColorStop(0.3, "rgba(255,255,255,0.04)");
    shimmer.addColorStop(0.5, "rgba(255,255,255,0.10)");
    shimmer.addColorStop(0.7, "rgba(255,255,255,0.04)");
    shimmer.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = shimmer;
    ctx.fillRect(0, 0, W, 3);

    ctx.font = "bold 15px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.letterSpacing = "4px";
    ctx.fillText("GOAT NATIONAL BANK", 54, 68);
    ctx.letterSpacing = "0px";

    drawContactless(ctx, W - 76, 42, 28);
    drawChip(ctx, 54, 110);
    drawHologram(ctx, 200, 142, 38);

    ctx.font = "bold 28px 'Courier New'";
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.letterSpacing = "3px";
    ctx.fillText("••••  ••••  ••••  8456", 54, 300);
    ctx.letterSpacing = "0px";

    ctx.font = "10px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText("VALID", 54, 330);
    ctx.fillText("THRU", 54, 342);
    ctx.font = "bold 16px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText("12 / 29", 88, 342);

    ctx.font = "10px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText("CVV", 210, 330);
    ctx.font = "bold 16px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText("•••", 210, 342);

    const displayName = userName.toUpperCase().substring(0, 22);
    ctx.font = "bold 22px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.90)";
    ctx.fillText(displayName, 54, 400);

    const bx = 500, by = 90, bw = 340, bh = 330;
    ctx.save();
    ctx.globalAlpha = 1;
    const glassFill = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
    glassFill.addColorStop(0, "rgba(255,255,255,0.10)");
    glassFill.addColorStop(1, "rgba(255,255,255,0.04)");
    ctx.fillStyle = glassFill;
    roundRect(ctx, bx, by, bw, bh, 24, true);
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    roundRect(ctx, bx, by, bw, bh, 24, false, true);
    ctx.restore();

    const innerHighlight = ctx.createLinearGradient(bx, by, bx, by + 60);
    innerHighlight.addColorStop(0, "rgba(255,255,255,0.12)");
    innerHighlight.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = innerHighlight;
    roundRect(ctx, bx + 1, by + 1, bw - 2, 60, 24, true);

    ctx.font = "11px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.letterSpacing = "3px";
    ctx.textAlign = "center";
    ctx.fillText("AVAILABLE BALANCE", bx + bw / 2, by + 52);
    ctx.letterSpacing = "0px";

    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx + 30, by + 68);
    ctx.lineTo(bx + bw - 30, by + 68);
    ctx.stroke();

    ctx.font = "bold 22px Arial";
    ctx.fillStyle = "rgba(100,200,255,0.70)";
    ctx.fillText("USD", bx + bw / 2, by + 108);

    const balFontSize = formatted.length > 8 ? 42 : 56;
    ctx.font = bold ${balFontSize}px Arial;
    ctx.fillStyle = "#ffffff";
    ctx.fillText("$" + formatted, bx + bw / 2, by + 175);

    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.scale(1, -0.3);
    ctx.font = bold ${balFontSize}px Arial;
    ctx.fillStyle = "#ffffff";
    ctx.fillText("$" + formatted, bx + bw / 2, -(by + 175) - 18);
    ctx.restore();

    ctx.save();
    const pillX = bx + bw / 2 - 45;
    const pillY = by + 200;
    ctx.fillStyle = "rgba(0,220,120,0.18)";
    roundRect(ctx, pillX, pillY, 90, 28, 14, true);
    ctx.strokeStyle = "rgba(0,220,120,0.5)";
    ctx.lineWidth = 1;
    roundRect(ctx, pillX, pillY, 90, 28, 14, false, true);
    ctx.restore();
    ctx.font = "bold 12px Arial";
    ctx.fillStyle = "#00dc78";
    ctx.fillText("● ACTIVE", bx + bw / 2, pillY + 19);

    ctx.font = "12px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillText("ACC: •••• •••• 7823", bx + bw / 2, by + 280);

    ctx.textAlign = "left";

    if (avatar) {
      const size = 90;
      const ax = bx + bw / 2 - size / 2;
      const ay = by + bh + 14;

      const avatarGlow = ctx.createRadialGradient(ax + size / 2, ay + size / 2, size / 2 - 4, ax + size / 2, ay + size / 2, size / 2 + 14);
      avatarGlow.addColorStop(0, "rgba(30,140,255,0.55)");
      avatarGlow.addColorStop(1, "rgba(30,140,255,0)");
      ctx.fillStyle = avatarGlow;
      ctx.beginPath();
      ctx.arc(ax + size / 2, ay + size / 2, size / 2 + 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(ax + size / 2, ay + size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatar, ax, ay, size, size);
      ctx.restore();

      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(ax + size / 2, ay + size / 2, size / 2 + 1, 0, Math.PI * 2);
      ctx.stroke();
    }

    drawVisa(ctx, W - 130, H - 58);

    const bottomGrad = ctx.createLinearGradient(0, H - 6, W, H - 6);
    bottomGrad.addColorStop(0, "rgba(30,100,255,0)");
    bottomGrad.addColorStop(0.5, "rgba(30,100,255,0.6)");
    bottomGrad.addColorStop(1, "rgba(30,100,255,0)");
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(30, H - 6, W - 60, 4);

    const buffer = canvas.toBuffer("image/png");
    const cachePath = path.join(__dirname, "cache");
    if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath);
    const filePath = path.join(cachePath, balance_${senderID}.png);
    fs.writeFileSync(filePath, buffer);

    await api.sendMessage({ attachment: fs.createReadStream(filePath) }, threadID, messageID);
    setTimeout(() => { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); }, 10000);

  } catch (err) {
    console.error(err);
    api.sendMessage("❌ Card generation failed!", threadID, messageID);
  }
};

function roundRect(ctx, x, y, w, h, r, fill = false, stroke = false) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function drawChip(ctx, x, y) {
  const w = 68, h = 52, r = 7;

  const chipGrad = ctx.createLinearGradient(x, y, x + w, y + h);
  chipGrad.addColorStop(0.00, "#d4a820");
  chipGrad.addColorStop(0.25, "#f0d060");
  chipGrad.addColorStop(0.50, "#c89010");
  chipGrad.addColorStop(0.75, "#e8c840");
  chipGrad.addColorStop(1.00, "#b07800");
  ctx.fillStyle = chipGrad;
  roundRect(ctx, x, y, w, h, r, true);

  ctx.strokeStyle = "rgba(80,50,0,0.45)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x + 8, y + 17); ctx.lineTo(x + w - 8, y + 17); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 8, y + 35); ctx.lineTo(x + w - 8, y + 35); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 22, y + 6); ctx.lineTo(x + 22, y + h - 6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + w - 22, y + 6); ctx.lineTo(x + w - 22, y + h - 6); ctx.stroke();

  ctx.fillStyle = "rgba(160,100,0,0.35)";
  roundRect(ctx, x + 24, y + 18, 20, 16, 3, true);

  const shine = ctx.createLinearGradient(x, y, x, y + h * 0.6);
  shine.addColorStop(0, "rgba(255,255,255,0.30)");
  shine.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = shine;
  roundRect(ctx, x, y, w, h * 0.5, r, true);
}

function drawContactless(ctx, cx, cy, maxR) {
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 2.2;
  [0.55, 0.65, 0.80].forEach(scale => {
    ctx.beginPath();
    ctx.arc(cx, cy, maxR * scale, Math.PI * 1.25, Math.PI * 1.75);
    ctx.stroke();
  });
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.beginPath();
  ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawHologram(ctx, cx, cy, r) {
  const hColors = [
    "rgba(255,50,50,0.5)",
    "rgba(255,200,0,0.5)",
    "rgba(0,255,150,0.5)",
    "rgba(0,150,255,0.5)",
    "rgba(200,0,255,0.5)",
  ];

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    const grad = ctx.createLinearGradient(cx, cy, x2, y2);
    grad.addColorStop(0, hColors[i % hColors.length]);
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawVisa(ctx, x, y) {
  ctx.save();
  ctx.font = "bold italic 42px serif";
  const grad = ctx.createLinearGradient(x, y - 36, x + 100, y);
  grad.addColorStop(0, "#1a1f71");
  grad.addColorStop(0.5, "#ffffff");
  grad.addColorStop(1, "#f7b731");
  ctx.fillStyle = grad;
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 0.5;
  ctx.strokeText("VISA", x, y);
  ctx.fillText("VISA", x, y);
  ctx.restore();
}
