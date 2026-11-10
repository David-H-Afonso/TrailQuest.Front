# syntax=docker/dockerfile:1
ARG NODE_IMAGE=node:24.22.2-bookworm-slim@sha256:01d566e8d94d8c619591d78652babfccd3c6992a3dffa9ed5ab39e11cf6c70e9
ARG NGINX_IMAGE=nginxinc/nginx-unprivileged:stable-alpine@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03
FROM --platform=$BUILDPLATFORM ${NODE_IMAGE} AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-fund --no-audit
COPY . .
ARG RELEASE_VERSION=1.0.0
ARG SOURCE_REVISION=unversioned
RUN test "$(cat VERSION)" = "$RELEASE_VERSION" && SOURCE_REVISION="$SOURCE_REVISION" npm run build

FROM ${NGINX_IMAGE} AS runtime
USER 0:0
# Same-branch, explicitly pinned security patches; return to non-root below.
RUN apk add --no-cache --upgrade \
      brotli-libs=1.2.1-r0 curl=8.23.0-r0 libcurl=8.23.0-r0 \
      libexpat=2.10.0-r0 libxslt=1.1.43-r4 \
      musl=1.2.6-r3 musl-utils=1.2.6-r3 zlib=1.4-r0
ARG RELEASE_VERSION=1.0.0
ARG SOURCE_REVISION=unversioned
LABEL org.opencontainers.image.title="TrailQuest Web" \
      org.opencontainers.image.description="Project code MIT; dependencies retain their licenses and notices" \
      org.opencontainers.image.version="$RELEASE_VERSION" \
      org.opencontainers.image.revision="$SOURCE_REVISION" \
      org.opencontainers.image.licenses="MIT"
COPY --from=build /src/dist/ /usr/share/nginx/html/
COPY deploy/nginx.conf /etc/nginx/nginx.conf
COPY deploy/default.conf.template /etc/nginx/trailquest.conf.template
COPY --chmod=755 deploy/entrypoint.sh /entrypoint.sh
COPY LICENSE THIRD_PARTY_NOTICES.md /usr/share/nginx/html/licenses/
USER 101:101
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["wget", "--quiet", "--spider", "http://127.0.0.1:8080/healthz"]
ENTRYPOINT ["/entrypoint.sh"]
