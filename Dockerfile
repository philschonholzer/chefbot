FROM mhart/alpine-node:base
# FROM mhart/alpine-node:base-0.10
# FROM mhart/alpine-node

ENV REDIS_URL redis://redis:6397
ENV channel C0XJG50EN
ENV NODE_ENV development

WORKDIR /src
ADD . .

# If you have native dependencies, you'll need extra tools
# RUN apk add --no-cache make gcc g++ python

# If you need npm, don't use a base tag
# RUN npm install

CMD ["node", "app/bot.js"]