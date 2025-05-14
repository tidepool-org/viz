# syntax=docker/dockerfile:experimental

### Stage: Base image
FROM node:20.8.0-alpine as base
WORKDIR /app
RUN corepack enable \
  && yarn set version 3.6.4 \
  && mkdir -p dist node_modules .yarn/cache && chown -R node:node .


### Stage: Test
FROM base as test
ENV \
  CHROME_BIN=/usr/bin/chromium-browser \
  NODE_ENV=test
USER root
RUN apk add --no-cache chromium && rm -rf /var/cache/apk/* /tmp/*
USER node
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=yarn.lock,target=yarn.lock \
    --mount=type=bind,source=.yarnrc.yml,target=.yarnrc.yml \
    --mount=type=cache,target=.yarn/cache,uid=1000,gid=1000 \
    yarn install --immutable
COPY . .
RUN npm run test


### Stage 1 - Base image for development image to install and configure Chromium for unit tests
FROM base as developbase
RUN \
  echo "http://dl-cdn.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories \
  && echo "http://dl-cdn.alpinelinux.org/alpine/edge/main" >> /etc/apk/repositories \
  && echo "http://dl-cdn.alpinelinux.org/alpine/edge/testing" >> /etc/apk/repositories \
  && apk --no-cache  update \
  && apk --no-cache  upgrade \
  && apk add --no-cache git fontconfig bash udev ttf-opensans chromium \
  && rm -rf /var/cache/apk/* /tmp/*
ENV \
  CHROME_BIN=/usr/bin/chromium-browser \
  NODE_ENV=development


### Stage 2 - Create cached `node_modules`
# Only rebuild layer if `package.json` has changed
FROM base as dependencies
RUN apk --no-cache update \
  && apk --no-cache upgrade \
  && apk add --no-cache git
COPY package.json .
COPY yarn.lock .
COPY .yarnrc.yml .
RUN yarn plugin import workspace-tools && yarn workspaces focus --production


### Stage 3 - Development root with Chromium installed for unit tests
FROM developbase as develop
WORKDIR /app
USER node
# Copy all `node_modules` from dependancies layer
COPY --chown=node:node --from=dependencies /app/node_modules ./node_modules
# Copy source files
COPY --chown=node:node . .
EXPOSE 8082 8083
VOLUME ["/app", "/app/node_modules", "/app/dist"]
CMD ["npm", "start"]
