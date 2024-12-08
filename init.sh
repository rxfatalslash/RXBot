#!/bin/bash

# Commands deployment
echo "Deploying commands..."
node deploy-commands.js

# Bot initialization
echo "Initializing bot..."
node index.js