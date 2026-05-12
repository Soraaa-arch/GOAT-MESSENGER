module.exports.config = {
  name: "color",
  aliases: ["cg", "betcolor"],
  version: "2.0",
  author: "Minh Anh",
  role: 0,
  category: "games",
  shortDescription: "Sovereign Multi-Asset Color Protocol"
};

function getSafeBigInt(value) {
  try {
    const clean = value.toString().split('.')[0].replace(/[^0-9]/g, '');
    return clean ? BigInt(clean) : 0n;
  } catch (e) { return 0n; }
}

module.exports.onStart = async function ({ api, event, args, usersData }) {
  const { senderID, threadID, messageID } = event;
  const userData = await usersData.get(senderID);
  const currentBalance = getSafeBigInt(userData?.data?.money ?? "0");
  const colorMap = { "red": "🔴", "blue": "🔵", "green": "🟢", "yellow": "🟡", "purple": "🟣", "orange": "🟠" };
  const colors = Object.values(colorMap);

  if (args.length < 2) return api.sendMessage("Usage: color [bet] [color]", threadID, messageID);

  const bet = getSafeBigInt(args[0]);
  const chosen = colorMap[args[1].toLowerCase()];
  if (!chosen || bet <= 0n || currentBalance < bet) return api.sendMessage("❌ Invalid bet or color.", threadID, messageID);

  const draw = [colors[Math.floor(Math.random()*6)], colors[Math.floor(Math.random()*6)], colors[Math.floor(Math.random()*6)]];
  const matches = draw.filter(c => c === chosen).length;
  
  let multiplier = matches === 1 ? 2n : matches === 2 ? 3n : matches === 3 ? 5n : 0n;
  const newBal = multiplier > 0n ? currentBalance - bet + (bet * multiplier) : currentBalance - bet;

  await usersData.set(senderID, { data: { ...userData.data, money: newBal.toString() } });

  api.sendMessage(`🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐆𝐀𝐌𝐄\n━━━━━━━━━━\n🎰 DRAW: [ ${draw.join(" | ")} ]\n${matches > 0 ? "✅ WIN: " + multiplier + "x" : "❌ LOSS"}\n💰 BALANCE: $${newBal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`, threadID, messageID);
};
