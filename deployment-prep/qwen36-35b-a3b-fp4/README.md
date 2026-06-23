# Qwen3.6-35B-A3B-NVFP4 vLLM deployment prep

Replaces Qwen2.5-32B-Instruct-AWQ on Alienware (RTX 5090 32 GB GDDR7, sm_12.0).
GB10 / GPT-OSS-120B is unchanged.

## Model

- Repo: `nvidia/Qwen3.6-35B-A3B-NVFP4` (gated — HF token required)
- Fallback: `Qwen/Qwen3.6-35B-A3B-FP8` (public — if NVFP4 not supported by installed vLLM)
- Architecture: Mixture of Experts, ~3.5B active parameters (A3B) out of 35B total
- Format: NVFP4 (NVIDIA proprietary FP4, requires vLLM >= 0.8.0 with Blackwell kernel support)

## Production deployment settings

| Flag | Value | Reason |
|---|---|---|
| --served-model-name | qwen25-32b-instruct-awq | Keeps all docker-compose model refs valid — no compose changes |
| --max-model-len | 32768 | Conservative baseline matching retired model; increase to 65536 for coding-agent use after benchmarking |
| --gpu-memory-utilization | 0.92 | FP4 weights ~18 GB, leaves ~10 GB KV headroom; raise to 0.95 once stable |
| --max-num-batched-tokens | 32768 | Legal doc segments 2K–8K tokens × 8 concurrent seqs |
| --max-num-seqs | 8 | 2× prior model; scale to 16 only after KV budget confirmed |
| --kv-cache-dtype | fp8 | Compact KV; important with longer context targets |
| --enable-chunked-prefill | yes | Efficient for variable-length legal doc segments |
| --enable-auto-tool-choice | yes | Required for JSON structured extraction |
| --tool-call-parser | hermes | Pairs with auto-tool-choice |
| --reasoning-parser | qwen3 | Strips <think> blocks; returns clean final response in content field |
| --language-model-only | yes | Text-only workload |

## VRAM budget (32 GB GDDR7)

- NVFP4 weights: ~18 GB
- Runtime overhead: ~1–2 GB
- KV cache at 0.92 util: ~9–11 GB
- At max_model_len=32768, 8 seqs, fp8: ~4–5 GB — fits with headroom
- Do NOT attempt max_model_len=131072 with num_seqs > 2 — KV budget exceeded

## Reasoning model warning

Qwen3.6 is a thinking/reasoning model. For structured JSON extraction (chronology, people),
add `/no_think` to the system prompt or set `enable_thinking: false` in the request
`extra_body` to disable thinking mode. This prevents thinking-chain contamination of JSON output.
The `--reasoning-parser qwen3` flag strips `<think>...</think>` blocks from the final response;
test with actual extraction prompts before enabling in production.

## Pre-flight checklist

1. Verify vLLM version: `docker run --rm vllm/vllm-openai:latest python -c "from vllm import __version__; print(__version__)"`  (need >= 0.8.0)
2. Stage model: run `source-models.sh` from `../qwen36-35b-a3b/` (reads HF token from `documentation/hf_token.cfg`)
3. Print command: `bash print-vllm-command.sh`
4. Wrap in docker run (see ARCHITECTURE.LOCK.md Alienware section for full docker run command)
5. Health check: `curl http://alienware:8010/v1/models`
6. Single-doc extraction test: run one manual chronology rerun, inspect raw LLM response for repeated JSON blocks
7. Benchmark: compare tok/s against retired Qwen2.5-32B-AWQ baseline (~103 tok/s on 71-page/16-segment run)

## No test command

These are documentation/config files only. No pytest required.

## End of T302 documentation changes
