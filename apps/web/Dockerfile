FROM node:24-alpine AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json ./

COPY apps/web/package.json apps/web/package.json

RUN pnpm install --frozen-lockfile --ignore-scripts

COPY apps/web apps/web

RUN pnpm exec vite build --config apps/web/vite.config.mts


FROM nginx:alpine AS runtime

COPY --from=build /workspace/apps/web/dist /usr/share/nginx/html

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]