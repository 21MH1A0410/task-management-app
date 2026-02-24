# Base Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install production dependencies
RUN npm install --production

# Copy source code (respecting .dockerignore)
COPY . .

# Expose port (Google Cloud Run default is 8080)
EXPOSE 8080

# Environment variable for port
ENV PORT=8080

# Run the application
CMD ["npm", "start"]
