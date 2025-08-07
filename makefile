# Frontend Makefile

# Variables
NODE_BIN = ./node_modules/.bin
PORT ?= 3000

.PHONY: install dev build start lint format test clean

# Install dependencies
install:
	npm install

# Run development server
start:
	npm start

# Build for production
build:
	npm run build

# Clean build artifacts
clean:
	rm -rf build node_modules .cache
