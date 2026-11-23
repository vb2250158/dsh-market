export const SEARCH_SYNONYM_GROUPS = [
    // Notifications
    // 推送 (also git push) and alert are left out on purpose: two meanings.
    { terms: ['通知', 'notify', 'notification', 'notifier', '消息提醒'], broad: ['提醒', 'reminder'] },
    // Image generation
    { terms: ['生图', '画图', '绘图', '作图', '出图', '图片生成', '生成图片', '生成图', '文生图', 'image generation', 'image gen', 'imagegen', 'text2img', 'text to image'] },
    { terms: ['视频', 'video'] },
    // Chat apps
    { terms: ['飞书', 'feishu', 'lark'] },
    { terms: ['微信', 'wechat', 'weixin'] },
    { terms: ['企业微信', '企微', 'wecom'] },
    { terms: ['钉钉', 'dingtalk'] },
    { terms: ['qq', 'qqbot', 'onebot', 'napcat'] },
    // Memory
    { terms: ['记忆', '长期记忆', '记忆库', 'memory', 'long term memory'] },
    // Themes
    { terms: ['主题', '皮肤', '配色', '换肤', 'theme', 'skin', 'color scheme'] },
    // Voice
    {
        terms: ['语音', 'voice', 'speech'],
        broad: ['tts', 'stt', '朗读', '语音识别', '语音合成', 'text to speech', 'speech to text'],
    },
    { terms: ['tts', 'text to speech', '朗读', '语音合成', '文字转语音'] },
    { terms: ['stt', 'asr', 'speech to text', '语音识别', '语音转文字', '听写'] },
    // Translation
    { terms: ['翻译', 'translate', 'translation', 'translator', '双语', 'bilingual'] },
    // Search, browser, MCP
    { terms: ['搜索', '检索', 'search', '联网搜索', '网页搜索', 'web search'] },
    { terms: ['浏览器', 'browser'], broad: ['chrome', 'cdp', 'playwright', 'puppeteer', '网页自动化'] },
    { terms: ['mcp', 'model context protocol', '模型上下文协议'] },
    // Models and keys
    { terms: ['模型接入', '接入模型', '模型供应商', '模型提供商', '自定义模型', 'provider'] },
    { terms: ['api key', 'apikey', '密钥', 'api 密钥'] },
    // Cost and usage
    { terms: ['费用', '花费', '计费', '账单', 'cost', 'billing'] },
    { terms: ['用量', '额度', 'usage', 'quota'] },
    // Context
    { terms: ['上下文', '上下文窗口', 'context window', 'context'], broad: ['上下文压缩', 'context compression', 'compaction'] },
    { terms: ['上下文压缩', 'context compression', 'compaction'] },
    // Office
    { terms: ['ppt', 'pptx', 'powerpoint', '幻灯片', 'slides', '演示文稿'] },
    { terms: ['excel', 'xlsx', 'spreadsheet'] },
    { terms: ['docx', 'word 文档', 'microsoft word'] },
    { terms: ['剪贴板', 'clipboard'] },
    { terms: ['邮件', '邮箱', 'email', 'mail'] },
    { terms: ['定时', '定时任务', '计划任务', 'cron'] },
    // Developer
    { terms: ['git', '版本控制', 'version control'] },
    { terms: ['终端', 'terminal', 'shell', '命令行', 'command line'], broad: ['pty', 'tmux', 'tui'] },
    // Pets
    { terms: ['桌宠', '宠物', '桌面宠物', '看板娘', 'pet', 'mascot'], broad: ['live2d'] },
    // Mobile and remote
    { terms: ['手机', '手机端', '移动端', 'mobile', 'phone'], broad: ['pwa', 'android', 'ios'] },
    { terms: ['远程', '远程控制', '远程访问', 'remote', 'remote control'], broad: ['内网穿透', 'tunnel'] },
];
