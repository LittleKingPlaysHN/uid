require('dotenv').config();

const {
  Client: BotClient,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require('discord.js');

const { Client: SelfClient } = require('discord.js-selfbot-v13');

const cleanToken = t => String(t || '').trim().replace(/^["']|["']$/g, '').trim();

const BOT_TOKEN = cleanToken(process.env.BOT_TOKEN);
const SELF_TOKEN = cleanToken(process.env.SELF_TOKEN);

const bot = new BotClient({
  intents: ['Guilds', 'GuildMessages']
});

const self = new SelfClient({
  checkUpdate: false
});

const uidButtonData = new Map();
const UID_BUTTON_TIMEOUT = 60 * 1000;
const DEFAULT_NITRO_EMOJI = '<:subscribernitro:1473881124831760627>';
const PREFIXES = [',,', ',', '!', '$'];
const cooldowns = new Map();
const COOLDOWN_MS = 10 * 1000;

process.on('unhandledRejection', e => console.error('[unhandledRejection]', e));
process.on('uncaughtException', e => console.error('[uncaughtException]', e));


function clamp(s, n) {
  s = String(s);
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

/* =====================================================
 * FORMATO DE TIEMPO
 * ===================================================== */

function pl(n, singular, plural) {
  return n + ' ' + (n === 1 ? singular : plural);
}

function buildDuration(months, days, hours) {
  return (
    pl(months, 'mes', 'meses') + ', ' +
    pl(days, 'día', 'días') + ' y ' +
    pl(hours, 'hora', 'horas')
  );
}

function msToTime(ms) {
  const totalDays = Math.floor(ms / (1000 * 60 * 60 * 24));
  const months = Math.floor(totalDays / 30.44);
  const days = Math.floor(totalDays % 30.44);
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return buildDuration(months, days, hours);
}

function formatTimeFromDays(totalDays) {
  const months = Math.floor(totalDays / 30.44);
  const days = Math.floor(totalDays % 30.44);
  const hours = Math.floor((totalDays - Math.floor(totalDays)) * 24);
  return buildDuration(months, days, hours);
}

/* =====================================================
 * INSIGNIAS DE NITRO
 * ===================================================== */

function getBadgeInfo(names, milestones, cur, months, totalDays, premiumMs) {
  const badge = names[cur] || null;
  const badgeEmoji = badge ? (badge.match(/<a?:\w+:\d+>/)?.[0] || '') : '';
  const nxt = milestones.find(m => m > months);
  let nextBadge = null;

  if (nxt) {
    const daysLeftExact = nxt * 30.44 - totalDays;
    const nextEmoji = names[nxt].match(/<a?:\w+:\d+>/)?.[0] || '';
    const nextTs = Math.floor(
      (premiumMs + nxt * 30.44 * 24 * 60 * 60 * 1000) / 1000
    );

    nextBadge = {
      emoji: nextEmoji,
      timeLeft: formatTimeFromDays(daysLeftExact),
      ts: nextTs
    };
  }

  return { badge, badgeEmoji, nextBadge };
}

function getNitroBadgeInfo(premiumSince) {
  if (!premiumSince) {
    return { badge: null, badgeEmoji: '', nextBadge: null };
  }

  const premiumMs = new Date(premiumSince).getTime();
  const totalDays = (Date.now() - premiumMs) / (1000 * 60 * 60 * 24);
  const months = totalDays / 30.44;

  const milestones = [1, 2, 3, 6, 9, 12, 15, 18, 24];

  const names = {
    1: '<:subscribernitro:1473881124831760627> Nitro 1 mes',
    2: '<:nitrostylebronze:1473885331639111752> Nitro 2 meses',
    3: '<:nitrostylesilver:1473885140198359151> Nitro 3 meses',
    6: '<:nitrostylegold:1473885437859860521> Nitro 6 meses',
    9: '<:nitrostyleplatinum:1473885523230588938> Nitro 9 meses',
    12: '<:nitrostyleplatinum:1473885523230588938> Nitro 1 ano',
    15: '<:nitrostylediamond:1473886147401748480> Nitro 15 meses',
    18: '<:nitrostylediamond:1473886147401748480> Nitro 18 meses',
    24: '<:nitrostyleopal:1473886189474943058> Nitro 2 anos+'
  };

  let cur = 0;
  for (const m of milestones) {
    if (months >= m) cur = m;
  }

  return getBadgeInfo(names, milestones, cur, months, totalDays, premiumMs);
}

const BADGE_EMOJI = {
  'premium': '<:subscribernitro:1473881124831760627>',
  'hypesquad_house_1': '<:hypesquadbravery:1473881595864678440>',
  'hypesquad_house_2': '<:hypesquadbrilliance:1473881744817000659>',
  'hypesquad_house_3': '<:hypesquadbalance:1473881504307220511>',
  'hypesquad': '<:hypesquadevents:1473881823674236959>',
  'quest_completed': '<:completedquest:1473881946093522954>',
  'orb_profile_badge': '<:orb:1473878550753972378>',
  'leaf': '<:leaf:1544843951230554122>',
  'legacy_username': '<:originallyknownas:1473881169266212978>',
  'staff': '<:discordstaff:1473882205464821902>',
  'partner': '<:partneredserverowner:1473882281629450453>',
  'certified_moderator': '<:certifiedmoderator:1473882369676279848>',
  'verified_developer': '<:earlyverifiedbotdeveloper:1473882442367504447>',
  'active_developer': '<:activedeveloperbadge:1473882513360420995>',
  'bug_hunter_level_1': '<:discordbughunter:1473882660442210427>',
  'bug_hunter_level_2': '<:discordgoldbughunter:1473882602824794143>',
  'early_supporter': '<:earlysupporter:1473882912268091488>',

  'premium_tenure_1_month_v2': '<:nitrostylebronze:1473885331639111752>',
  'premium_tenure_2_month_v2': '<:nitrostylebronze:1473885331639111752>',
  'premium_tenure_3_month_v2': '<:nitrostylesilver:1473885140198359151>',
  'premium_tenure_6_month_v2': '<:nitrostylegold:1473885437859860521>',
  'premium_tenure_9_month_v2': '<:nitrostyleplatinum:1473885523230588938>',
  'premium_tenure_12_month_v2': '<:nitrostyleplatinum:1473885523230588938>',
  'premium_tenure_15_month_v2': '<:nitrostylediamond:1473886147401748480>',
  'premium_tenure_18_month_v2': '<:nitrostylediamond:1473886147401748480>',
  'premium_tenure_24_month_v2': '<:nitrostyleopal:1473886189474943058>',

  'premium_tenure_1_month': '<:nitrostylebronze:1473885331639111752>',
  'premium_tenure_2_month': '<:nitrostylebronze:1473885331639111752>',
  'premium_tenure_3_month': '<:nitrostylesilver:1473885140198359151>',
  'premium_tenure_6_month': '<:nitrostylegold:1473885437859860521>',
  'premium_tenure_9_month': '<:nitrostyleplatinum:1473885523230588938>',
  'premium_tenure_12_month': '<:nitrostyleplatinum:1473885523230588938>',
  'premium_tenure_15_month': '<:nitrostylediamond:1473886147401748480>',
  'premium_tenure_18_month': '<:nitrostylediamond:1473886147401748480>',
  'premium_tenure_24_month': '<:nitrostyleopal:1473886189474943058>',

  'guild_booster': '<:evolvingbadgenitro1months:1473882786594160866>',
  'guild_booster_lvl1': '<:evolvingbadgenitro1months:1473882786594160866>',
  'guild_booster_lvl2': '<:evolvingbadgenitro2months:1473883031818211481>',
  'guild_booster_lvl3': '<:evolvingbadgenitro3months:1473883131085066302>',
  'guild_booster_lvl4': '<:evolvingbadgenitro6months:1473883538121035948>',
  'guild_booster_lvl5': '<:evolvingbadgenitro9months:1473883627501649992>',
  'guild_booster_lvl6': '<:evolvingbadgenitro12:1473883785698480180>',
  'guild_booster_lvl7': '<:evolvingbadgenitro15months:1473883718186958939>',
  'guild_booster_lvl8': '<:evolvingbadgenitro18months:1473883925339308166>',
  'guild_booster_lvl9': '<:evolvingbadgenitro24months:1473884054184001791>'
};

const ICON_HASH_EMOJI = {
  '83d8a1eb09a8d64e59233eec5d4d5c2d': '<:orb:1473878550753972378>',
  '6f9e37f9029ff57aef81db857890005e': '<:supportscommand:1544843615036244049>',
  'f2459b691ac7453ed6039bbcfaccbfcd': '<:AutoMod:1544848223745875968>'
};

const FLAG_EMOJI = {
  1: '<:discordstaff:1473882205464821902>',
  2: '<:partneredserverowner:1473882281629450453>',
  4: '<:hypesquadevents:1473881823674236959>',
  8: '<:discordbughunter:1473882660442210427>',
  64: '<:hypesquadbravery:1473881595864678440>',
  128: '<:hypesquadbrilliance:1473881744817000659>',
  256: '<:hypesquadbalance:1473881504307220511>',
  512: '<:earlysupporter:1473882912268091488>',
  16384: '<:discordgoldbughunter:1473882602824794143>',
  131072: '<:earlyverifiedbotdeveloper:1473882442367504447>',
  4194304: '<:certifiedmoderator:1473882369676279848>',
  16777216: '<:activedeveloperbadge:1473882513360420995>'
};

function buildBadges(profile, isGuildOwner) {
  const apiBadges = profile.badges || [];
  const guildBadges = profile.guild_badges || [];
  const publicFlags = (profile.user && profile.user.public_flags) || 0;

  const result = [];
  const seen = new Set();
  const LEAF_ICON = 'ca105ad9cfc8580c765101d17bbb2323';

  for (const b of apiBadges) {
    if (seen.has(b.id)) continue;
    seen.add(b.id);

    if (b.icon === LEAF_ICON) {
      result.push('<:leaf:1544903900576878663>');
      continue;
    }

    const emoji = BADGE_EMOJI[b.id];

    if (emoji) {
      result.push(emoji);
    } else {
      const hashEmoji = b.icon ? ICON_HASH_EMOJI[b.icon] : null;

      if (hashEmoji) {
        result.push(hashEmoji);
      } else if (b.icon) {
        result.push(
          '[' + b.description + '](https://cdn.discordapp.com/badge-icons/' + b.icon + '.png)'
        );
      } else {
        result.push(b.description || b.id);
      }
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

      if (!covered) {
        seen.add(key);
        result.push(emoji);
      }
    }
  }

  if (isGuildOwner) {
    result.push('<:owner:1473884235113824286>');
  }

  return result.join(' ');
}

/* =====================================================
 * FETCH
 * ===================================================== */

async function fetchWithTimeout(url, options = {}, timeout = 7000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);

    if (!res.ok) {
      console.error('[fetchWithTimeout] HTTP', res.status, url);
      return null;
    }

    return await res.json();
  } catch (e) {
    clearTimeout(id);
    console.error('[fetchWithTimeout]', e.message);
    return null;
  }
}

async function fetchUserProfile(userId) {
  return await fetchWithTimeout(
    'https://discord.com/api/v10/users/' +
      userId +
      '/profile?with_mutual_guilds=false&with_mutual_friends_count=false',
    {
      headers: {
        Authorization: SELF_TOKEN,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    }
  );
}

function wrapRawUser(raw) {
  return {
    id: raw.id,
    username: raw.username,
    global_name: raw.global_name,
    discriminator: raw.discriminator || '0',
    createdTimestamp: Number((BigInt(raw.id) >> 22n) + 1420070400000n),
    avatarDecorationData: raw.avatar_decoration_data || null,

    displayAvatarURL: function (opts) {
      opts = opts || {};

      if (!raw.avatar) {
        const idx =
          raw.discriminator === '0' || !raw.discriminator
            ? Number((BigInt(raw.id) >> 22n) % 6n)
            : Number(raw.discriminator) % 5;

        return 'https://cdn.discordapp.com/embed/avatars/' + idx + '.png';
      }

      const ext = opts.dynamic && raw.avatar.startsWith('a_') ? 'gif' : 'png';

      return (
        'https://cdn.discordapp.com/avatars/' +
        raw.id + '/' + raw.avatar + '.' + ext +
        '?size=' + (opts.size || 1024)
      );
    },

    flags: { toArray: () => [] }
  };
}

async function fetchUserDirect(userId, profile) {
  userId = String(userId);

  const u = await self.users
    .fetch(userId, { force: true })
    .catch(e => {
      console.error('[self.users.fetch]', e.message);
      return null;
    });
  if (u) return u;

  const b = await bot.users
    .fetch(userId, { force: true })
    .catch(e => {
      console.error('[bot.users.fetch]', e.message);
      return null;
    });
  if (b) return b;

  if (profile && profile.user && profile.user.id) {
    return wrapRawUser(profile.user);
  }

  return null;
}

async function getEffectUrl(effectSkuId) {
  if (!effectSkuId) return null;

  try {
    const data = await fetchWithTimeout(
      'https://discord.com/api/v10/store/published-listings/skus/' + effectSkuId,
      {
        headers: {
          Authorization: SELF_TOKEN,
          'User-Agent': 'Mozilla/5.0'
        }
      }
    );

    if (!data) {
      console.log('[EFFECT SKU] No se pudo obtener el SKU');
      return null;
    }

    const item =
      data.sku?.tenant_metadata?.collectibles?.item ||
      data.tenant_metadata?.collectibles?.item ||
      null;

    if (!item) {
      console.log('[EFFECT] No se encontró tenant_metadata.collectibles.item');
      return null;
    }

    if (Array.isArray(item.effects) && item.effects.length > 0) {
      const effect = item.effects[0];
      if (effect?.src) return effect.src;
    }

    if (item.static_frame_src) return item.static_frame_src;
    if (item.thumbnail_preview_src) return item.thumbnail_preview_src;

    return null;
  } catch (e) {
    console.error('[getEffectUrl]', e.message);
    return null;
  }
}

/* =====================================================
 * /UID (registrar el /uid para que sirva como slash tambien )
 * ===================================================== */

bot.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName !== 'uid') return;

  await interaction.deferReply();

  const targetUser = interaction.options.getUser('usuario') || interaction.user;

  try {
    const user = targetUser;
    const profile = await fetchUserProfile(targetUser.id);
    const guild = interaction.guild;

    const isGuildOwner = guild ? guild.ownerId === targetUser.id : false;

    const member = guild
      ? guild.members.cache.get(targetUser.id) ||
        (await guild.members.fetch(targetUser.id).catch(() => null))
      : null;

    const joinedTimestamp = member ? member.joinedTimestamp : null;

    const profileEffect =
      profile?.user_profile?.profile_effect ||
      profile?.user?.profile_effect ||
      profile?.profile_effect ||
      null;

    const effectUrl = await getEffectUrl(profileEffect?.sku_id || null);

    const badgesStr = profile ? buildBadges(profile, isGuildOwner) : '';

    bot.emit('selfData', {
      channelId: interaction.channel.id,
      ownerId: interaction.user.id,
      user,
      profile,
      effectUrl,
      joinedTimestamp,
      badgesStr,
      interaction
    });
  } catch (error) {
    console.error('[UID] Error:', error);

    if (interaction.deferred || interaction.replied) {
      await interaction
        .editReply({ content: 'Ocurrió un error al obtener la información del usuario.' })
        .catch(() => {});
    }
  }
});

/* =====================================================
 * !UID
 * ===================================================== */

self.on('messageCreate', async message => {
  try {
    if (!message.content) return;

    const prefixUsed = PREFIXES.find(p => message.content.startsWith(p));
    if (!prefixUsed) return;

    const args = message.content.slice(prefixUsed.length).trim().split(/\s+/);
    const command = (args[0] || '').toLowerCase();

    if (command !== 'uid') return;

    const now = Date.now();
    const authorId = message.author.id;

    if (cooldowns.has(authorId) && now < cooldowns.get(authorId) + COOLDOWN_MS) {
      return;
    }

    cooldowns.set(authorId, now);

    console.log('[!UID] comando recibido de', message.author.tag);

    const targetId =
      message.mentions.users.first()?.id ||
      (args[1] && /^\d{15,25}$/.test(args[1]) ? args[1] : null) ||
      message.author.id;

    const profile = await fetchUserProfile(targetId);

    const user = await fetchUserDirect(targetId, profile);

    if (!user) {
      console.error('[!UID] No se pudo obtener el usuario', targetId);
      return;
    }

    console.log('[!UID] user:', user.id, '| perfil:', profile ? 'ok' : 'null');

    const guild = message.guild;
    const isGuildOwner = guild ? guild.ownerId === targetId : false;

    const member = guild
      ? guild.members.cache.get(targetId) ||
        (await guild.members.fetch(targetId).catch(() => null))
      : null;

    const joinedTimestamp = member ? member.joinedTimestamp : null;

    const profileEffect =
      profile?.user_profile?.profile_effect ||
      profile?.user?.profile_effect ||
      profile?.profile_effect ||
      null;

    const effectUrl = await getEffectUrl(profileEffect?.sku_id || null);

    const badgesStr = profile ? buildBadges(profile, isGuildOwner) : '';

    console.log('[!UID] emitiendo selfData');

    bot.emit('selfData', {
      channelId: message.channel.id,
      messageId: message.id,
      ownerId: message.author.id,
      user,
      profile,
      effectUrl,
      joinedTimestamp,
      badgesStr,
      interaction: null
    });
  } catch (error) {
    console.error('[!UID] Error:', error);
  }
});

/* =====================================================
 * BOTONES
 * ===================================================== */

bot.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const customId = interaction.customId;
  if (!customId.startsWith('uid_')) return;

  const parts = customId.split('_');
  const type = parts[1];
  const uidKey = parts.slice(2).join('_');

  const stored = uidButtonData.get(uidKey);

  if (!stored) {
    await interaction
      .reply({
        content: 'Esta consulta de /uid ya expiró.',
        flags: MessageFlags.Ephemeral
      })
      .catch(() => {});
    return;
  }

  if (interaction.user.id !== stored.ownerId) {
    await interaction
      .reply({
        content: 'Estos botones pertenecen a otra consulta de /uid.',
        flags: MessageFlags.Ephemeral
      })
      .catch(() => {});
    return;
  }

  const DENY = '<:deny:1544852330799964222> ';

  try {
    let content = null;

    if (type === 'avatar') {
      content = '**Avatar de ' + stored.displayName + ':**\n' + stored.avatarUrl;
    } else if (type === 'banner') {
      content = stored.bannerUrl
        ? '**Banner de ' + stored.displayName + ':**\n' + stored.bannerUrl
        : DENY + 'Este usuario no tiene banner disponible.';
    } else if (type === 'deco') {
      content = stored.decoUrl
        ? '**Decoración de ' + stored.displayName + ':**\n' + stored.decoUrl
        : DENY + 'Este usuario no tiene decoración disponible.';
    } else if (type === 'effect') {
      content = stored.effectUrl
        ? '**Efecto de ' + stored.displayName + ':**\n' + stored.effectUrl
        : DENY + 'Este usuario no tiene efecto disponible.';
    } else if (type === 'placa') {
      content = stored.placaFinal
        ? '**Placa de ' + stored.displayName + ':**\n' + stored.placaFinal
        : DENY + 'Este usuario no tiene placa disponible.';
    }

    if (content) {
      await interaction
        .reply({ content, flags: MessageFlags.Ephemeral })
        .catch(() => {});
    }
  } catch (error) {
    console.error('[UID BUTTON]', error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction
        .reply({
          content: DENY + 'Ocurrió un error al procesar este botón.',
          flags: MessageFlags.Ephemeral
        })
        .catch(() => {});
    }
  }
});

/* =====================================================
 * CREAR EMBED
 * ===================================================== */

async function handleSelfData(data) {
  const {
    user,
    profile,
    effectUrl,
    joinedTimestamp,
    badgesStr,
    interaction,
    channelId,
    messageId,
    ownerId
  } = data;

  const displayName =
    profile?.user?.global_name || user.global_name || user.username;

  const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 4096 });

  const clan = profile?.user?.clan || profile?.user?.primary_guild || null;
  const clanTag = clan?.tag || null;
  const clanGuildId = clan?.identity_guild_id || null;
  const clanBadge = clan?.badge || null;

  const clanBadgeUrl =
    clanGuildId && clanBadge
      ? 'https://cdn.discordapp.com/clan-badges/' + clanGuildId + '/' + clanBadge + '.png'
      : null;

  const premiumSince = profile?.premium_since || null;

  const nitroDuration = premiumSince
    ? msToTime(Date.now() - new Date(premiumSince).getTime())
    : null;

  const { badgeEmoji: nitroBadgeEmoji, nextBadge } = getNitroBadgeInfo(premiumSince);

  const decoAsset =
    profile?.user?.avatar_decoration_data?.asset ||
    user.avatarDecorationData?.asset ||
    null;

  const decoUrl = decoAsset
    ? 'https://cdn.discordapp.com/avatar-decoration-presets/' + decoAsset + '.png'
    : null;

  const nameplateAsset = profile?.user?.collectibles?.nameplate?.asset || null;

  const nameplateUrl = nameplateAsset
    ? 'https://cdn.discordapp.com/assets/collectibles/' + nameplateAsset + 'asset.webm'
    : null;

  const nameplatePng = nameplateAsset
    ? 'https://cdn.discordapp.com/assets/collectibles/' + nameplateAsset + 'asset_thumbnail.png'
    : null;

  const bannerHash = profile?.user_profile?.banner || profile?.user?.banner || null;

  const bannerUrl = bannerHash
    ? 'https://cdn.discordapp.com/banners/' +
      user.id + '/' + bannerHash + '.' +
      (bannerHash.startsWith('a_') ? 'gif' : 'png') +
      '?size=4096'
    : null;

  const userBio = profile?.user_profile?.bio || null;

  const legacyUsername =
    profile?.legacy_username || profile?.user?.legacy_username || null;

  const createdTs = '<t:' + Math.floor(user.createdTimestamp / 1000) + ':R>';

  const joinedTs = joinedTimestamp
    ? '<t:' + Math.floor(joinedTimestamp / 1000) + ':R>'
    : 'No disponible';

  let nitroValue = 'Sin Nitro';

  if (premiumSince) {
    const nitroLines = [
      (nitroBadgeEmoji || DEFAULT_NITRO_EMOJI) + ' `hace ' + nitroDuration + '`'
    ];

    if (nextBadge) {
      nitroLines.push(
        (nextBadge.emoji ? nextBadge.emoji + ' ' : '') +
          '`faltan ' + nextBadge.timeLeft + '` · <t:' + nextBadge.ts + ':F>'
      );
    }

    nitroValue = nitroLines.join('\n');
  }

  const description = user.username + (badgesStr ? ' \u2022 ' + badgesStr : '');

  const placaFinal = nameplateUrl || nameplatePng;

  const enlaceItems = [
    '[Avatar](' + avatarUrl + ')',
    decoUrl ? '[Deco](' + decoUrl + ')' : null,
    placaFinal ? '[Placa](' + placaFinal + ')' : null,
    bannerUrl ? '[Banner](' + bannerUrl + ')' : null,
    effectUrl ? '[Efect](' + effectUrl + ')' : null
  ].filter(Boolean);

  const uidKey = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  const mkBtn = (id, label) =>
    new ButtonBuilder()
      .setCustomId('uid_' + id + '_' + uidKey)
      .setLabel(label)
      .setStyle(ButtonStyle.Secondary);

  const buttons = [mkBtn('avatar', 'Avatar')];
  if (bannerUrl) buttons.push(mkBtn('banner', 'Banner'));
  if (decoUrl) buttons.push(mkBtn('deco', 'Deco'));
  if (effectUrl) buttons.push(mkBtn('effect', 'Efect'));
  if (placaFinal) buttons.push(mkBtn('placa', 'Placa'));

  const buttonRows = [new ActionRowBuilder().addComponents(buttons)];

  uidButtonData.set(uidKey, {
    ownerId: interaction?.user?.id || ownerId || null,
    userId: user.id,
    displayName,
    avatarUrl,
    bannerUrl,
    decoUrl,
    effectUrl,
    placaFinal
  });

  const fields = [
    { name: 'Tenencia de Nitro', value: nitroValue, inline: false },

    ...(userBio
      ? [{ name: 'Descripcion', value: userBio, inline: false }]
      : []),

    ...(legacyUsername
      ? [{ name: 'Alias OG', value: '`' + legacyUsername + '`', inline: true }]
      : []),

    { name: 'Creado', value: createdTs, inline: true },
    { name: 'Unido', value: joinedTs, inline: true },
    { name: 'Enlaces', value: enlaceItems.join('\n'), inline: true }
  ];


  const safeFields = fields
    .filter(f => f.name && f.value && String(f.value).trim())
    .slice(0, 25)
    .map(f => ({
      name: clamp(f.name, 256),
      value: clamp(f.value, 1024),
      inline: !!f.inline
    }));

  const embed = new EmbedBuilder()
    .setColor(0x3b453d)
    .setAuthor({
      name: clamp(displayName + ' (' + user.id + ')', 256),
      iconURL: avatarUrl
    })
    .setThumbnail(avatarUrl)
    .setDescription(clamp(description, 4096))
    .addFields(safeFields);

  if (clanTag) {
    embed.setFooter({
      text: clamp(clanTag, 2048),
      iconURL: clanBadgeUrl || undefined
    });
  }

  let sentMessage = null;

  try {
    if (interaction) {
      sentMessage = await interaction.editReply({
        embeds: [embed],
        components: buttonRows
      });
    } else {
      const ch = await bot.channels.fetch(channelId).catch(() => null);

      if (!ch) {
        console.error(
          '[UID] El bot no puede ver el canal',
          channelId,
          '(¿el bot está en ese servidor y tiene permisos?)'
        );
        uidButtonData.delete(uidKey);
        return;
      }

      sentMessage = await ch.send({
        embeds: [embed],
        components: buttonRows,
        reply: messageId
          ? { messageReference: messageId, failIfNotExists: false }
          : undefined,
        allowedMentions: { repliedUser: false }
      });
    }
  } catch (error) {
    console.error('[UID] Error enviando embed:', error);
    uidButtonData.delete(uidKey);
    return;
  }


  setTimeout(async () => {
    try {
      if (!sentMessage) return;

      const disabledRows = buttonRows.map(
        row =>
          new ActionRowBuilder().addComponents(
            row.components.map(c => ButtonBuilder.from(c).setDisabled(true))
          )
      );

      if (interaction) {
        await interaction.editReply({ components: disabledRows });
      } else {
        await sentMessage.edit({ components: disabledRows });
      }
    } catch (error) {
      console.error('[UID BUTTON TIMEOUT]', error.message);
    } finally {
      uidButtonData.delete(uidKey);
    }
  }, UID_BUTTON_TIMEOUT);
}

bot.on('selfData', async data => {
  try {
    await handleSelfData(data);
  } catch (e) {
    console.error('[selfData] ERROR:', e);

    if (data.interaction) {
      await data.interaction
        .editReply({ content: 'Ocurrió un error al crear el embed.' })
        .catch(() => {});
    }
  }
});

/* =====================================================
 * LOGIN SELF
 * ===================================================== */

self
  .login(SELF_TOKEN)
  .then(() => console.log('Selfbot listo -> ' + self.user.tag))
  .catch(error => console.error('[SELF LOGIN]', error.message));

/* =====================================================
 * LOGIN BOT
 * ===================================================== */

bot.once('clientReady', () => console.log('Bot listo -> ' + bot.user.tag));

bot.login(BOT_TOKEN).catch(error => console.error('[BOT LOGIN]', error.message));