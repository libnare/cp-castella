#!/bin/bash

pnpm migrate
pnpm check:connect
node ./packages/backend/built/boot/entry.js
