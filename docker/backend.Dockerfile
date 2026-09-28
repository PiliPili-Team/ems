FROM rust:1.95 AS build
WORKDIR /src
COPY . .
RUN cargo build --release --workspace --frozen

FROM debian:bookworm-slim
RUN useradd --system --create-home ems
COPY --from=build /src/target/release/ems /usr/local/bin/ems
USER ems
EXPOSE 23334 23335
ENTRYPOINT ["/usr/local/bin/ems"]
