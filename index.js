const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder
} = require("discord.js");

const cron = require("node-cron");
const fs = require("fs");

// ================================
// CẤU HÌNH
// ================================

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const OWNER_ID = process.env.OWNER_ID;

const CHANNEL_THONG_TIN = process.env.CHANNEL_THONG_TIN;
const CHANNEL_CHIA_SE = process.env.CHANNEL_CHIA_SE;
const CHANNEL_CHAT_SET = process.env.CHANNEL_CHAT_SET;

if (
  !TOKEN || !CLIENT_ID || !GUILD_ID || !OWNER_ID ||
  !CHANNEL_THONG_TIN || !CHANNEL_CHIA_SE || !CHANNEL_CHAT_SET
) {
  throw new Error("Thiếu cấu hình trong Environment Variables!");
}

// ================================
// DỮ LIỆU
// ================================

const DATA_FILE = "./data.json";

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return {
      links: [],
      announcements: "Chưa có thông báo.",
      rules: "Chưa có nội quy."
    };
  }
}

let data = loadData();

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

if (!fs.existsSync(DATA_FILE)) {
  saveData();
}

// ================================
// DISCORD CLIENT
// ================================

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

async function getChannel(id) {
  const channel = await client.channels.fetch(id);

  if (!channel || !channel.isTextBased()) {
    throw new Error("Không tìm thấy kênh hoặc kênh không hỗ trợ tin nhắn.");
  }

  return channel;
}

function isOwner(userId) {
  return userId === OWNER_ID;
}

// ================================
// MENU CHÍNH
// ================================

function mainMenu() {
  const embed = new EmbedBuilder()
    .setColor("#5865F2")
    .setTitle("🔗 TRUNG TÂM CHIA SẺ")
    .setDescription(
      "Chào mừng đến với trung tâm chia sẻ!\n\n" +
      "Hãy chọn một mục bên dưới để tiếp tục."
    )
    .addFields(
      { name: "🔗 Liên kết", value: "Danh sách đường link", inline: true },
      { name: "📢 Thông báo", value: "Thông tin server", inline: true },
      { name: "📜 Nội quy", value: "Quy định server", inline: true },
      { name: "🤖 Lệnh bot", value: "Các lệnh hiện có", inline: true }
    )
    .setFooter({ text: "SERVER CONTROL PANEL" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("links")
      .setLabel("Liên kết")
      .setEmoji("🔗")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("announcements")
      .setLabel("Thông báo")
      .setEmoji("📢")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("rules")
      .setLabel("Nội quy")
      .setEmoji("📜")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("commands")
      .setLabel("Lệnh bot")
      .setEmoji("🤖")
      .setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row] };
}

// ================================
// MENU HỒ SƠ VÂN
// ================================

function vanMenu() {
  const embed = new EmbedBuilder()
    .setColor("#FF69B4")
    .setTitle("👤 HỒ SƠ THÀNH VIÊN")
    .setDescription("Thông tin thành viên Vân")
    .addFields(
      { name: "Tên", value: "Vân", inline: true },
      { name: "Biệt danh", value: "Vân ngu", inline: true },
      { name: "Năm sinh", value: "2012", inline: true },
      { name: "Người yêu", value: "Chí chó", inline: true }
    )
    .setFooter({ text: "HỒ SƠ VÂN" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("van_personal")
      .setLabel("Thông tin cá nhân")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("van_other")
      .setLabel("Thông tin khác")
      .setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row] };
}

// ================================
// LỆNH DISCORD
// ================================

const commands = [
  new SlashCommandBuilder()
    .setName("menu")
    .setDescription("Mở trung tâm chia sẻ"),

  new SlashCommandBuilder()
    .setName("van")
    .setDescription("Mở hồ sơ Vân hoặc chọn câu trả lời")
    .addIntegerOption(option =>
      option
        .setName("so")
        .setDescription("Chọn câu trả lời 1, 2 hoặc 3")
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(3)
    )
].map(command => command.toJSON());

// ================================
// ĐĂNG KÝ LỆNH
// ================================

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );

  console.log("Đã đăng ký lệnh Discord!");
}

// ================================
// BOT ONLINE
// ================================

client.once("ready", async () => {
  console.log(`Bot online: ${client.user.tag}`);

  try {
    await registerCommands();
  } catch (error) {
    console.error("Lỗi đăng ký lệnh:", error);
  }
});

// ================================
// LỜI CHÚC 23:00
// ================================

cron.schedule(
  "0 23 * * *",
  async () => {
    try {
      const channel = await getChannel(CHANNEL_CHAT_SET);

      await channel.send(
        "Các con của bố ngủ ngon ❤️"
      );

      console.log("Đã gửi lời chúc ngủ ngon!");
    } catch (error) {
      console.error("Lỗi gửi lời chúc:", error);
    }
  },
  {
    timezone: "Asia/Ho_Chi_Minh"
  }
);

// ================================
// NÚT QUẢN TRỊ RIÊNG
// ================================

function adminMenu() {
  const embed = new EmbedBuilder()
    .setColor("#ED4245")
    .setTitle("⚙️ QUẢN TRỊ MENU")
    .setDescription("Chọn thao tác quản lý liên kết.");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("add_link")
      .setLabel("Thêm link")
      .setEmoji("➕")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("delete_link")
      .setLabel("Xóa link")
      .setEmoji("🗑️")
      .setStyle(ButtonStyle.Danger)
  );

  return { embeds: [embed], components: [row] };
}

// ================================
// XỬ LÝ LỆNH VÀ NÚT
// ================================

client.on("interactionCreate", async interaction => {
  try {

    // ---------- SLASH COMMAND ----------

    if (interaction.isChatInputCommand()) {

      // MENU
      if (interaction.commandName === "menu") {

        if (interaction.channelId !== CHANNEL_CHIA_SE) {
          return interaction.reply({
            content: "Hãy sử dụng /menu trong kênh #chia-se.",
            ephemeral: true
          });
        }

        await interaction.deferReply({ ephemeral: true });

        const channel = await getChannel(CHANNEL_CHIA_SE);
        await channel.send(mainMenu());

        if (isOwner(interaction.user.id)) {
          await interaction.editReply({
            content: "Đã mở menu! Đây là bảng quản trị riêng của m.",
            ...adminMenu()
          });
        } else {
          await interaction.editReply({
            content: "Đã mở menu chia sẻ!"
          });
        }
      }

      // VAN
      if (interaction.commandName === "van") {

        const number = interaction.options.getInteger("so");

        // Các câu trả lời trong chat-set
        if (number !== null) {

          if (interaction.channelId !== CHANNEL_CHAT_SET) {
            return interaction.reply({
              content: "Các lựa chọn /van số chỉ dùng trong #chat-set.",
              ephemeral: true
            });
          }

          const answers = {
            1: "Vân hợi",
            2: "Chí rất óc",
            3: "Vân óc"
          };

          await interaction.reply({
            content: answers[number]
          });
          return;
        }

        // Hồ sơ Vân
        await interaction.deferReply({ ephemeral: true });

        const channel = await getChannel(CHANNEL_THONG_TIN);
        await channel.send(vanMenu());

        await interaction.editReply({
          content: "Đã mở hồ sơ Vân trong #thong-tin!"
        });
      }
    }

    // ---------- BUTTON ----------

    if (interaction.isButton()) {

      const id = interaction.customId;

      // Menu chia sẻ
      if (id === "links") {
        const description = data.links.length
          ? data.links.map((link, i) =>
              `**${i + 1}. ${link.name}**\n${link.url}`
            ).join("\n\n")
          : "Chưa có đường link nào.";

        const embed = new EmbedBuilder()
          .setColor("#5865F2")
          .setTitle("🔗 DANH SÁCH LIÊN KẾT")
          .setDescription(description);

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("back_menu")
            .setLabel("Quay lại")
            .setEmoji("⬅️")
            .setStyle(ButtonStyle.Secondary)
        );

        return interaction.update({
          embeds: [embed],
          components: [row]
        });
      }

      if (id === "announcements") {
        const embed = new EmbedBuilder()
          .setColor("#FEE75C")
          .setTitle("📢 THÔNG BÁO")
          .setDescription(data.announcements);

        return interaction.update({
          embeds: [embed],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("back_menu")
                .setLabel("Quay lại")
                .setStyle(ButtonStyle.Secondary)
            )
          ]
        });
      }

      if (id === "rules") {
        const embed = new EmbedBuilder()
          .setColor("#57F287")
          .setTitle("📜 NỘI QUY")
          .setDescription(data.rules);

        return interaction.update({
          embeds: [embed],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("back_menu")
                .setLabel("Quay lại")
                .setStyle(ButtonStyle.Secondary)
            )
          ]
        });
      }

      if (id === "commands") {
        const embed = new EmbedBuilder()
          .setColor("#5865F2")
          .setTitle("🤖 DANH SÁCH LỆNH")
          .setDescription(
            "`/menu` - Mở menu chia sẻ\n" +
            "`/van` - Mở hồ sơ Vân\n" +
            "`/van` với tùy chọn số - Câu trả lời riêng"
          );

        return interaction.update({
          embeds: [embed],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("back_menu")
                .setLabel("Quay lại")
                .setStyle(ButtonStyle.Secondary)
            )
          ]
        });
      }

      if (id === "back_menu") {
        return interaction.update(mainMenu());
      }

      // Menu Vân
      if (id === "van_personal") {
        const embed = new EmbedBuilder()
          .setColor("#FF69B4")
          .setTitle("👤 THÔNG TIN CÁ NHÂN")
          .addFields(
            { name: "Tên", value: "Vân" },
            { name: "Biệt danh", value: "hợi" },
            { name: "Năm sinh", value: "2012" }
          );

        return interaction.update({
          embeds: [embed],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("van_back")
                .setLabel("Quay lại")
                .setStyle(ButtonStyle.Secondary)
            )
          ]
        });
      }

      if (id === "van_other") {
        const embed = new EmbedBuilder()
          .setColor("#FF69B4")
          .setTitle("💗 THÔNG TIN KHÁC")
          .addFields({
            name: "Người yêu",
            value: "Chí chó nghiện thuốc"
          });

        return interaction.update({
          embeds: [embed],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("van_back")
                .setLabel("Quay lại")
                .setStyle(ButtonStyle.Secondary)
            )
          ]
        });
      }

      if (id === "van_back") {
        return interaction.update(vanMenu());
      }

      // Quản trị
      if (id === "add_link" || id === "delete_link") {

        if (!isOwner(interaction.user.id)) {
          return interaction.reply({
            content: "M không có quyền quản trị!",
            ephemeral: true
          });
        }

        if (id === "add_link") {
          const modal = new ModalBuilder()
            .setCustomId("link_modal")
            .setTitle("Thêm đường link");

          const name = new TextInputBuilder()
            .setCustomId("link_name")
            .setLabel("Tên đường link")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          const url = new TextInputBuilder()
            .setCustomId("link_url")
            .setLabel("Địa chỉ URL")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          modal.addComponents(
            new ActionRowBuilder().addComponents(name),
            new ActionRowBuilder().addComponents(url)
          );

          return interaction.showModal(modal);
        }

        if (id === "delete_link") {

          if (data.links.length === 0) {
            return interaction.reply({
              content: "Chưa có link nào để xóa.",
              ephemeral: true
            });
          }

          const options = data.links.slice(0, 25).map((link, i) => ({
            label: link.name.slice(0, 100),
            value: String(i)
          }));

          const select = new StringSelectMenuBuilder()
            .setCustomId("remove_link")
            .setPlaceholder("Chọn link muốn xóa")
            .addOptions(options);

          return interaction.reply({
            content: "Chọn đường link muốn xóa:",
            components: [
              new ActionRowBuilder().addComponents(select)
            ],
            ephemeral: true
          });
        }
      }
    }

    // ---------- SELECT MENU ----------

    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === "remove_link"
    ) {

      if (!isOwner(interaction.user.id)) {
        return interaction.reply({
          content: "Không có quyền!",
          ephemeral: true
        });
      }

      const index = Number(interaction.values[0]);

      if (!data.links[index]) {
        return interaction.reply({
          content: "Không tìm thấy link.",
          ephemeral: true
        });
      }

      const removed = data.links.splice(index, 1)[0];
      saveData();

      return interaction.update({
        content: `Đã xóa link: **${removed.name}**`,
        components: []
      });
    }

    // ---------- MODAL ----------

    if (
      interaction.isModalSubmit() &&
      interaction.customId === "link_modal"
    ) {

      if (!isOwner(interaction.user.id)) {
        return interaction.reply({
          content: "Không có quyền!",
          ephemeral: true
        });
      }

      const name = interaction.fields.getTextInputValue("link_name");
      const url = interaction.fields.getTextInputValue("link_url");

      let parsedUrl;

      try {
        parsedUrl = new URL(url);

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          throw new Error("URL không hợp lệ");
        }
      } catch {
        return interaction.reply({
          content: "Đường link không hợp lệ. Hãy nhập link bắt đầu bằng https:// hoặc http://",
          ephemeral: true
        });
      }

      data.links.push({
        name,
        url: parsedUrl.href
      });

      saveData();

      return interaction.reply({
        content: `Đã thêm link **${name}** thành công!`,
        ephemeral: true
      });
    }

  } catch (error) {
    console.error("Lỗi interaction:", error);

    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "Đã xảy ra lỗi. Hãy thử lại sau.",
        ephemeral: true
      }).catch(() => {});
    }
  }
});

// ================================
// KHỞI ĐỘNG
// ================================

client.login(TOKEN);
