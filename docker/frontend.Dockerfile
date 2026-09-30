FROM node:22-alpine@sha256:0a7108bf6c7bf5de370ffb1a3ed6be93d405b43ff159f681a8d18c0e2bc2e402 AS build
WORKDIR /app
COPY . /app
RUN corepack enable && yarn install --frozen-lockfile
RUN yarn build

FROM nginx:alpine@sha256:df221db836e1754089190208cee7eeda94f233197056426eda74a43ab1abeac2
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=integration docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
