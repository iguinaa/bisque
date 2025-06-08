#!/bin/bash

# Download Sample Audio Script
# Downloads a sample "wow" sound for testing

echo "🎵 Downloading Sample Audio File"
echo "================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Create sounds directory if it doesn't exist
mkdir -p assets/sounds

# Remove placeholder file if it exists
if [ -f "assets/sounds/wow.mp3" ]; then
    file_size=$(stat -f%z "assets/sounds/wow.mp3" 2>/dev/null || stat -c%s "assets/sounds/wow.mp3" 2>/dev/null)
    if [ "$file_size" -lt 1000 ]; then
        echo "🗑️  Removing placeholder file..."
        rm "assets/sounds/wow.mp3"
    fi
fi

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo "❌ Error: curl is required to download sample files"
    exit 1
fi

echo "🌐 Downloading sample 'wow' sound effect..."

# Try to download a sample sound file from a free source
# Note: In a real scenario, you'd want to use a file you have rights to use
SAMPLE_URL="https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav"

# Download to a temporary file first
curl -L -o "assets/sounds/temp_audio.wav" "$SAMPLE_URL" 2>/dev/null

if [ $? -eq 0 ] && [ -f "assets/sounds/temp_audio.wav" ]; then
    # Convert to MP3 if ffmpeg is available
    if command -v ffmpeg &> /dev/null; then
        echo "🔄 Converting to MP3..."
        ffmpeg -i "assets/sounds/temp_audio.wav" -acodec mp3 -ab 128k "assets/sounds/wow.mp3" -y &>/dev/null
        rm "assets/sounds/temp_audio.wav"
        
        if [ -f "assets/sounds/wow.mp3" ]; then
            echo "✅ Sample audio file downloaded successfully!"
            echo "📁 Location: assets/sounds/wow.mp3"
            file_size=$(stat -f%z "assets/sounds/wow.mp3" 2>/dev/null || stat -c%s "assets/sounds/wow.mp3" 2>/dev/null)
            echo "📏 File size: ${file_size} bytes"
        else
            echo "❌ Failed to convert audio file"
        fi
    else
        # Keep as WAV if no ffmpeg
        mv "assets/sounds/temp_audio.wav" "assets/sounds/wow.wav"
        echo "✅ Sample audio file downloaded as WAV!"
        echo "📁 Location: assets/sounds/wow.wav"
        echo "💡 Update config to use wow.wav instead of wow.mp3"
    fi
else
    echo "⚠️  Could not download sample file automatically."
    echo ""
    echo "Manual options:"
    echo "1. Download any short audio file and save as assets/sounds/wow.mp3"
    echo "2. Record a 'wow' sound and save it there"
    echo "3. Use YouTube-dl to extract audio from a video"
    echo "4. Download from freesound.org"
    echo ""
    echo "For now, the bot will simulate the sound effect in console logs."
fi

echo ""
echo "🚀 You can now test with: npm start"
echo "Use '!voice test' in Discord to test the audio"
