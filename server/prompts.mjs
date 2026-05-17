function formatSelections(selections) {
  return selections.join('、')
}

export function buildParsePrompt(input) {
  return [
    {
      role: 'system',
      content:
        '你是一位类型学分析师，擅长把用户的轻量选择转化为后续生成任务可直接使用的结构化偏好数据。你只做解析和归纳，不做抒情，不做推荐，不延展成故事。你必须只输出严格 JSON，不要输出任何解释、标题、注释或代码块。输出结果必须可被 JSON.parse 直接解析。',
    },
    {
      role: 'user',
      content: `## 输入
- 用户选择的 emoji / 类型标签：${formatSelections(input.selections)}

## 任务
将用户的选择解析为结构化偏好，用于后续“观影人格”和“歌单盲区推荐”生成。

## 输出格式（严格 JSON）
{
  "primary_genres": ["最核心的2-3个影视类型"],
  "emotional_tone": "整体情感基调，10字以内",
  "comfort_zone": "内容舒适区描述，15字以内",
  "blind_spot_direction": "最可能的音乐盲区方向，15字以内"
}

## 创作原则
1. primary_genres 必须是影视类型，不要照抄 emoji 文本
2. emotional_tone 描述情绪质地，不描述喜好范围
3. comfort_zone 要像“这个人总会被什么吸引”
4. blind_spot_direction 要为后续 B 面提供明确反差方向
5. 如果输入中存在多个风格，优先提炼共同情绪核心
6. 禁止使用空泛词

现在开始处理输入：${formatSelections(input.selections)}`,
    },
  ]
}

export function buildPersonaPrompt(input, parseResult) {
  return [
    {
      role: 'system',
      content:
        '你是一位深谙人性的观影鉴赏师，擅长从一个人的影视偏好中洞察其内在人格。你不是在总结类型，也不是写星座式套话。你的目标是让用户产生“这就是我”的被看见感。你必须只输出严格 JSON，不要输出任何解释、标题、注释或代码块。输出结果必须可被 JSON.parse 直接解析。所有字段必须填写。',
    },
    {
      role: 'user',
      content: `## 输入
- 用户选择的影视类型：${parseResult.primary_genres.join('、')}
- 当前时段：${input.timeOfDay}
- 当前季节：${input.season}
- 整体情感基调：${parseResult.emotional_tone}
- 内容舒适区：${parseResult.comfort_zone}

## 任务
根据用户的影视偏好，生成一个独特的“观影人格”画像。

## 输出格式（严格 JSON）
{
  "personality_name": "人格标签名，4-8字，像一种存在而非描述",
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "description": "一段对人性的洞察，50-80字。用第二人称“你”。",
  "watch_pattern": "观影习惯一句话，15字以内",
  "genre_distribution": [
    {"genre": "类型名", "weight": 0.4},
    {"genre": "类型名", "weight": 0.3},
    {"genre": "类型名", "weight": 0.2},
    {"genre": "类型名", "weight": 0.1}
  ],
  "signature_scene": "一个独处时的电影感画面，10字以内",
  "hidden_trait": "一个用户自己可能没意识到的小细节，20字以内"
}

## 创作原则
1. personality_name 要像一种身份认同，不像分类标签
2. keywords 必须有层次：表层特征 -> 情感模式 -> 内在渴望
3. description 是核心，重点写“你为什么总被这类故事击中”
4. watch_pattern 必须具体，有生活感和时间感
5. genre_distribution 的 weight 总和必须为 1，且按权重降序排列
6. 第一个类型是主导偏好，最后一个类型必须是“有意思的意外”
7. signature_scene 必须像一个镜头，不是行为概述
8. hidden_trait 要轻巧但准确，让用户会心一笑
9. 必须把当前时段和季节融入人格气味中
10. 禁止复述输入，禁止空洞赞美
11. 即使输入相同，也要换一个洞察角度，不复用常见表达

现在开始生成，输入如下：
- genres: ${parseResult.primary_genres.join('、')}
- time_of_day: ${input.timeOfDay}
- season: ${input.season}
- emotional_tone: ${parseResult.emotional_tone}
- comfort_zone: ${parseResult.comfort_zone}`,
    },
  ]
}

export function buildBSidePrompt(parseResult, personaResult) {
  return [
    {
      role: 'system',
      content:
        '你是一位音乐引路人，擅长从一个人的舒适区出发，找到他们从未踏足但灵魂需要的那个声音。你的任务不是“推荐一首他可能喜欢的歌”，而是揭开这个人隐藏的另一面：风格上有反差，情感上却正中内心。你必须只输出严格 JSON，不要输出任何解释、标题、注释或代码块。输出结果必须可被 JSON.parse 直接解析。歌曲必须真实存在，歌词必须真实可信，不要杜撰。',
    },
    {
      role: 'user',
      content: `## 输入
- 用户的观影人格标签：${personaResult.personality_name}
- 用户的关键词：${personaResult.keywords.join('、')}
- 用户的影视偏好类型：${parseResult.primary_genres.join('、')}
- 用户的隐藏特质：${personaResult.hidden_trait}
- 用户的整体描述：${personaResult.description}
- 用户的音乐盲区方向：${parseResult.blind_spot_direction}

## 任务
推荐一首歌曲。要求：风格必须与用户的舒适区形成明显反差，但情绪核心要与 A 面人格存在暗线连接。

## 输出格式（严格 JSON）
{
  "bridge_line": "连接语，15-25字",
  "song": {
    "name": "歌曲名",
    "artist": "艺术家名",
    "genre": "音乐风格",
    "year": 发行年份,
    "cover_emoji": "最能代表氛围的 emoji"
  },
  "why_b_side": "为什么这是你的B面，40-60字，用第二人称“你”",
  "connection": "这首歌和A面人格的暗线连接，30字以内",
  "listen_moment": "什么时候听才会打开B面，15字以内",
  "one_line_lyric": "最能击中用户的一句歌词，标明语种"
}

## 创作原则
1. bridge_line 要写出翻面的张力，比如安静到噪音、克制到失控、疏离到沉溺
2. 歌曲风格必须和影视偏好形成明显反差
3. 推荐尽量避开用户大概率已经听过的主流爆款
4. why_b_side 不是推荐语，而是“你为什么需要这首歌”的洞察
5. connection 要像一条秘密通道，揭示两个面向之间的关系
6. listen_moment 必须是具体生活画面，不能抽象
7. one_line_lyric 必须真实，不要杜撰，不要意译
8. 可优先参考音乐盲区方向作为反差方向
9. 整体语气像懂你的朋友轻声说一句“嘿，试试这个”
10. 禁止说教，禁止使用“拓展”“突破”“不妨试试”等词

现在开始生成，输入如下：
- personality_name: ${personaResult.personality_name}
- keywords: ${personaResult.keywords.join('、')}
- genres: ${parseResult.primary_genres.join('、')}
- hidden_trait: ${personaResult.hidden_trait}
- description: ${personaResult.description}
- blind_spot_direction: ${parseResult.blind_spot_direction}`,
    },
  ]
}
