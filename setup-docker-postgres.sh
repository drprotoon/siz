#!/bin/bash

# Exit on error
set -e

echo "Setting up PostgreSQL database with Docker..."

# Start PostgreSQL container
echo "Starting PostgreSQL container..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 10

# Check if PostgreSQL is ready
echo "Checking if PostgreSQL is ready..."
docker exec siz_cosmeticos_postgres pg_isready -h localhost -U postgres || {
  echo "PostgreSQL is not ready yet. Waiting another 10 seconds..."
  sleep 10
  docker exec siz_cosmeticos_postgres pg_isready -h localhost -U postgres || {
    echo "PostgreSQL failed to start. Please check the logs."
    docker-compose logs postgres
    exit 1
  }
}

# Install dependencies
echo "Installing dependencies..."
npm install

# Run database setup script
echo "Running database setup script..."
npx tsx scripts/setup-database.ts

# Run database seed script
echo "Running database seed script..."
npx tsx scripts/seed-database.ts

echo "PostgreSQL database setup completed successfully!"
