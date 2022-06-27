FROM golang:1.16.10-alpine AS backend-build
RUN apk add --update --no-cache gcc libc-dev git

FROM backend-build AS backend
COPY ./backend /root/backend
WORKDIR /root/backend
RUN go build

FROM node:lts AS frontend
COPY ./frontend /root/frontend
COPY ./version /root/version
WORKDIR /root/frontend
RUN npm install && npm run prod

FROM alpine:latest
WORKDIR /meerkat
COPY --from=backend /root/backend/meerkat .
COPY --from=frontend /root/frontend frontend

USER 9001

ENTRYPOINT ["/meerkat/meerkat", "-config", "/meerkat/config/meerkat.toml"]
