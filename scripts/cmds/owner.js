const fs = require("fs-extra");
const request = require("request");
const path = require("path");

module.exports = {
  config: {
    name: "owner",
    version: "2.0.0",
    author: "Minh Anh",
    role: 0,
    shortDescription: "Access the Sovereign Authority profile",
    category: "information",
    guide: {
      en: "owner"
    }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID } = event;

    const ownerText = 
`🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐀𝐔𝐓𝐇𝐎𝐑𝐈𝐓𝐘
━━━━━━━━━━━━━━━━━━
👤 𝐍𝐚𝐦𝐞      : Minh Anh
🧸 𝐀𝐥𝐢𝐚𝐬      : Minh
🎂 𝐀𝐠𝐞       : 18+
💼 𝐏𝐫𝐨𝐟𝐞𝐬𝐬𝐢𝐨𝐧 : ??
🎓 𝐄𝐝𝐮𝐜𝐚𝐭𝐢𝐨𝐧 : ??
📍 𝐋𝐨𝐜𝐚𝐭𝐢𝐨𝐧  : Philippines
━━━━━━━━━━━━━━━━━━
📞 𝐂𝐎𝐍𝐓𝐀𝐂𝐓 𝐏𝐑𝐎𝐓𝐎𝐂𝐎𝐋:
🔹 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤  : fb.com/61576612175253 
🔹 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩  : N/A
━━━━━━━━━━━━━━━━━━
   𝐄𝐗𝐄𝐂𝐔𝐓𝐄𝐃 𝐁𝐘 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐋𝐈𝐓𝐄`;

    const cacheDir = path.join(__dirname, "cache");
    const imgPath = path.join(cacheDir, "owner_manifest.jpg");

    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const imgLink = "https://i.imgur.com/mCOI4u1.png";

    const send = () => {
      api.sendMessage(
        {
          body: ownerText,
          attachment: fs.createReadStream(imgPath)
        },
        threadID,
        () => {
          if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        },
        messageID
      );
    };

    // Utilizing a stream-safe request protocol
    request(encodeURI(imgLink))
      .pipe(fs.createWriteStream(imgPath))
      .on("close", send)
      .on("error", (err) => {
        api.sendMessage("⚠️ Failed to load Authority Visuals.", threadID, messageID);
      });
  }
};
