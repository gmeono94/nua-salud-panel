FROM golang:1.25-alpine

RUN apk add --no-cache git curl postgresql-client

# air para hot reload
RUN go install github.com/air-verse/air@v1.63.0

# migrate CLI para migraciones
RUN curl -L https://github.com/golang-migrate/migrate/releases/download/v4.18.1/migrate.linux-amd64.tar.gz | tar xz -C /usr/local/bin

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

EXPOSE 3001

CMD ["air"]
