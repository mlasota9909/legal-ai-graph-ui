#!/usr/bin/env bash
set -euo pipefail

MODEL_ID="${MODEL_ID:-nvidia/Qwen3.6-35B-A3B-NVFP4}"
PORT="${PORT:-8000}"
TENSOR_PARALLEL_SIZE="${TENSOR_PARALLEL_SIZE:-1}"
PIPELINE_PARALLEL_SIZE="${PIPELINE_PARALLEL_SIZE:-1}"
MAX_MODEL_LEN="${MAX_MODEL_LEN:-32768}"
GPU_MEMORY_UTILIZATION="${GPU_MEMORY_UTILIZATION:-0.92}"
MAX_NUM_SEQS="${MAX_NUM_SEQS:-8}"
MAX_NUM_BATCHED_TOKENS="${MAX_NUM_BATCHED_TOKENS:-32768}"
SERVED_MODEL_NAME="${SERVED_MODEL_NAME:-qwen25-32b-instruct-awq}"

cat <<EOF
VLLM_ALLOW_LONG_MAX_MODEL_LEN=1 \\
vllm serve ${MODEL_ID} \\
  --port ${PORT} \\
  --served-model-name ${SERVED_MODEL_NAME} \\
  --trust-remote-code \\
  --tensor-parallel-size ${TENSOR_PARALLEL_SIZE} \\
  --pipeline-parallel-size ${PIPELINE_PARALLEL_SIZE} \\
  --max-model-len ${MAX_MODEL_LEN} \\
  --gpu-memory-utilization ${GPU_MEMORY_UTILIZATION} \\
  --max-num-batched-tokens ${MAX_NUM_BATCHED_TOKENS} \\
  --max-num-seqs ${MAX_NUM_SEQS} \\
  --kv-cache-dtype fp8 \\
  --enable-chunked-prefill \\
  --enable-auto-tool-choice --tool-call-parser hermes \\
  --reasoning-parser qwen3 \\
  --language-model-only
EOF
