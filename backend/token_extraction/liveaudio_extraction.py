import pyaudio
import wave
import threading
import tkinter as tk
import subprocess
import os
from textblob import TextBlob

# Global flag to stop recording
stop_recording = False  

def record_audio(output_filename="live_audio.wav"):
    """Records audio until 'End Call' is clicked."""
    global stop_recording
    
    audio = pyaudio.PyAudio()
    stream = audio.open(format=pyaudio.paInt16, channels=1, rate=16000,
                        input=True, frames_per_buffer=1024)

    print("\U0001F3A7 Recording started... Click 'End Call' to stop.")

    frames = []
    while not stop_recording:
        data = stream.read(1024)
        frames.append(data)

    print("\u23F9 End Call button clicked. Stopping recording...")

    # Stop and save the audio
    stream.stop_stream()
    stream.close()
    audio.terminate()

    with wave.open(output_filename, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(audio.get_sample_size(pyaudio.paInt16))
        wf.setframerate(16000)
        wf.writeframes(b''.join(frames))

    print(f"\u2705 Audio saved as {output_filename}")

    # Transcribe and correct spelling
    transcription = transcribe_audio(output_filename)
    print("\U0001F4DC Transcription:", transcription)

    corrected_transcription = correct_spelling(transcription)
    print("\U0001F520 Corrected:", corrected_transcription)

def transcribe_audio(audio_file):
    """Transcribes recorded audio using DeepSpeech CLI."""
    try:
        print(f"\U0001F4C2 Loading audio file: {audio_file}")

        if not os.path.exists(audio_file):
            print("\u274C Error: Audio file not found.")
            return ""

        # Specify your DeepSpeech model and scorer file paths
        model_path = "deepspeech_model.pbmm"  # Change this to your model path
        scorer_path = "deepspeech_model.scorer"  # Change this to your scorer path

        cmd = [
            "deepspeech", "--model", model_path, "--scorer", scorer_path, "--audio", audio_file
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)
        return result.stdout.strip()

    except Exception as e:
        print("\u274C Error in transcription:", str(e))
        return ""

def correct_spelling(text):
    """Optimized spelling correction using TextBlob."""
    try:
        return str(TextBlob(text).correct())
    except Exception as e:
        print("⚠️ Error in spelling correction:", str(e))
        return text  # Return original text if correction fails

def stop_call():
    """Stops the recording when 'End Call' button is clicked."""
    global stop_recording
    stop_recording = True
    print("\u23F9 End Call button clicked. Stopping recording...")

# Create UI window
def create_ui():
    root = tk.Tk()
    root.title("Live Call Recording")

    end_button = tk.Button(root, text="End Call", command=stop_call, 
                           font=("Arial", 14), bg="red", fg="white", width=10)
    end_button.pack(pady=20)

    root.mainloop()

# Start UI in a separate thread
ui_thread = threading.Thread(target=create_ui, daemon=True)
ui_thread.start()

# Start recording in the main thread
record_audio()
