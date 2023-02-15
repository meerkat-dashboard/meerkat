FROM node:16-alpine
COPY . .
WORKDIR ui
RUN npm ci && npm run build

FROM golang:1.19-alpine
COPY . meerkat
COPY --from=0 ui/dist meerkat/ui/dist
WORKDIR meerkat
RUN go install ./cmd/meerkat

FROM alpine:3.17
COPY --from=1 /go/bin/meerkat /usr/local/bin
RUN mkdir dashboards && chown nobody dashboards
USER nobody
CMD meerkat
