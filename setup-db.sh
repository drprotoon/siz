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

# Install dependencies
echo "Installing dependencies..."
npm install

# Run database setup script
echo "Running database setup script..."
npx tsx scripts/setup-database.ts

# Run database seed script
echo "Running database seed script..."
npx tsx scripts/seed-database.ts

echo "Database setup completed successfully!"
