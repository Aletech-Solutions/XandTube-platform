#!/bin/bash
# Setup script for XandTube Channel Tracking Jobs

echo "🚀 Setting up XandTube Channel Tracking Jobs..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed. Please install Python 3.8 or later."
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
REQUIRED_VERSION="3.8"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Python 3.8 or later is required. Current version: $PYTHON_VERSION"
    exit 1
fi

echo "✅ Python $PYTHON_VERSION detected"

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "📦 Virtual environment already exists"
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️ Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📋 Installing Python dependencies..."
pip install -r requirements.txt

echo "✅ Dependencies installed successfully"

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p ../videos/downloads
mkdir -p ../videos/metadata

echo "✅ Directories created"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚙️ Creating .env file from template..."
    cp .env.example .env
    echo "📝 Please edit .env file with your database credentials"
else
    echo "⚙️ .env file already exists"
fi

# Check if yt-dlp is installed
if ! command -v yt-dlp &> /dev/null; then
    echo "⚠️ WARNING: yt-dlp is not installed globally"
    echo "   You can install it with: pip install yt-dlp"
    echo "   Or the jobs will try to use the system's yt-dlp"
else
    echo "✅ yt-dlp found: $(yt-dlp --version)"
fi

# Make scheduler executable
chmod +x scheduler.py

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your database credentials"
echo "2. Ensure yt-dlp is installed: pip install yt-dlp"
echo "3. Test the job: python3 scheduler.py --test-run"
echo "4. Start the scheduler: python3 scheduler.py"
echo ""
echo "📚 For more information, see the documentation in README.md"