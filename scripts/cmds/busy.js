module.exports = {
	config: {
		name: "busy",
		version: "2.5.0",
		author: "Sovereign Edit",
		countDown: 5,
		role: 0,
		category: "system",
		guide: {
			en: "{pn} [reason] | {pn} off"
		}
	},

	onStart: async function ({ args, event, usersData, message }) {
		const { senderID } = event;

		if (args[0] == "off") {
			const userData = await usersData.get(senderID);
			delete userData.data.busy;
			await usersData.set(senderID, userData.data, "data");
			
			let msg = `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐒𝐘𝐒𝐓𝐄𝐌 𝐔𝐏𝐃𝐀𝐓𝐄\n`;
			msg += `━━━━━━━━━━━━━━━━━━\n`;
			msg += `✅ 𝐃𝐢𝐬𝐭𝐮𝐫𝐛𝐚𝐧𝐜𝐞 𝐟𝐢𝐥𝐭𝐞𝐫𝐬 𝐝𝐞𝐚𝐜𝐭𝐢𝐯𝐚𝐭𝐞𝐝.\n`;
			msg += `━━━━━━━━━━━━━━━━━━\n`;
			return message.reply(msg);
		}

		const reason = args.join(" ") || "No specific reason provided.";
		const userData = await usersData.get(senderID);
		
		// Initialize busy object with a log array for mentions
		await usersData.set(senderID, { 
			status: true, 
			reason: reason, 
			logs: [] 
		}, "data.busy");

		let msg = `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐒𝐘𝐒𝐓𝐄𝐌 𝐁𝐔𝐒𝐘\n`;
		msg += `━━━━━━━━━━━━━━━━━━\n`;
		msg += `👤 𝐒𝐭𝐚𝐭𝐮𝐬: 𝐎𝐅𝐅𝐋𝐈𝐍𝐄 / 𝐁𝐔𝐒𝐘\n`;
		msg += `📝 𝐑𝐞𝐚𝐬𝐨𝐧: ${reason}\n`;
		msg += `━━━━━━━━━━━━━━━━━━\n`;
		msg += `   𝐒𝐘𝐒𝐓𝐄𝐌 𝐎𝐕𝐄𝐑𝐑𝐈𝐃𝐄 𝐀𝐂𝐓𝐈𝐕𝐄`;
		
		return message.reply(msg);
	},

	onChat: async ({ event, message, usersData, api }) => {
		const { senderID, mentions, body, type } = event;

		// 1. LOGGING MENTIONS (When someone tags you)
		if (mentions && Object.keys(mentions).length > 0) {
			for (const userID of Object.keys(mentions)) {
				const userData = await usersData.get(userID);
				const busyData = userData.data.busy;

				if (busyData && busyData.status) {
					// Add mention to the user's logs
					const logEntry = {
						name: (await usersData.get(senderID)).name,
						content: body || "Sent an attachment/sticker",
						time: new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
					};
					
					busyData.logs.push(logEntry);
					await usersData.set(userID, busyData, "data.busy");

					// Auto-reply to the person who tagged you
					let reply = `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐀𝐔𝐓𝐎-𝐑𝐄𝐏𝐋𝐘\n`;
					reply += `━━━━━━━━━━━━━━━━━━\n`;
					reply += `👤 ${userData.name} is currently 𝐁𝐔𝐒𝐘.\n`;
					reply += `📝 𝐑𝐞𝐚𝐬𝐨𝐧: ${busyData.reason}\n`;
					reply += `━━━━━━━━━━━━━━━━━━\n`;
					reply += `📩 𝐘𝐨𝐮𝐫 𝐦𝐞𝐬𝐬𝐚𝐠𝐞 𝐡𝐚𝐬 𝐛𝐞𝐞𝐧 𝐥𝐨𝐠𝐠𝐞𝐝.`;
					message.reply(reply);
				}
			}
		}

		// 2. RETURN REPORT (When YOU speak again)
		const selfData = await usersData.get(senderID);
		if (selfData.data.busy && selfData.data.busy.status) {
			const logs = selfData.data.busy.logs;
			
			let report = `🏛️ 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 𝐒𝐘𝐒𝐓𝐄𝐌 𝐑𝐄𝐓𝐔𝐑𝐍\n`;
			report += `━━━━━━━━━━━━━━━━━━\n`;
			report += `Welcome back. Summary of missed activity:\n\n`;

			if (logs.length > 0) {
				logs.forEach((m, i) => {
					report += `${i + 1}. 👤 ${m.name}\n💬 "${m.content}"\n⏰ ${m.time}\n\n`;
				});
			} else {
				report += `No mentions were recorded while you were away.\n`;
			}

			report += `━━━━━━━━━━━━━━━━━━\n`;
			report += `📉 𝐒𝐭𝐚𝐭𝐮𝐬: 𝐎𝐍𝐋𝐈𝐍𝐄 / 𝐀𝐂𝐓𝐈𝐕𝐄`;

			// Wipe busy data upon return
			delete selfData.data.busy;
			await usersData.set(senderID, selfData.data, "data");

			return message.reply(report);
		}
	}
};
