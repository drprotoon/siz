#!/bin/bash

# Exit on error
set -e

echo "Setting up PostgreSQL database..."

# Check if PostgreSQL is running
if ! pg_isready > /dev/null 2>&1; then
  echo "PostgreSQL is not running. Starting PostgreSQL..."
  # Start PostgreSQL service
  sudo service postgresql start
  sleep 2
fi

# Create database user if it doesn't exist
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='postgres'" | grep -q 1; then
  echo "Creating PostgreSQL user 'postgres'..."
  sudo -u postgres createuser -s postgres
fi

# Set password for postgres user
echo "Setting password for PostgreSQL user 'postgres'..."
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"

# Create database if it doesn't exist
if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw siz_cosmeticos; then
  echo "Creating database 'siz_cosmeticos'..."
  sudo -u postgres createdb siz_cosmeticos
fi

# Run database setup script
echo "Running database setup script..."
npx tsx scripts/setup-database.ts

# Run database seed script
echo "Running database seed script..."
npx tsx scripts/seed-database.ts

echo "PostgreSQL database setup completed successfully!"
