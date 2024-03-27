#!/bin/bash

set -e

pnpm migrate
pnpm check:connect
node ./packages/backend/built/boot/entry.js
