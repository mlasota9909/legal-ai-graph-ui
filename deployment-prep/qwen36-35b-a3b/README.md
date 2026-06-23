# Qwen3.6-35B-A3B source prep

This folder prepares both model variants you asked for on the Alienware host:

- `nvidia/Qwen3.6-35B-A3B-NVFP4`
- `Qwen/Qwen3.6-35B-A3B-FP8`

It only downloads and stages model artifacts. It does not start vLLM or deploy a server.

## Requirements

- A working Python environment with `huggingface_hub` installed.
- Access to the token file at `/home/mlasota/legal-ai/documentation/hf_token.cfg`.

## Usage

Run `source-models.sh` on the Alienware host to download both repos into a local cache directory.

By default the script writes to a `.hf-cache/` folder next to this README. Override `CACHE_DIR` if you want a different staging location.

## Notes

- The token file is read locally by the script and never printed.
- The FP4 repo is gated, so the token is required there.
- The FP8 repo is public, but the same authenticated flow keeps the setup consistent.