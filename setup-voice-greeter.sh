#!/bin/bash

# Voice Greeter Setup Script
# This script helps set up the voice greeter feature with a sample sound file

echo "🎵 Voice Greeter Setup"
echo "====================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Create sounds directory if it doesn't exist
mkdir -p assets/sounds

# Check if wow.mp3 already exists and is a real audio file
if [ -f "assets/sounds/wow.mp3" ] && [ -s "assets/sounds/wow.mp3" ]; then
    file_size=$(stat -f%z "assets/sounds/wow.mp3" 2>/dev/null || stat -c%s "assets/sounds/wow.mp3" 2>/dev/null)
    if [ "$file_size" -gt 1000 ]; then
        echo "✅ Sound file already exists: assets/sounds/wow.mp3"
        echo "📏 File size: ${file_size} bytes"
        exit 0
    fi
fi

echo "🔍 Looking for a sample 'wow' sound file..."

# Try to download a sample sound file (this is just an example - you'd need a real URL)
echo "📝 Instructions to add your own sound file:"
echo ""
echo "1. Find a 'wow' sound effect you like:"
echo "   - Search 'anime wow sound effect' on freesound.org"
echo "   - Use YouTube-dl to extract audio from videos"
echo "   - Record your own 'wow' sound"
echo ""
echo "2. Convert it to MP3 format if needed:"
echo "   - Use online converters or ffmpeg"
echo "   - Keep it short (1-3 seconds)"
echo "   - Keep file size under 1MB"
echo ""
echo "3. Save it as: assets/sounds/wow.mp3"
echo ""
echo "4. Test it with: npm start"
echo "   Then use '!voice test' command in Discord"
echo ""
echo "⚠️  Note: Make sure you have proper rights to use any sound files!"

# Create a placeholder file if none exists
if [ ! -f "assets/sounds/wow.mp3" ]; then
    echo "Creating placeholder file..."
    echo "# This is a placeholder - replace with actual audio file" > assets/sounds/wow.mp3
fi

echo ""
echo "🚀 Voice Greeter is ready to configure!"
echo "   Edit src/features/voice-greeter-config.js to customize behavior"
