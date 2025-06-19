FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /app

# Two different styles for copying the package.json and package-lock.json
# COPY package*.json ./
COPY package.json package-lock.json ./

# Clean install of only production dependencies
RUN npm ci --only=production

# Copy application source code
COPY src/ ./src/

# Create a non-root user and switch to it.
RUN addgroup -S -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs discordbot

# Note this does actually affect runtime even if we are running with docker compose.
# It effectively acts as a default user and compose can override it.
USER discordbot

# Define the default command to run the application (can be overridden by compose)
CMD ["npm", "start"]
