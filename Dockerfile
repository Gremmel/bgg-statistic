# FROM node:12-alpine
FROM node:18
ENV NODE_ENV production
WORKDIR /usr/src/app

# COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
# COPY [".npmrc", "package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]

## !nur für x86 image
COPY . .

WORKDIR /usr/src/app/server

RUN npm install --production && npm cache clean --force

EXPOSE 3000
CMD node app.js
#CMD /bin/sh