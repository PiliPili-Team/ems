FROM rust:1.95@sha256:f49565f188ee00bc2a18dd418183f2c5f23ef7d6e691890517ed341a598f67c3 AS build
WORKDIR /src
COPY . .
RUN cargo build --release --workspace --locked

FROM debian:trixie-slim@sha256:a99cfc517144bc59b1978475ec53b46ecabec7e43635402ee5b77cc54cd1b20a
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
ARG DEBIAN_MIRROR=https://deb.debian.org
RUN sed -i "s|http://deb.debian.org|${DEBIAN_MIRROR}|g" /etc/apt/sources.list.d/debian.sources && apt-get -o Acquire::https::CaInfo=/etc/ssl/certs/ca-certificates.crt update --error-on=any && apt-get -o Acquire::https::CaInfo=/etc/ssl/certs/ca-certificates.crt install -y --no-install-recommends ca-certificates curl && rm -rf /var/lib/apt/lists/* && useradd --system --create-home ems
COPY --from=build /src/target/release/ems /usr/local/bin/ems
COPY --from=build /src/LICENSE /usr/share/licenses/ems/LICENSE
USER ems
WORKDIR /home/ems
EXPOSE 23334 23335
ENTRYPOINT ["/usr/local/bin/ems"]
