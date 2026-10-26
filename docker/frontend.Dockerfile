FROM node:24-alpine@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53 AS build
WORKDIR /app
COPY . /app
RUN corepack enable && pnpm install --frozen-lockfile
RUN pnpm build

FROM nginx:alpine@sha256:df221db836e1754089190208cee7eeda94f233197056426eda74a43ab1abeac2
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=integration docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
