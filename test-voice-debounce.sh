#!/bin/bash

# Voice Greeter Test Script
# This script demonstrates the debounce functionality

echo "🎵 Voice Greeter Debounce Test"
echo "=============================="
echo ""

if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "Testing the voice greeter debounce functionality:"
echo ""
echo "1. Make sure your bot is running and connected to Discord"
echo "2. Join a voice channel"
echo "3. Run '!voice test' to verify sound works"
echo "4. Have multiple friends join the same voice channel within 1.5 seconds"
echo "5. Observe that only ONE sound plays despite multiple joins"
echo ""
echo "Expected behavior:"
echo "✅ Bot joins when first person enters"
echo "✅ Sound plays for every new user"
echo "✅ Multiple rapid joins = only one sound (debounced)"
echo "✅ Users joining >1.5s apart = separate sounds"
echo "✅ Bot leaves when channel becomes empty"
echo ""
echo "Debug commands:"
echo "- '!voice status' - See active connections and cooldowns"
echo "- Check console logs for detailed join/leave events"
echo ""
echo "Configuration (edit src/features/voice-greeter-config.js):"
echo "- soundDebounceDelay: 1500ms (adjust to change debounce timing)"
echo "- playForEveryUser: true (play for all users, not just 2nd)"
echo "- debugMode: true (enable console logging)"
echo ""
echo "🚀 Happy testing!"
