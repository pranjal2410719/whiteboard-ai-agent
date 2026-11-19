# Developer's Guide to Gemini 3.8 Live

**Gemini 3.8 Live** (`gemini-3.8-live`) is a real-time conversational model built for low-latency bidirectional voice and video interactions and face-to-face Live Avatar synthesis. Designed for continuous conversational workflows, 3.8 Live provides default-enabled affective dialogue, proactive audio filtering, auto-canceling blocking tools, and dynamic multilingual switching.

---

## Role in the Gemini Family

3.8 Live is designed for **real-time streaming interactions**. It operates across bidirectional WebSockets, processing speech, live camera feeds, and screen broadcasts with sub-second latency while generating 24 kHz audio and synchronized 24 FPS video avatars. It also supports standard `GenerateContent` REST API and structured Function Calling.

### Model Specifications & Comparisons

| Attribute | Gemini 3.8 Live | Gemini 2.5 Flash Live API Native Audio (GA baseline) |
|---|---|---|
| **Model ID** | `gemini-3.8-live` | `gemini-live-2.5-flash-native-audio` |
| **Launch Stage** | General Availability (GA) | General Availability (GA) |
| **Input Modalities** | Audio (16 kHz PCM), video (1 FPS JPEG), text | Audio (16 kHz PCM), video (1 FPS JPEG), text |
| **Output Modalities** | Audio (24 kHz PCM), video (24 FPS MP4 Live Avatar), text | Audio (24 kHz PCM), text |
| **Live Avatar Synthesis** | 24 FPS synchronized video output | Unsupported |
| **Affective Dialogue** | Enabled by default | Requires explicit configuration |
| **Proactive Audio** | Enabled by default | Requires explicit configuration |
| **Function Calling Execution** | Asynchronous non-blocking & auto-canceling blocking (`behavior="BLOCKING"`) | Asynchronous and synchronous |
| **Barge-in Handling** | Polite interruption downgrade (waits when user speaks) | Immediate interruption (can overlap user audio) |
| **Language Support** | Dynamic mid-stream switching across supported languages | Supported languages |
| **Domain Biasing** | Supports `custom_vocabulary` in `AudioTranscriptionConfig` | Standard baseline transcription |
| **Visual Token Control** | Configurable `media_resolution` (`LOW`, `MEDIUM`, `HIGH`) | Fixed per-frame token budget |

### When to Use Gemini 3.8 Live

- **Low conversational latency & natural turn-taking**: Fast recovery when the user interrupts (barge-in).
- **Non-blocking external tool execution**: Audio output continues while backend systems process tool requests.
- **Talking digital avatars**: Synchronized 24 FPS video with facial animation and lip-syncing without external rendering pipelines.
- **Dynamic multilingual switching**: Detects and switches languages mid-stream without restarting sessions.
- **Domain-specific vocabulary biasing**: Better recognition of technical terminology, formulas, and domain entities.

---

## Key Capabilities

1. **24 FPS Live Avatar Video Synthesis**:
   - Generates synchronized 24 FPS MP4 video streams (`response_modalities=["VIDEO"]`) directly aligned with synthesized speech.
   - Supports prebuilt stock avatars or custom reference images for virtual tutors, concierges, and interactive characters.

2. **Default-Enabled Affective Dialogue & Proactive Audio**:
   - **Affective Dialogue**: Adjusts vocal tone, conversational pacing, and inflection from user acoustic prosody and pauses.
   - **Proactive Audio**: Filters ambient noise and background voices, answering only when directly addressed.

3. **Asynchronous and Auto-Canceling Blocking Function Calling**:
   - **Non-blocking Asynchronous Execution**: The audio stream remains active with spoken acknowledgments while client apps execute tool calls.
   - **Auto-canceling Blocking Calls (`behavior="BLOCKING"`)**: Generation pauses until tool output arrives; if the user speaks in the meantime, pending calls auto-cancel.
   - **Polite Interruption Handling**: Downgrades tool response scheduling from `INTERRUPT` to `WHEN_IDLE` when user speech is detected.

4. **Dynamic Multilingual Switching & Custom Vocabulary**:
   - Detects mid-session language shifts without reconnection.
   - `custom_vocabulary` in `AudioTranscriptionConfig` optimizes recognition for specialized keywords and terms.

5. **Multimodal Visual Grounding**:
   - Accepts 1 FPS video streams (768×768 resolution).
   - Configurable `media_resolution` (`MEDIA_RESOLUTION_LOW`, `MEDIA_RESOLUTION_MEDIUM`, `MEDIA_RESOLUTION_HIGH`).

---

## Python SDK Quickstart

### Installation

```bash
pip install --upgrade google-genai websockets numpy
```

### Bidirectional Session with Asynchronous Tool Calling

```python
import asyncio
from google import genai
from google.genai import types

PROJECT_ID = "YOUR_PROJECT_ID"
LOCATION = "us-central1"
MODEL_ID = "gemini-3.8-live"

# Initialize the Gen AI client for enterprise
client = genai.Client(enterprise=True, project=PROJECT_ID, location=LOCATION)

# Define a tool for asynchronous execution
order_lookup_tool = types.FunctionDeclaration(
    name="lookup_order_status",
    description="Fetches real-time shipping status for a customer order ID.",
    parameters=types.Schema(
        type="OBJECT",
        properties={
            "order_id": types.Schema(
                type="STRING",
                description="The order ID, for example, ORD-8472",
            ),
        },
        required=["order_id"],
    ),
)

# Configure the live connection
config = types.LiveConnectConfig(
    response_modalities=["AUDIO"],
    system_instruction=types.Content(
        parts=[
            types.Part.from_text(
                text=(
                    "You are an enterprise concierge. When you call a tool, "
                    "briefly acknowledge the request and tell the user what you're doing. "
                    "If a tool returns no results, inform the user before trying again. "
                    "Never issue more than two consecutive tool calls without speaking."
                )
            )
        ]
    ),
    speech_config=types.SpeechConfig(
        voice_config=types.VoiceConfig(
            prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name="Aoede")
        ),
    ),
    input_audio_transcription=types.AudioTranscriptionConfig(
        custom_vocabulary=["ORD-8472", "Gemini Live", "Express Shipping"]
    ),
    output_audio_transcription=types.AudioTranscriptionConfig(),
    tools=[types.Tool(function_declarations=[order_lookup_tool])],
)

async def handle_tool_call(session, function_call):
    """Executes backend calls asynchronously without blocking incoming audio."""
    order_id = function_call.args.get("order_id", "")
    await asyncio.sleep(2.0)  # Simulate backend latency

    if not order_id.startswith("ORD-"):
        result = {
            "status": "invalid_argument",
            "retryable": False,
            "message": f"Order ID '{order_id}' is invalid. Ask the user to verify.",
        }
    else:
        result = {
            "status": "ok",
            "retryable": False,
            "order_id": order_id,
            "shipping_status": "Out for delivery by 4:00 PM",
        }

    # Send tool response matching the call ID
    await session.send_tool_response(
        function_responses=[
            types.FunctionResponse(
                id=function_call.id,
                name=function_call.name,
                response=result,
            )
        ]
    )

async def main():
    async with client.aio.live.connect(model=MODEL_ID, config=config) as session:
        print(f"Connected to {MODEL_ID}")

        # Send initial text or stream 16 kHz PCM audio chunks
        await session.send_realtime_input(
            text="Hi! Can you check the status of order ORD-8472?"
        )

        async for message in session.receive():
            if message.tool_call:
                for call in message.tool_call.function_calls:
                    asyncio.create_task(handle_tool_call(session, call))

            if message.server_content:
                if (
                    message.server_content.output_transcription
                    and message.server_content.output_transcription.text
                ):
                    print(
                        f"Agent: {message.server_content.output_transcription.text}",
                        end="",
                        flush=True,
                    )

if __name__ == "__main__":
    asyncio.run(main())
```

---

## Required API Rules and Conventions

1. **Informative Function Responses**:
   - Avoid returning `{}` or `None`. Provide structured responses:
     - `status`: Machine-readable status string (e.g. `"ok"`, `"no_results"`, `"invalid_argument"`).
     - `retryable`: Set `false` when repeating the call returns the same result.
     - `message` / `guidance`: Status text to explain to the user.
2. **Prompt-Level Tool Retry Limits**:
   - In `system_instruction`, cap consecutive tool calls at two.
3. **Strict `FunctionResponse` Matching**:
   - Every `FunctionResponse` must supply the exact `id` from the preceding `FunctionCall`.
4. **Streaming Audio Formats**:
   - **Input audio**: 16 kHz, 16-bit, little-endian, mono PCM (`audio/pcm;rate=16000`), streamed in 20 ms to 100 ms chunks.
   - **Output audio**: 24 kHz mono PCM.
5. **Removed Legacy Parameters**:
   - Do not pass `enable_affective_dialog` or `proactivity` (enabled by default in 3.8 Live).
6. **Seeding Conversation History**:
   - When using `send_client_content`, wait for `setup_complete` and set `HistoryConfig(initial_history_in_client_content=True)`.

---

## Developer Checklist

- [x] Target Model ID: `gemini-3.8-live`
- [x] Return structured tool responses containing `status`, `retryable`, and `message` fields.
- [x] Include retry policy in `system_instruction` capping consecutive tool calls at 2.
- [x] Remove legacy `enable_affective_dialog` and `proactivity` flags.
- [x] Audio formats: 16 kHz PCM input, 24 kHz PCM output.
- [x] Add custom terminology to `custom_vocabulary` in `AudioTranscriptionConfig`.
