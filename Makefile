PROJECT_NAME := meerkat
IMAGE := hub.sol1.net/${PROJECT_NAME}
TAG := latest
BUILD_OPTS := --build-arg=http_proxy="${http_proxy}"

.PHONY: default
default: build
	@printf "${IMAGE}:${TAG} ready\n"

.PHONY: push
push: build git-check
	docker push ${IMAGE}:${TAG}

.PHONY: build
build:
	docker build --pull ${BUILD_OPTS} -t ${IMAGE}:${TAG} .

.PHONY: git-check
git-check:
	@if [ "${TAG}" = "latest" ]; then \
		if [ -n "$$(git status --porcelain)" ]; then \
			echo "\033[1;31mCan only build 'latest' from a clean working copy\033[0m" >&2; \
			echo "\033[1;31mFor testing purposes, provide an alternate tag, eg make TAG=bobtest\033[0m" >&2; \
			exit 1; \
		fi; \
		git push; \
	fi
