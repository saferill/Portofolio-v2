FROM node:20-bookworm-slim

# Install Python and FFmpeg for yt-dlp audio streaming
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Node dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Install Python requirements (yt-dlp)
COPY requirements.txt ./
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

# Copy all project files
COPY . .

# Set Port
ENV PORT=3000
EXPOSE 3000

# Start server
CMD ["node", "server.mjs"]
