const { drive } = global.utils;
const { nickNameBot } = global.GoatBot.config;
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "welcome",
    version: "9.0-SOVEREIGN",
    author: "Minh Anh",
    category: "events"
  },

  langs: {
    en: {
      defaultWelcomeMessage: "🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 𝐏𝐑𝐎𝐓𝐎𝐂𝐎𝐋\n━━━━━━━━━━━━━━━━━━\n👤 𝐍𝐞𝐰 𝐎𝐩𝐞𝐫𝐚𝐭𝐨𝐫: {userName}\n📥 𝐀𝐝𝐝𝐞𝐝 𝐁𝐲: {inviterName}\n📊 𝐆𝐫𝐨𝐮𝐩 𝐒𝐭𝐚𝐭𝐮𝐬: {memberCount} Operators\n━━━━━━━━━━━━━━━━━━\n✨ Enjoy your stay in {threadName}.",
      botAddedMessage:
        "🏛️ 𝐒𝐘𝐒𝐓𝐄𝐌 𝐈𝐍𝐈𝐓𝐈𝐀𝐋𝐈𝐙𝐄𝐃\n━━━━━━━━━━━━━━━━━━\n🤖 𝐒𝐨𝐯𝐞𝐫𝐞𝐢𝐠𝐧 𝐌𝐚𝐢𝐧𝐟𝐫𝐚𝐦𝐞 𝐎𝐧𝐥𝐢𝐧𝐞\n\n⚙️ 𝐏𝐫𝐞𝐟𝐢𝐱: /\n📜 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬: /help\n\n━━━━━━━━━━━━━━━━━━\n   𝐄𝐗𝐄𝐂𝐔𝐓𝐄𝐃 𝐁𝐘 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐋𝐈𝐓𝐄"
    }
  },

  onStart: async ({ threadsData, message, event, api, usersData, getLang }) => {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID } = event;
    const threadData = await threadsData.get(threadID);
    if (!threadData.settings.sendWelcomeMessage) return;

    const addedMembers = event.logMessageData.addedParticipants;
    const threadName   = threadData.threadName || "Sovereign Sector";
    const prefix       = global.utils.getPrefix(threadID);
    const inviterID    = event.author;

    for (const user of addedMembers) {
      const userID = user.userFbId;
      const botID  = api.getCurrentUserID();

      if (userID == botID) {
        if (nickNameBot) await api.changeNickname(nickNameBot, threadID, botID);
        return message.send(getLang("botAddedMessage", prefix));
      }

      const userName    = user.fullName;
      const inviterName = await usersData.getName(inviterID) || "System Protocol";
      const memberCount = event.participantIDs.length;

      let { welcomeMessage = getLang("defaultWelcomeMessage") } = threadData.data;
      welcomeMessage = welcomeMessage
        .replace(/\{userName\}/g,    userName.toUpperCase())
        .replace(/\{userTag\}/g,     userName)
        .replace(/\{threadName\}/g,  threadName.toUpperCase())
        .replace(/\{memberCount\}/g, memberCount)
        .replace(/\{inviterName\}/g, inviterName.toUpperCase());

      let welcomeImagePath = null;
      try {
        welcomeImagePath = await createSovereignCard({
          userName, threadName, memberCount,
          inviterName, newUserID: userID,
          inviterID, threadID, api
        });
      } catch (err) {
        console.error("Sovereign Card generation failed:", err);
      }

      const form = {
        body:      welcomeMessage,
        mentions: [{ tag: userName, id: userID }]
      };

      if (welcomeImagePath && fs.existsSync(welcomeImagePath)) {
        form.attachment = fs.createReadStream(welcomeImagePath);
      }

      message.send(form);

      if (welcomeImagePath && fs.existsSync(welcomeImagePath)) {
        setTimeout(() => { try { fs.unlinkSync(welcomeImagePath); } catch (_) {} }, 10000);
      }
    }
  }
};

/**
 * Sovereign Visual Engine
 */
async function createSovereignCard({ userName, threadName, memberCount, inviterName, newUserID, api }) {
  const W = 1200, H = 630;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Background - Deep Obsidian
  ctx.fillStyle = '#050508';
  ctx.fillRect(0, 0, W, H);

  // Sovereign Gold Border
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 15;
  ctx.strokeRect(20, 20, W-40, H-40);

  // Interior Frame
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, W-80, H-80);

  // Text Rendering
  ctx.textAlign = 'center';
  
  // Header
  ctx.font = 'bold 30px "Serif"';
  ctx.fillStyle = '#d4af37';
  ctx.fillText('🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐑𝐄𝐆𝐈𝐒𝐓𝐑𝐘 🏛️', W/2, 100);

  // User Name
  ctx.font = 'bold 70px "Serif"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(userName.toUpperCase(), W/2, 280);

  // Subtitle
  ctx.font = '35px "Serif"';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillText(`AUTHORIZED ACCESS TO ${threadName.toUpperCase()}`, W/2, 340);

  // Footer Divider
  ctx.fillStyle = '#d4af37';
  ctx.fillRect(W/2 - 250, 420, 500, 3);

  // Stats
  ctx.font = '25px "Serif"';
  ctx.fillStyle = '#d4af37';
  ctx.fillText(`OPERATOR #${memberCount} | VERIFIED BY ${inviterName.toUpperCase()}`, W/2, 480);

  // Execution Mark
  ctx.font = 'italic 18px "Serif"';
  ctx.fillStyle = 'rgba(212, 175, 55, 0.5)';
  ctx.fillText('𝐏𝐎𝐖𝐄𝐑𝐄𝐃 𝐁𝐘 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐋𝐈𝐓𝐄', W/2, 570);

  const tempPath = path.join(__dirname, `sov_welcome_${Date.now()}.png`);
  await fs.writeFile(tempPath, canvas.toBuffer('image/png'));
  return tempPath;
}
