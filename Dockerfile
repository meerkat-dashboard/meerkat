FROM golang:alpine
WORKDIR /go/src/meerkat
COPY . .
RUN go build

FROM node:lts
WORKDIR /root
COPY --from=0 /go/src/meerkat .
WORKDIR frontend
RUN npm install
RUN npm run prod

FROM alpine:latest
WORKDIR /meerkat
COPY --from=0 /go/src/meerkat .
COPY --from=1 /root/frontend frontend
VOLUME /meerkat/config
VOLUME /meerkat/dashboards
VOLUME /meerkat/dashboards-data
CMD ["/meerkat/meerkat", "-config", "/meerkat/config/meerkat.toml"]
