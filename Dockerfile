FROM node:20-bullseye-slim

# Install system dependencies including ffmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy application source
COPY . .

# Build Vite frontend
RUN npm run build

# Default environment variables
ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

# Start server
CMD ["npm", "run", "start"]
