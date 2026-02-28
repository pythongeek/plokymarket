# Dockerfile for Google Cloud Run with Vertex AI Agent support
FROM node:20-slim

# Install dependencies
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build the Next.js app
RUN npm run build

# Expose port
EXPOSE 8080

# Set environment variables for Vertex AI
ENV PORT=8080
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
