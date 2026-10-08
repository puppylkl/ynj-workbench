# -*- coding: utf-8 -*-
import io, os

base = '/root/clacky_workspace/ynj-workbench/js'
app_path = os.path.join(base, 'app.js')
src = io.open(app_path, encoding='utf-8').read()
new_math = io.open('/root/clacky_workspace/ynj-workbench/_math_section.js', encoding='utf-8').read()

start_marker = '/* ================= 数学 ================= */'
end_marker = '/* ================= 英语 ================= */'
i = src.index(start_marker)
j = src.index(end_marker)
src = src[:i] + new_math + src[j:]

# 小改动：英语页副标题
src = src.replace('pageHead("🔤","英语小课堂","每天 5 句日常对话 + 5 个单词")',
                  'pageHead("🔤","英语小课堂","每天 5 句 + 5 词：先听、再跟读，磨耳朵最重要")')
# 语文页副标题
src = src.replace('pageHead("📖","语文乐园","每天 15 分钟：古诗 · 成语 · 识字 · 拼音 · 写字")',
                  'pageHead("📖","语文乐园","每天 20 分钟：古诗 · 成语 · 识字 · 拼音 · 笔顺 · 阅读")')
# 首页每日一句
src = src.replace('const tips = ["每天进步一点点，坚持就是胜利！","认真学习的小朋友最可爱！","做完任务就能攒积分换奖励哦！","多喝水，多运动，身体棒棒！"];',
                  'const tips = ["每天进步一点点，坚持就是胜利！","上课认真听讲，作业自己完成！","做完任务就能攒积分换奖励哦！","多喝水，多运动，眼睛也要休息哦！"];')
# 备份文件名
src = src.replace('a.download = "幼小衔接工作台备份-" + YXJ.todayStr() + ".json";',
                  'a.download = "一年级学习工作台备份-" + YXJ.todayStr() + ".json";')
# 关于
old_about = '幼小衔接工作台 V1.0<br>为 5~6 岁小朋友设计：语文 15 分钟 + 数学 10 分钟 + 英语 10 分钟 + 运动 1 小时 + 游戏 10 分钟。<br>\n    内容库每日自动轮换，进度保存在本机浏览器中。'
new_about = '一年级学习工作台 V1.0<br>按一年级课程编排：语文 20 分钟（古诗 · 成语 · 识字 · 拼音 · 笔顺 · 阅读）+ 数学 15 分钟（口算 · 100 以内加减 · 钟表 · 人民币）+ 英语 10 分钟 + 运动 1 小时 + 游戏 10 分钟。<br>\n    生字库 140 字（部编版一上写字表 + 一下核心），古诗 21 首，英语词汇 100+；每日内容自动轮换，进度保存在本机浏览器中。'
assert old_about in src, 'about text not found'
src = src.replace(old_about, new_about)

io.open(app_path, 'w', encoding='utf-8').write(src)
print('app.js patched, size', len(src))
print('genQ present:', 'function genQ(mode)' in src, '| clockQuiz:', 'function clockQuiz' in src, '| moneyQuiz:', 'function moneyQuiz' in src)
