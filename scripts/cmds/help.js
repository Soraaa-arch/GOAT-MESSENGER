const fs = require('fs');
const path = require('path');
const { utils } = global;

module.exports = {
  config: {
    name: "help",
    version: "3.2",
    role: 0,
    countdown: 0,
    author: "Minh Anh",
    description: "Displays the Sovereign Command Registry with unified luxury aesthetics.",
    category: "system",
  },

  onStart: async ({ api, event, args }) => {
    const { threadID, messageID } = event;
    const cmdsFolderPath = path.join(__dirname, '.');
    const files = fs.readdirSync(cmdsFolderPath).filter(file => file.endsWith('.js') && file !== "help.js");

    const safeRequire = (filePath) => {
      try {
        const cmd = require(filePath);
        return cmd && cmd.config ? cmd : null;
      } catch (e) { return null; }
    };

    const commands = files.map(file => safeRequire(path.join(cmdsFolderPath, file))).filter(Boolean);

    const getCategories = () => {
      const categories = {};
      for (const command of commands) {
        const categoryName = command.config.category?.toUpperCase() || 'UNCATEGORIZED';
        if (!categories[categoryName]) categories[categoryName] = [];
        categories[categoryName].push(command.config.name);
      }
      return categories;
    };

    const sendMessage = async (message) => {
      return await api.sendMessage({ body: message }, threadID, messageID);
    };

    try {
      // 1. DETAIL VIEW (Same as Bank Statement style)
      if (args[0] && args[0] !== "|") {
        const commandName = args[0].toLowerCase();
        const command = commands.find(cmd =>
          cmd.config.name.toLowerCase() === commandName ||
          (cmd.config.aliases && cmd.config.aliases.includes(commandName))
        );

        if (!command) return sendMessage(`❌ 𝐄𝐑𝐑𝐎𝐑: Function not found in registry.`);

        const usage = command.config.guide?.en || command.config.guide || "No guide provided";
        
        let details = `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐌𝐀𝐍𝐈𝐅𝐄𝐒𝐓\n`;
        details += `━━━━━━━━━━━━━━━━━━\n`;
        details += `⚡ 𝐅𝐮𝐧𝐜𝐭𝐢𝐨𝐧: ${command.config.name.toUpperCase()}\n`;
        details += `📂 𝐂𝐥𝐚𝐬𝐬: ${command.config.category.toUpperCase()}\n`;
        details += `🛡️ 𝐏𝐞𝐫𝐦𝐬: ${command.config.role == 1 ? "ADMIN" : "USER"}\n`;
        details += `⏱️ 𝐃𝐞𝐥𝐚𝐲: ${command.config.countDown || 0}s\n`;
        details += `━━━━━━━━━━━━━━━━━━\n`;
        details += `📖 𝐔𝐒𝐀𝐆𝐄:\n${usage}\n`;
        details += `━━━━━━━━━━━━━━━━━━\n`;
        details += `👤 𝐀𝐮𝐭𝐡𝐨𝐫: ${command.config.author || 'Minh Anh'}`;
        return sendMessage(details);
      }

      // 2. MAIN REGISTRY VIEW (Unified Theme)
      const categories = getCategories();
      let helpMessage = `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐌𝐀𝐈𝐍𝐅𝐑𝐀𝐌𝐄\n`;
      helpMessage += `━━━━━━━━━━━━━━━━━━\n\n`;

      for (const category in categories) {
        helpMessage += `［ ${category} ］\n`;
        helpMessage += `◈ ${categories[category].join('  ◈ ')}\n\n`;
      }

      helpMessage += `━━━━━━━━━━━━━━━━━━\n`;
      helpMessage += `✨ 𝐒𝐲𝐬𝐭𝐞𝐦 𝐂𝐚𝐩𝐚𝐜𝐢𝐭𝐲: ${commands.length} Functions\n`;
      helpMessage += `💡 𝐈𝐧𝐪𝐮𝐢𝐫𝐲: help [name]\n`;
      helpMessage += `━━━━━━━━━━━━━━━━━━\n`;
      helpMessage += `   𝐄𝐗𝐄𝐂𝐔𝐓𝐄𝐃 𝐁𝐘 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐋𝐈𝐓𝐄`;

      return sendMessage(helpMessage);

    } catch (error) {
      return sendMessage('⚠️ 𝐒𝐲𝐬𝐭𝐞𝐦 𝐅𝐚𝐮𝐥𝐭: Registry inaccessible.');
    }
  }
};
