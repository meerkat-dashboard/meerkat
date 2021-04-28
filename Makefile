PROJECT_NAME := meerkat
IMAGE := hub.sol1.net/${PROJECT_NAME}
TAG := latest
BUILD_OPTS := --build-arg=http_proxy="${http_proxy}"

.PHONY: default
default: push
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

.PHONY: backend-dev
backend-dev:
	docker build --pull ${BUILD_OPTS} --target backend-build -t ${PROJECT_NAME}-backend-dev:latest .
	docker rm -f ${PROJECT_NAME}-backend-dev || true
	docker run --rm -it --name ${PROJECT_NAME}-backend-dev --hostname ${PROJECT_NAME}-backend -v $$(pwd)/backend:/tmp/backend -v $$(pwd)/frontend:/tmp/backend/frontend:ro -e HOME=/tmp --workdir /tmp/backend -u $$(id -u) -p 8585 ${PROJECT_NAME}-backend-dev:latest /bin/sh

.PHONY: frontend-dev
frontend-dev:
	docker rm -f ${PROJECT_NAME}-frontend-dev || true
	docker run --rm -it --name ${PROJECT_NAME}-frontend-dev -v $$(pwd)/frontend:/tmp/frontend --workdir /tmp/frontend -u $$(id -u) -e HOME=/tmp node:lts /bin/sh -c 'npm install && npm run dev -- --watch'

.PHONY: frontend-shell
frontend-shell:
	docker rm -f ${PROJECT_NAME}-frontend-dev-shell 2>/dev/null || true
	docker run --rm -it --name ${PROJECT_NAME}-frontend-dev-shell -v $$(pwd)/frontend:/tmp/frontend --workdir /tmp/frontend -u $$(id -u) -e HOME=/tmp node:lts /bin/sh -c 'npm install && /bin/sh'

.PHONY: browse-dev
browse-dev:
	@if [ -n "$$(command -v xdg-open)" ]; then \
		xdg-open http://$$(docker inspect --format='{{.NetworkSettings.IPAddress}}' ${PROJECT_NAME}-backend-dev):8585; \
	else \
		open http://localhost:$$(docker inspect --format='{{(index (index .NetworkSettings.Ports "8585/tcp") 0).HostPort}}' ${PROJECT_NAME}-backend-dev); \
	fi

.PHONY: deploy
deploy:
	git pull
	docker-compose up --build --force-recreate -d

