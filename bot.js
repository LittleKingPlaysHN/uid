const { Client: BotClient, EmbedBuilder } = require('discord.js');
const { Client: SelfClient } = require('discord.js-selfbot-v13');

const BOT_TOKEN  = '';
const SELF_TOKEN = '';

const bot  = new BotClient({ intents: ['Guilds', 'GuildMessages', 'MessageContent'] });
const self = new SelfClient({ checkUpdate: false });

function msToTime(ms) {
  const totalDays = Math.floor(ms / (1000 * 60 * 60 * 24));
  const months    = Math.floor(totalDays / 30.44);
  const days      = Math.floor(totalDays % 30.44);
  const hours     = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return '**' + months + ' mes(es) ' + days + ' dia(s) y ' + hours + ' hora(s)**';
}

function formatTimeFromDays(totalDays) {
  const months = Math.floor(totalDays / 30.44);
  const days   = Math.floor(totalDays % 30.44);
  const hours  = Math.floor((totalDays - Math.floor(totalDays)) * 24);
  return '**' + months + ' mes(es) ' + days + ' dia(s) y ' + hours + ' hora(s)**';
}

function getBadgeInfo(names, milestones, cur, months, totalDays) {
  const badge = names[cur] || null;
  const nxt = milestones.find(m => m > months);
  let nextBadgeIn = null;
  if (nxt) {
    const daysLeftExact = nxt * 30.44 - totalDays;
    const timeLeft = formatTimeFromDays(daysLeftExact);
    const full = names[nxt];
    const emoji = full.match(/<a?:\w+:\d+>/)?.[0] || '';
    const cleanName = full.replace(/<a?:\w+:\d+>\s?/, '');
    nextBadgeIn = '**' + emoji + ' ' + timeLeft + ' para ' + cleanName + '**';
  }
  return { badge, nextBadgeIn };
}

function getNitroBadgeInfo(premiumSince) {
  if (!premiumSince) return { badge: null, nextBadgeIn: null };
  const totalDays = Math.floor((Date.now() - new Date(premiumSince).getTime()) / (1000 * 60 * 60 * 24));
  const months = totalDays / 30.44;
  const milestones = [1, 2, 3, 6, 9, 12, 15, 18, 24];
  const names = {
    1:  '<:subscribernitro:1473881124831760627> Nitro 1 mes',
    2:  '<:nitrostylebronze:1473885331639111752> Nitro 2 meses',
    3:  '<:nitrostylesilver:1473885140198359151> Nitro 3 meses',
    6:  '<:nitrostylegold:1473885437859860521> Nitro 6 meses',
    9:  '<:nitrostyleplatinum:1473885523230588938> Nitro 9 meses',
    12: '<:nitrostyleplatinum:1473885523230588938> Nitro 1 ano',
    15: '<:nitrostylediamond:1473886147401748480> Nitro 15 meses',
    18: '<:nitrostylediamond:1473886147401748480> Nitro 18 meses',
    24: '<:nitrostyleopal:1473886189474943058> Nitro 2 anos+',
  };
  let cur = 0;
  for (const m of milestones) if (months >= m) cur = m;
  return getBadgeInfo(names, milestones, cur, months, totalDays);
}

const BADGE_EMOJI = {
  'premium':               '<:subscribernitro:1473881124831760627>',
  'hypesquad_house_1':     '<:hypesquadbravery:1473881595864678440>',
  'hypesquad_house_2':     '<:hypesquadbrilliance:1473881744817000659>',
  'hypesquad_house_3':     '<:hypesquadbalance:1473881504307220511>',
  'hypesquad':             '<:hypesquadevents:1473881823674236959>',
  'quest_completed':       '<:completedquest:1473881946093522954>',
  'orb_profile_badge':     '<:orb:1473878550753972378>',
  'legacy_username':       '<:originallyknownas:1473881169266212978>',
  'staff':                 '<:discordstaff:1473882205464821902>',
  'partner':               '<:partneredserverowner:1473882281629450453>',
  'certified_moderator':   '<:certifiedmoderator:1473882369676279848>',
  'verified_developer':    '<:earlyverifiedbotdeveloper:1473882442367504447>',
  'active_developer':      '<:activedeveloperbadge:1473882513360420995>',
  'bug_hunter_level_1':    '<:discordbughunter:1473882660442210427>',
  'bug_hunter_level_2':    '<:discordgoldbughunter:1473882602824794143>',
  'early_supporter':       '<:earlysupporter:1473882912268091488>',
  'premium_tenure_1_month_v2':  '<:nitrostylebronze:1473885331639111752>',
  'premium_tenure_2_month_v2':  '<:nitrostylebronze:1473885331639111752>',
  'premium_tenure_3_month_v2':  '<:nitrostylesilver:1473885140198359151>',
  'premium_tenure_6_month_v2':  '<:nitrostylegold:1473885437859860521>',
  'premium_tenure_9_month_v2':  '<:nitrostyleplatinum:1473885523230588938>',
  'premium_tenure_12_month_v2': '<:nitrostyleplatinum:1473885523230588938>',
  'premium_tenure_15_month_v2': '<:nitrostylediamond:1473886147401748480>',
  'premium_tenure_18_month_v2': '<:nitrostylediamond:1473886147401748480>',
  'premium_tenure_24_month_v2': '<:nitrostyleopal:1473886189474943058>',
  'premium_tenure_1_month':  '<:nitrostylebronze:1473885331639111752>',
  'premium_tenure_2_month':  '<:nitrostylebronze:1473885331639111752>',
  'premium_tenure_3_month':  '<:nitrostylesilver:1473885140198359151>',
  'premium_tenure_6_month':  '<:nitrostylegold:1473885437859860521>',
  'premium_tenure_9_month':  '<:nitrostyleplatinum:1473885523230588938>',
  'premium_tenure_12_month': '<:nitrostyleplatinum:1473885523230588938>',
  'premium_tenure_15_month': '<:nitrostylediamond:1473886147401748480>',
  'premium_tenure_18_month': '<:nitrostylediamond:1473886147401748480>',
  'premium_tenure_24_month': '<:nitrostyleopal:1473886189474943058>',
  'guild_booster':         '<:evolvingbadgenitro1months:1473882786594160866>',
  'guild_booster_lvl1':    '<:evolvingbadgenitro1months:1473882786594160866>',
  'guild_booster_lvl2':    '<:evolvingbadgenitro2months:1473883031818211481>',
  'guild_booster_lvl3':    '<:evolvingbadgenitro3months:1473883131085066302>',
  'guild_booster_lvl4':    '<:evolvingbadgenitro6months:1473883538121035948>',
  'guild_booster_lvl5':    '<:evolvingbadgenitro9months:1473883627501649992>',
  'guild_booster_lvl6':    '<:evolvingbadgenitro12:1473883785698480180>',
  'guild_booster_lvl7':    '<:evolvingbadgenitro15months:1473883718186958939>',
  'guild_booster_lvl8':    '<:evolvingbadgenitro18months:1473883925339308166>',
  'guild_booster_lvl9':    '<:evolvingbadgenitro24months:1473884054184001791>',
};

const ICON_HASH_EMOJI = {
  '83d8a1eb09a8d64e59233eec5d4d5c2d': '<:orb:1473878550753972378>',
};

const FLAG_EMOJI = {
  1:        '<:discordstaff:1473882205464821902>',
  2:        '<:partneredserverowner:1473882281629450453>',
  4:        '<:hypesquadevents:1473881823674236959>',
  8:        '<:discordbughunter:1473882660442210427>',
  64:       '<:hypesquadbravery:1473881595864678440>',
  128:      '<:hypesquadbrilliance:1473881744817000659>',
  256:      '<:hypesquadbalance:1473881504307220511>',
  512:      '<:earlysupporter:1473882912268091488>',
  16384:    '<:discordgoldbughunter:1473882602824794143>',
  131072:   '<:earlyverifiedbotdeveloper:1473882442367504447>',
  4194304:  '<:certifiedmoderator:1473882369676279848>',
  16777216: '<:activedeveloperbadge:1473882513360420995>',
};

function buildBadges(profile, isGuildOwner) {
  const apiBadges   = profile.badges      || [];
  const guildBadges = profile.guild_badges || [];
  const publicFlags = (profile.user && profile.user.public_flags) || 0;
  const result = [];
  const seen   = new Set();

  for (const b of apiBadges) {
    if (seen.has(b.id)) continue;
    seen.add(b.id);
    const emoji = BADGE_EMOJI[b.id];
    if (emoji) result.push(emoji);
    else {
      const hashEmoji = b.icon ? ICON_HASH_EMOJI[b.icon] : null;
      if (hashEmoji) result.push(hashEmoji);
      else if (b.icon) result.push('[' + b.description + '](https://cdn.discordapp.com/badge-icons/' + b.icon + '.png)');
      else result.push(b.description || b.id);
    }
  }

  for (const b of guildBadges) {
    const key = 'guild_' + b.id;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(BADGE_EMOJI[b.id] || '<:owner:1473884235113824286>');
  }

  for (const [bit, emoji] of Object.entries(FLAG_EMOJI)) {
    if ((publicFlags & Number(bit)) !== 0) {
      const key = 'flag_' + bit;
      if (seen.has(key)) continue;
      const covered = apiBadges.some(b => BADGE_EMOJI[b.id] === emoji);
      if (!covered) { seen.add(key); result.push(emoji); }
    }
  }

  if (isGuildOwner) result.push('<:owner:1473884235113824286>');
  return result.join(' ');
}

async function fetchWithTimeout(url, options = {}, timeout = 7000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    clearTimeout(id);
    console.error('[fetchWithTimeout]', e.message);
    return null;
  }
}

async function fetchUserProfile(userId) {
  return fetchWithTimeout(
    'https://discord.com/api/v10/users/' + userId + '/profile?with_mutual_guilds=false&with_mutual_friends_count=false',
    { headers: { Authorization: SELF_TOKEN, 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' } }
  );
}

async function fetchUserDirect(userId) {
  try {
    const u = await self.users.fetch(userId, { force: true }).catch(() => null);
    if (u) return u;
    const raw = await fetchWithTimeout('https://discord.com/api/v10/users/' + userId, {
      headers: { Authorization: SELF_TOKEN, 'User-Agent': 'Mozilla/5.0' }
    });
    if (!raw) return null;
    return {
      id: raw.id,
      username: raw.username,
      global_name: raw.global_name,
      createdTimestamp: Number((BigInt(raw.id) >> 22n) + 1420070400000n),
      avatarDecorationData: raw.avatar_decoration_data || null,
      displayAvatarURL: function(opts) {
        opts = opts || {};
        if (!raw.avatar) {
          var idx = raw.discriminator === '0' ? Number((BigInt(raw.id) >> 22n) % 6n) : Number(raw.discriminator) % 5;
          return 'https://cdn.discordapp.com/embed/avatars/' + idx + '.png';
        }
        var ext = (opts.dynamic && raw.avatar.startsWith('a_')) ? 'gif' : 'png';
        return 'https://cdn.discordapp.com/avatars/' + raw.id + '/' + raw.avatar + '.' + ext + '?size=' + (opts.size || 1024);
      },
      flags: { toArray: () => [] },
    };
  } catch(e) { console.error('[fetchUserDirect]', e.message); return null; }
}

async function getEffectUrl(effectId, effectSkuId) {
  if (!effectId) return null;
  if (!effectSkuId) return null;
  try {
    const data = await fetchWithTimeout(
      'https://discord.com/api/v10/store/published-listings/skus/' + effectSkuId,
      { headers: { Authorization: SELF_TOKEN, 'User-Agent': 'Mozilla/5.0' } }
    );
    if (!data) return null;
    const art = data.assets && data.assets[0];
    if (art && art.url) return art.url;
    const appId = data.sku && data.sku.application_id;
    if (appId) return 'https://cdn.discordapp.com/app-assets/' + appId + '/' + effectId + '.webm';
    return null;
  } catch(e){ console.error('[getEffectUrl]', e.message); return null; }
}

const cooldowns  = new Map();
const COOLDOWN_MS = 10 * 1000;
const PREFIXES    = [',,', ',', '!', '$'];

self.on('messageCreate', async message => {
  const prefixUsed = PREFIXES.find(p => message.content.startsWith(p));
  if (!prefixUsed) return;
  const args    = message.content.slice(prefixUsed.length).trim().split(/\s+/);
  const command = args[0].toLowerCase();
  if (command !== 'uid') return;

  const now    = Date.now();
  const userId = message.author.id;
  if (cooldowns.has(userId)) {
    if (now < cooldowns.get(userId) + COOLDOWN_MS) return;
  }
  cooldowns.set(userId, now);

  const targetId = message.mentions.users.first()?.id || args[1] || message.author.id;
  const [user, profile] = await Promise.all([fetchUserDirect(targetId), fetchUserProfile(targetId)]);
  if (!user) return;

  const guild        = message.guild;
  const isGuildOwner = guild ? guild.ownerId === targetId : false;
  const member       = guild ? (guild.members.cache.get(targetId) || await guild.members.fetch(targetId).catch(() => null)) : null;
  const joinedTimestamp = member ? member.joinedTimestamp : null;

  const effectId    = profile?.user_profile?.profile_effect?.id     || null;
  const effectSkuId = profile?.user_profile?.profile_effect?.sku_id  || null;
  const effectUrl   = await getEffectUrl(effectId, effectSkuId);
  const badgesStr   = profile ? buildBadges(profile, isGuildOwner) : '';

  bot.emit('selfData', { channelId: message.channel.id, user, profile, effectUrl, joinedTimestamp, badgesStr });
});

bot.on('selfData', async data => {
  const ch = await bot.channels.fetch(data.channelId).catch(() => null);
  if (!ch) return;

  const { user, profile, effectUrl, joinedTimestamp, badgesStr } = data;
  const displayName = profile?.user?.global_name || user.global_name || user.username;
  const avatarUrl   = user.displayAvatarURL({ dynamic: true, size: 4096 });

  const clan         = profile?.user?.clan || profile?.user?.primary_guild || null;
  const clanTag      = clan?.tag || null;
  const clanGuildId  = clan?.identity_guild_id || null;
  const clanBadge    = clan?.badge || null;
  const clanBadgeUrl = (clanGuildId && clanBadge)
    ? 'https://cdn.discordapp.com/clan-badges/' + clanGuildId + '/' + clanBadge + '.png'
    : null;

  const premiumSince  = profile?.premium_since || null;
  const nitroDuration = premiumSince ? msToTime(Date.now() - new Date(premiumSince).getTime()) : null;
  const { badge: nitroBadge, nextBadgeIn } = getNitroBadgeInfo(premiumSince);

  const decoAsset  = profile?.user?.avatar_decoration_data?.asset || user.avatarDecorationData?.asset || null;
  const decoUrl    = decoAsset ? 'https://cdn.discordapp.com/avatar-decoration-presets/' + decoAsset + '.png' : null;

  const nameplateAsset = profile?.user?.collectibles?.nameplate?.asset || null;
  const nameplateUrl   = nameplateAsset ? 'https://cdn.discordapp.com/assets/collectibles/' + nameplateAsset + 'asset.webm' : null;
  const nameplatePng   = nameplateAsset ? 'https://cdn.discordapp.com/assets/collectibles/' + nameplateAsset + 'asset_thumbnail.png' : null;

  const bannerHash = profile?.user_profile?.banner || profile?.user?.banner || null;
  const bannerUrl  = bannerHash
    ? 'https://cdn.discordapp.com/banners/' + user.id + '/' + bannerHash + '.' + (bannerHash.startsWith('a_') ? 'gif' : 'png') + '?size=4096'
    : null;

  const userBio   = profile?.user_profile?.bio || null;
  const createdTs = '<t:' + Math.floor(user.createdTimestamp / 1000) + ':R>';
  const joinedTs  = joinedTimestamp ? '<t:' + Math.floor(joinedTimestamp / 1000) + ':R>' : 'No disponible';

  let nitroValue = 'Sin Nitro';
  const nitroExtra = [];
  if (premiumSince) {
    const ts = Math.floor(new Date(premiumSince).getTime() / 1000);
    nitroValue = '<:nitrostylesilver:1473885140198359151> ' + nitroDuration + ' atras\n'
               + '<:nitrostylegold:1473885437859860521> <t:' + ts + ':f>';
    if (nitroBadge)  nitroExtra.push(nitroBadge);
    if (nextBadgeIn) nitroExtra.push(nextBadgeIn);
  }

  const description = user.username + (badgesStr ? ' \u2022 ' + badgesStr : '');
  const placaFinal  = nameplateUrl || nameplatePng;
  const enlaceItems = [
    '[Avatar](' + avatarUrl + ')',
    decoUrl    ? '[Deco](' + decoUrl + ')'     : null,
    placaFinal ? '[Placa](' + placaFinal + ')' : null,
    bannerUrl  ? '[Banner](' + bannerUrl + ')' : null,
    effectUrl  ? '[Efect](' + effectUrl + ')'  : null,
  ].filter(Boolean);

  const fields = [
    { name: 'Tenencia de Nitro', value: nitroValue, inline: false },
    ...(nitroExtra.length > 0 ? [{ name: '\u200b', value: nitroExtra.join('\n'), inline: false }] : []),
    ...(userBio ? [{ name: 'Descripcion', value: userBio, inline: false }] : []),
    { name: 'Creado',  value: createdTs,              inline: true },
    { name: 'Unido',   value: joinedTs,               inline: true },
    { name: 'Enlaces', value: enlaceItems.join('\n'),  inline: true },
  ];

  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setAuthor({ name: displayName + ' (' + user.id + ')', iconURL: avatarUrl })
    .setThumbnail(avatarUrl)
    .setDescription(description)
    .addFields(fields)
    .setFooter({ text: clanTag || 'discord.gg', iconURL: clanBadgeUrl || undefined });

  await ch.send({ embeds: [embed] });
});

self.login(SELF_TOKEN).then(() => console.log('Selfbot listo -> ' + self.user.tag));
bot.once('clientReady', () => console.log('Bot listo -> ' + bot.user.tag));
bot.login(BOT_TOKEN);