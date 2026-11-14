from config import TtsKind, settings
from voice.base import Voice
from voice.kokoro import KokoroVoice


def build_voice(kind: TtsKind) -> Voice:
    match kind:
        case "kokoro":
            return KokoroVoice(settings.kokoro_model_path, settings.kokoro_voices_path)
