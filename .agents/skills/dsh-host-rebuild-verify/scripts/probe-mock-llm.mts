// 一次性 mock LLM server：只服务 chat-completions，用来跑真 dsh 而不花 token。
// 由探针脚本自动复制到 <repo>/apps/cli/xi-probe-mock.mts（只有该目录能解析
// @deepseek-ai/* 的 workspace 依赖），跑完删除。不要提交它。
//
// 可用环境变量（都有默认值，沿用旧行为）：
//   XI_MOCK_TEXT             返回的文本（默认 'MOCK-REPLY 端到端标记'）
//   XI_MOCK_BEHAVIOR         success（默认）| slow_success
//   XI_MOCK_CHUNK_DELAY_MS   slow_success 每块之间的间隔（默认 25）
//   XI_MOCK_CHUNK_SIZE       每块的码点数（默认 8；调小能让一个回合持续更久）
import { writeFileSync } from 'node:fs'
import { startMockLlmServer } from '@deepseek-ai/dsh-llm-mock-server'

const server = await startMockLlmServer({
  sequence: [(process.env.XI_MOCK_BEHAVIOR ?? 'success') as 'success'],
  repeatLast: true, // 第二条 prompt 也需要脚本，否则 mock 报 script_exhausted
  successText: process.env.XI_MOCK_TEXT ?? 'MOCK-REPLY 端到端标记',
  chunkDelayMs: Number(process.env.XI_MOCK_CHUNK_DELAY_MS ?? '25'),
  chunkSize: Number(process.env.XI_MOCK_CHUNK_SIZE ?? '8'),
})

// 把 base URL 写给探针（它据此设置 DEEPSEEK_BASE_URL）。
writeFileSync(process.env.XI_MOCK_URL_FILE!, server.baseURL)

// 周期性把「收到的请求体」落盘：续接是否真的带着上一轮上下文，就靠这个证据。
setInterval(() => {
  writeFileSync(
    process.env.XI_MOCK_DUMP!,
    JSON.stringify(server.requests.map(r => ({ attempt: r.attempt, body: r.body }))),
  )
}, 200)

setInterval(() => {}, 1 << 30)
