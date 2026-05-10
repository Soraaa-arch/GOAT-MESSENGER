module.exports = {
  config: {
    name: "war",
    aliases: ["chud"],
    version: "1.0",
    author: "nexo_here",
    role: 0,
    category: "admin",
    guide: {
      vi: "Not Available",
      en: "chud @(mention)"
    } 
  },

  onStart: async function ({ api, event, userData, args }) {
      var mention = Object.keys(event.mentions)[0];
    if(!mention) return api.sendMessage("Need to tag 1 friend whome you want to scold with bad words", event.threadID);
 let name =  event.mentions[mention];
    var arraytag = []; 
        arraytag.push({id: mention, tag: name});
    var a = function (a) { api.sendMessage(a, event.threadID); }
setTimeout(() => {a({body: " ulol gago tarantado tanga bastos walang modo baliw bobo siraulo tang ina ka sinto sinto kulang kulang may sayad abnormal hayop demonyo animal aso pusa baboy daga ibon ahas baka pagong penguin dolpin tigre leon elepante buwaya unggoy bulate kuto zebra dragon camel panda kuwago kuneho ipis lamok turo kabayo bibe manok giraf langaw uod kambing garapata" + "" + name, mentions: arraytag})}, 3000);
setTimeout(() => {a({body: " Potangina mo bobo wla Kang silbi animal ka yawa Kang Gago ka palamunin kalang Naman sainyo puro kapa dada mag ML bawal lp Dito gago" + " " + name, mentions: arraytag})}, 5000);
setTimeout(() => {a({body: " Walang papa" + " " + name, mentions: arraytag})}, 7000);
setTimeout(() => {a({body: " baka umiyak kanang gago ka? " + " " + name, mentions: arraytag})}, 9000);
setTimeout(() => {a({body: " gagamit na nga lang ng bot hindi pa marunong tanga!" + " " + name, mentions: arraytag})}, 12000);
setTimeout(() => {a({body: " leave kana baka umiyak kapa" + " " + name, mentions: arraytag})}, 14000);
setTimeout(() => {a({body: " putanginamo tanga" + " " + name, mentions: arraytag})}, 16000);
setTimeout(() => {a({body: " stupid bitch ass nigga" + " " + name, mentions: arraytag})}, 18000);
setTimeout(() => {a({body: " baka hindi kapa tuli puta ka" + " " + name, mentions: arraytag})}, 20000);
setTimeout(() => {a({body: " gago umiiyak kana? HAHAHAHHAHA" + " " + name, mentions: arraytag})}, 22000);
setTimeout(() => {a({body: " Ulol gago tarantado tanga bastos walang modo baliw bobo siraulo tangina ka sinto sinto kulangkulang may sayad abnormal hayop demonyo animal Aso't pusa baboy daga Ibon ahas baka pagong Penguin dolphin tegre lion Elepante buwaya unggoy Bulate kuto zebra dragon Camel panda buwitre usa Kuwago kuneho ipis lamok Toro kabayo bibe manok Giraffe langaw uod kambing Garapata kwala kalabaw pating Itik kangaroo oso isda Butiki bubuyog surot linta Pokemon tipaklong tupa uwak Kulisap octopus tuko bayawak Starfish jellyfish langam iguana" + " " + name, mentions: arraytag})}, 2400);
setTimeout(() => {a({body: " mas magaling pa bot sayo gago" + " " + name, mentions: arraytag})}, 26000);
setTimeout(() => {a({body: " may tatay kaba?" + " " + name, mentions: arraytag})}, 28000);
setTimeout(() => {a({body: " baka may sipon sipon kapa kadiri puta" + " " + name, mentions: arraytag})}, 30000);
setTimeout(() => {a({body: " tamad kang kingina ka" + " " + name, mentions: arraytag})}, 32000);
setTimeout(() => {a({body: " walang kwenta!" + " " + name, mentions: arraytag})}, 65000);
setTimeout(() => {a({body: " jakol lang ba alam mo?" + " " + name, mentions: arraytag})}, 34000);
setTimeout(() => {a({body: " what a stupid bitch" + " " + name, mentions: arraytag})}, 36000);
setTimeout(() => {a({body: " mamatay na mama mo" + " " + name, mentions: arraytag})}, 38000);
setTimeout(() => {a({body: " pag ba sinampal kita left and right mananahimik kana?" + " " + name, mentions: arraytag})}, 40000);
setTimeout(() => {a({body: " bye bitch" + " " + name, mentions: arraytag})}, 44000);
  }
};
