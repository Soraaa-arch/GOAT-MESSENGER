module.exports = {
  config: {
    name: "resetall",
    aliases: ["wipeall", "purgeeconomy", "liquidate"],
    version: "1.1.0",
    author: "Minh Anh",
    countDown: 15, // Increased countdown for safety
    role: 2, // Strict Admin Only
    category: "admin",
    guide: {
      en: "{p}resetall"
    }
  },

  onStart: async function ({ api, event, usersData }) {
    const { threadID, messageID } = event;

    try {
      // 1. FETCH ALL USER ENTRIES
      const allUsers = await usersData.getAll();
      let count = 0;

      // 2. GLOBAL RESET LOOP
      // Targets both 'money' (wallet) and 'bank' fields
      for (const user of allUsers) {
        const userID = user.userID;
        const currentData = user.data || {};
        
        await usersData.set(userID, { 
          data: { 
            ...currentData, 
            money: "0", 
            bank: "0" 
          } 
        });
        count++;
      }

      // 3. UI CONSTRUCTION
      let msg = `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐂𝐀𝐓𝐀𝐂𝐋𝐘𝐒𝐌\n`;
      msg += `━━━━━━━━━━━━━━━━━━\n`;
      msg += `📉 𝐓𝐎𝐓𝐀𝐋 𝐋𝐈𝐐𝐔𝐈𝐃𝐀𝐓𝐈𝐎𝐍 𝐂𝐎𝐌𝐏𝐋𝐄𝐓𝐄\n`;
      msg += `👥 𝐀𝐜𝐜𝐨𝐮𝐧𝐭𝐬 𝐒𝐜𝐫𝐮𝐛𝐛𝐞𝐝: ${count}\n`;
      msg += `💰 𝐖𝐚𝐥𝐥𝐞𝐭 𝐁𝐚𝐥𝐚𝐧𝐜𝐞𝐬: $0\n`;
      msg += `🏦 𝐁𝐚𝐧𝐤 𝐃𝐞𝐩𝐨𝐬𝐢𝐭𝐬: $0\n`;
      msg += `━━━━━━━━━━━━━━━━━━\n`;
      msg += `⚠️ 𝐀𝐥𝐥 𝐜𝐫𝐞𝐝𝐢𝐭𝐬 𝐡𝐚𝐯𝐞 𝐛𝐞𝐞𝐧 𝐞𝐫𝐚𝐬𝐞𝐝 𝐟𝐫𝐨𝐦 𝐞𝐱𝐢𝐬𝐭𝐞𝐧𝐜𝐞.\n`;
      msg += `━━━━━━━━━━━━━━━━━━\n`;
      msg += `   𝐄𝐗𝐄𝐂𝐔𝐓𝐄𝐃 𝐁𝐘 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐄𝐋𝐈𝐓𝐄`;

      return api.sendMessage(msg, threadID, messageID);
    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ 𝐂𝐀𝐓𝐀𝐂𝐋𝐘𝐒𝐌 𝐅𝐀𝐈𝐋𝐄𝐃. System error during global liquidation.", threadID, messageID);
    }
  }
};
