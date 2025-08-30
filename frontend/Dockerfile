# Use official Node image
FROM node:20-alpine

# Set work directory
WORKDIR /app

# Install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source code
COPY frontend/ .

# Expose React port
EXPOSE 3000

# Run React development server
CMD ["npm", "start"]