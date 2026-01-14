module.exports = {
  // Lint and format TypeScript/JavaScript files
  "*.{ts,tsx,js,jsx}": [
    "eslint --fix",
    "prettier --write",
  ],
  
  // Format other files
  "*.{json,md,yml,yaml}": [
    "prettier --write",
  ],
  
  // Type check TypeScript files
  "*.{ts,tsx}": [
    "bash -c 'tsc --noEmit'",
  ],
};
