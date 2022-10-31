FROM alpine:3.16.2 AS base

ENV NODE_ENV=production \
    APP_PATH=/node/app

EXPOSE 3333

WORKDIR $APP_PATH

RUN apk add --no-cache --update nodejs=16.17.1-r0 yarn=1.22.19-r0

COPY package.json .

RUN yarn install --production && yarn cache clean

FROM base as builder

COPY . .

RUN yarn install --production=false && yarn build

FROM base

COPY --from=builder $APP_PATH/dist ./dist

CMD [ "yarn", "start" ]

