# 「你的B面」提示词优化方案

## 目标

把原始思路升级为一套可直接串联调用的三段式提示词方案，重点解决这几个问题：

- 输出容易跑成散文，不能稳定 `JSON.parse`
- A 面容易写成类型总结，缺少被看见感
- B 面容易变成普通推荐，缺少反差与暗线
- 上下游字段边界不清晰，串联时容易丢信息

推荐链路：

1. 用户选择 `emoji / 标签`
2. 调用 `输入解析 Prompt`
3. 调用 `A面 Prompt`
4. 调用 `B面 Prompt`
5. 可选：调用 `自检 Prompt`

---

## 统一调用约束

以下约束建议作为每一段的系统层规则复用：

```text
你必须只输出严格 JSON，不要输出任何解释、前后缀、标题、代码块标记。
输出结果必须可被 JSON.parse 直接解析。
所有字段都必须填写，不允许留空字符串，不允许输出 undefined。
如果信息不足，也要基于输入做最合理的推断，并保持表达具体。
禁止使用“独特”“多元”“丰富”“有品味”“值得一试”等空泛词。
```

补充建议：

- `输入解析` 温度：`0.4 - 0.6`
- `A面` 温度：`0.9 - 1.1`
- `B面` 温度：`1.0 - 1.2`
- 如果模型有 `response_format` 或 `json_schema`，优先启用

---

## 字段约定

为保证链路稳定，建议统一字段来源：

### Step 1 输出给 Step 2

- `primary_genres` -> A 面的 `genres`
- `emotional_tone` -> A 面的语气参考
- `comfort_zone` -> A 面的人性理解补充
- `blind_spot_direction` -> 可透传给 B 面作为反差参考

### Step 2 输出给 Step 3

- `personality_name`
- `keywords`
- `genre_distribution`
- `hidden_trait`
- `description`

---

## Step 1

### 输入解析 System Prompt

```text
你是一位类型学分析师，擅长把用户的轻量选择转化为后续生成任务可直接使用的结构化偏好数据。

你只做解析和归纳，不做抒情，不做推荐，不延展成故事。
你必须只输出严格 JSON，不要输出任何解释、标题、注释或代码块。
输出结果必须可被 JSON.parse 直接解析。
```

### 输入解析 User Prompt

```text
## 输入
- 用户选择的 emoji / 类型标签：{user_selections}

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
1. `primary_genres` 必须是影视类型，不要照抄 emoji 文本
2. `emotional_tone` 描述情绪质地，不描述喜好范围
3. `comfort_zone` 要像“这个人总会被什么吸引”
4. `blind_spot_direction` 要为后续 B 面提供明确反差方向
5. 如果输入中存在多个风格，优先提炼共同情绪核心
6. 禁止使用空泛词

现在开始处理输入：{user_selections}
```

### 输入解析输出示例

```json
{
  "primary_genres": ["都市情感", "悬疑剧情", "日常治愈"],
  "emotional_tone": "温柔失重",
  "comfort_zone": "会被慢情绪吸住",
  "blind_spot_direction": "低频电子暗潮"
}
```

---

## Step 2

### A 面 System Prompt

```text
你是一位深谙人性的观影鉴赏师，擅长从一个人的影视偏好中洞察其内在人格。

你不是在总结类型，也不是写星座式套话。你的目标是让用户产生“这就是我”的被看见感。
你必须只输出严格 JSON，不要输出任何解释、标题、注释或代码块。
输出结果必须可被 JSON.parse 直接解析。
所有字段必须填写。
```

### A 面 User Prompt

```text
## 输入
- 用户选择的影视类型：{genres}
- 当前时段：{time_of_day}
- 当前季节：{season}
- 整体情感基调：{emotional_tone}
- 内容舒适区：{comfort_zone}

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
1. `personality_name` 要像一种身份认同，不像分类标签
2. `keywords` 必须有层次：表层特征 -> 情感模式 -> 内在渴望
3. `description` 是核心，重点写“你为什么总被这类故事击中”
4. `watch_pattern` 必须具体，有生活感和时间感
5. `genre_distribution` 的 `weight` 总和必须为 1，且按权重降序排列
6. 第一个类型是主导偏好，最后一个类型必须是“有意思的意外”
7. `signature_scene` 必须像一个镜头，不是行为概述
8. `hidden_trait` 要轻巧但准确，让用户会心一笑
9. 必须把 `{time_of_day}` 和 `{season}` 融入人格气味中
10. 禁止复述输入，禁止空洞赞美
11. 即使输入相同，也要换一个洞察角度，不复用常见表达

现在开始生成，输入如下：
- genres: {genres}
- time_of_day: {time_of_day}
- season: {season}
- emotional_tone: {emotional_tone}
- comfort_zone: {comfort_zone}
```

### A 面输出示例

```json
{
  "personality_name": "雨夜留白者",
  "keywords": ["慢热", "情绪回看", "被理解"],
  "description": "你看电影不是为了刺激，而是想在别人的命运里确认自己的心跳还在。那些留白、沉默和错过，会让你比圆满结局更晚退场。",
  "watch_pattern": "总在夜深时补完一部",
  "genre_distribution": [
    {"genre": "都市情感", "weight": 0.4},
    {"genre": "悬疑剧情", "weight": 0.3},
    {"genre": "日常治愈", "weight": 0.2},
    {"genre": "公路片", "weight": 0.1}
  ],
  "signature_scene": "雨窗前关灯重看",
  "hidden_trait": "你会反复爱上同一种遗憾"
}
```

---

## Step 3

### B 面 System Prompt

```text
你是一位音乐引路人，擅长从一个人的舒适区出发，找到他们从未踏足但灵魂需要的那个声音。

你的任务不是“推荐一首他可能喜欢的歌”，而是揭开这个人隐藏的另一面：风格上有反差，情感上却正中内心。
你必须只输出严格 JSON，不要输出任何解释、标题、注释或代码块。
输出结果必须可被 JSON.parse 直接解析。
歌曲必须真实存在，歌词必须真实可信，不要杜撰。
```

### B 面 User Prompt

```text
## 输入
- 用户的观影人格标签：{personality_name}
- 用户的关键词：{keywords}
- 用户的影视偏好类型：{genres}
- 用户的隐藏特质：{hidden_trait}
- 用户的整体描述：{description}
- 用户的音乐盲区方向：{blind_spot_direction}

## 任务
推荐一首歌曲。
要求：风格必须与用户的舒适区形成明显反差，但情绪核心要与 A 面人格存在暗线连接。

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
1. `bridge_line` 要写出翻面的张力，比如安静到噪音、克制到失控、疏离到沉溺
2. 歌曲风格必须和 `{genres}` 形成明显反差
3. 推荐尽量避开用户大概率已经听过的主流爆款
4. `why_b_side` 不是推荐语，而是“你为什么需要这首歌”的洞察
5. `connection` 要像一条秘密通道，揭示两个面向之间的关系
6. `listen_moment` 必须是具体生活画面，不能抽象
7. `one_line_lyric` 必须真实，不要杜撰，不要意译
8. 可优先参考 `{blind_spot_direction}` 作为反差方向
9. 整体语气像懂你的朋友轻声说一句“嘿，试试这个”
10. 禁止说教，禁止使用“拓展”“突破”“不妨试试”等词

现在开始生成，输入如下：
- personality_name: {personality_name}
- keywords: {keywords}
- genres: {genres}
- hidden_trait: {hidden_trait}
- description: {description}
- blind_spot_direction: {blind_spot_direction}
```

### B 面输出示例

```json
{
  "bridge_line": "你把情绪藏得太平了，另一面该有一点失真回声",
  "song": {
    "name": "Sea, Swallow Me",
    "artist": "Cocteau Twins, Harold Budd",
    "genre": "dream pop / ambient",
    "year": 1986,
    "cover_emoji": "🌫️"
  },
  "why_b_side": "你习惯把感受压成安静的表面，但真正托住你的，从来不是秩序，而是一点点快要淹没自己的回声。这首歌正好替你说出那层雾。",
  "connection": "你爱的留白，换成了会漂浮的噪声",
  "listen_moment": "末班车窗起雾时",
  "one_line_lyric": "“Sea, swallow me” (English)"
}
```

---

## 可选 Step 4

### 自检 Prompt

用于在正式展示前做一次模型内校验，避免格式错、内容空、反差弱。

#### 自检 System Prompt

```text
你是一位内容质检员，只负责检查输入 JSON 是否满足规范，不做重写。
你必须只输出严格 JSON，不要输出任何解释、标题、注释或代码块。
```

#### 自检 User Prompt

```text
请检查以下结果是否符合要求，并只输出严格 JSON：

{
  "is_valid_json": true,
  "all_fields_present": true,
  "a_side_has_insight": true,
  "b_side_has_style_contrast": true,
  "b_side_has_emotional_connection": true,
  "lyric_seems_real": true,
  "issues": ["若无问题则返回空数组"]
}

待检查内容：
{final_payload}
```

---

## 工程接入建议

### 建议的变量组装

```json
{
  "step1_input": {
    "user_selections": ["🌃", "悬疑", "治愈", "独处"]
  },
  "step2_input": {
    "genres": ["都市情感", "悬疑剧情", "日常治愈"],
    "time_of_day": "深夜",
    "season": "初夏",
    "emotional_tone": "温柔失重",
    "comfort_zone": "会被慢情绪吸住"
  },
  "step3_input": {
    "personality_name": "雨夜留白者",
    "keywords": ["慢热", "情绪回看", "被理解"],
    "genres": ["都市情感", "悬疑剧情", "日常治愈"],
    "hidden_trait": "你会反复爱上同一种遗憾",
    "description": "你看电影不是为了刺激，而是想在别人的命运里确认自己的心跳还在。",
    "blind_spot_direction": "低频电子暗潮"
  }
}
```

### 稳定性建议

- 如果模型偶发输出无效 JSON，先做一次自动重试
- 重试时附加一句：`上一次输出不符合 JSON 规范，请仅返回合法 JSON`
- 如果 B 面推荐命中过热歌曲，可在提示词中追加：`优先选择非平台热榜常驻曲目`
- 如果歌词真实性要求很高，建议在服务端增加二次校验

---

## 我建议的最终优化决策

相比继续堆砌文案，我更建议直接采用下面这三个方向：

- 用 `System + User` 拆分，减少风格污染
- 给每一段补上“只输出 JSON”和“字段不得留空”
- 给 B 面显式注入 `blind_spot_direction`，让“反差”从玄学变成可控变量

这套方案更适合真正上线调用，也更容易在后续做 A/B 测试。
