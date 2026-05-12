const milestones = [
  { id: 2, amount: 1000000000n, name: "Billionaire", rank: "TITAN IRON" },
  { id: 3, amount: 1000000000000n, name: "Trillionaire", rank: "ZENITH PREMIUM" },
  { id: 4, amount: 1000000000000000n, name: "Quadrillionaire", rank: "AETHER PLATINUM" },
  { id: 5, amount: 10n**100n, name: "Googolian", rank: "COSMIC OVERLORD" }
];

module.exports.config = {
  name: "autocongrats",
  version: "5.5",
  author: "Minh Anh",
  countDown: 0,
  role: 0,
  shortDescription: "Database Milestone Watcher",
  category: "system"
};

module.exports.onStart = async function ({ api, event }) {
  return api.sendMessage("🕵️‍♂️ Milestone Watcher is active.", event.threadID);
};

module.exports.handleEvent = async function ({ api, event, usersData }) {
  const { senderID, threadID } = event;
  if (!senderID || isNaN(senderID) || !threadID) return;

  try {
    const userData = await usersData.get(senderID);
    if (!userData || !userData.data) return;

    const currentMoney = BigInt(Math.floor(userData.data.money || 0));
    const lastAchievement = parseInt(userData.data.lastAchievement || 0);

    for (const m of milestones) {
      if (currentMoney >= m.amount && lastAchievement < m.id) {
        userData.data.lastAchievement = m.id;
        await usersData.set(senderID, userData.data);

        const userName = await usersData.getName(senderID);
        const msg = `🎊 MILESTONE REACHED! 🎊\n━━━━━━━━━━━━━━━━━━\nUser: ${userName.toUpperCase()}\n\nYou are now officially a ${m.name}!\nUnlocked: ${m.rank} card theme.\n\nType your balance command to see your upgrade!`;

        return api.sendMessage(msg, threadID);
      }
    }
  } catch (err) {}
};
