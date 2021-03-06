FROM mhart/alpine-node:base-6
# FROM mhart/alpine-node:base-0.10
# FROM mhart/alpine-node

ENV REDIS_URL redis://redis:6379
ENV admin U02615Q0J
ENV NODE_ENV production

WORKDIR /src
ADD . .

# If you have native dependencies, you'll need extra tools
# RUN apk add --no-cache make gcc g++ python

# If you need npm, don't use a base tag
# RUN npm install

CMD ["node", "app/bot.js"]