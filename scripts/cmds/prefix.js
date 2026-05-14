const fs = require("fs-extra");
const { utils } = global;

module.exports = {
  config: {
    name: "prefix",
    version: "1.5.2",
    author: "Minh Anh",
    countDown: 5,
    role: 0,
    description: "Modify the command access protocol for this sector or the entire network.",
    category: "config",
    guide: {
      en: "🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐏𝐑𝐄𝐅𝐈𝐗 𝐆𝐔𝐈𝐃𝐄\n━━━━━━━━━━━━━━━━━━\n{pn} <prefix>: Set local sector prefix\n{pn} <prefix> -g: Set global network prefix (Admin Only)\n{pn} reset: Revert to default protocol"
    }
  },

  langs: {
    en: {
      reset: "🏛️ 𝐏𝐑𝐎𝐓𝐎𝐂𝐎𝐋 𝐑𝐄𝐒𝐄𝐓\n━━━━━━━━━━━━━━━━━━\nDefault prefix restored: %1",
      onlyAdmin: "❌ 𝐀𝐂𝐂𝐄𝐒𝐒 𝐃𝐄𝐍𝐈𝐄𝐃\nOnly High-Level Administrators may modify the global network prefix.",
      confirmGlobal: "🏛️ 𝐆𝐋𝐎𝐁𝐀𝐋 𝐎𝐕𝐄𝐑𝐑𝐈𝐃𝐄\n━━━━━━━━━━━━━━━━━━\nReact to this transmission to confirm GLOBAL prefix change.",
      confirmThisThread: "🏛️ 𝐒𝐄𝐂𝐓𝐎𝐑 𝐂𝐎𝐍𝐅𝐈𝐆\n━━━━━━━━━━━━━━━━━━\nReact to this transmission to confirm LOCAL prefix change.",
      successGlobal: "🏛️ 𝐍𝐄𝐓𝐖𝐎𝐑𝐊 𝐔𝐏𝐃𝐀𝐓𝐄𝐃\n━━━━━━━━━━━━━━━━━━\nGlobal prefix established: %1",
      successThisThread: "🏛️ 𝐒𝐄𝐂𝐓𝐎𝐑 𝐔𝐏𝐃𝐀𝐓𝐄𝐃\n━━━━━━━━━━━━━━━━━━\nLocal prefix established: %1",
      myPrefix: "🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐏𝐑𝐎𝐓𝐎𝐂𝐎𝐋𝐒\n━━━━━━━━━━━━━━━━━━\n🌐 𝐆𝐥𝐨𝐛𝐚𝐥 𝐍𝐞𝐭𝐰𝐨𝐫𝐤: %1\n🛸 𝐋𝐨𝐜𝐚𝐥 𝐒𝐞𝐜𝐭𝐨𝐫: %2\n━━━━━━━━━━━━━━━━━━\n   𝐄𝐗𝐄𝐂𝐔𝐓𝐄𝐃 𝐁𝐘 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐒𝐘𝐒𝐓𝐄𝐌"
    }
  },

  onStart: async function ({ message, role, args, commandName, event, threadsData, getLang }) {
    const { threadID, messageID, senderID } = event;

    if (!args[0]) {
      const globalPrefix = global.GoatBot.config.prefix;
      const localPrefix = utils.getPrefix(threadID);
      return message.reply(getLang("myPrefix", globalPrefix, localPrefix));
    }

    if (args[0] == 'reset') {
      await threadsData.set(threadID, null, "data.prefix");
      return message.reply(getLang("reset", global.GoatBot.config.prefix));
    }

    const newPrefix = args[0];
    const formSet = {
      commandName,
      author: senderID,
      newPrefix
    };

    if (args[1] === "-g") {
      if (role < 2) return message.reply(getLang("onlyAdmin"));
      formSet.setGlobal = true;
    } else {
      formSet.setGlobal = false;
    }

    return message.reply(args[1] === "-g" ? getLang("confirmGlobal") : getLang("confirmThisThread"), (err, info) => {
      formSet.messageID = info.messageID;
      global.GoatBot.onReaction.set(info.messageID, formSet);
    });
  },

  onReaction: async function ({ message, threadsData, event, Reaction, getLang }) {
    const { author, newPrefix, setGlobal } = Reaction;
    if (event.userID !== author) return;

    if (setGlobal) {
      global.GoatBot.config.prefix = newPrefix;
      fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
      return message.reply(getLang("successGlobal", newPrefix));
    } else {
      await threadsData.set(event.threadID, newPrefix, "data.prefix");
      return message.reply(getLang("successThisThread", newPrefix));
    }
  },

  onChat: async function ({ event, message, getLang }) {
    if (event.body && event.body.toLowerCase() === "prefix") {
      const globalPrefix = global.GoatBot.config.prefix;
      const localPrefix = utils.getPrefix(event.threadID);
      return message.reply(getLang("myPrefix", globalPrefix, localPrefix));
    }
  }
};
